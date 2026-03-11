import { NextRequest, NextResponse } from "next/server"

/* Models that actually exist as of 2026 — all use v1beta */
const MODELS = [
  "gemini-2.5-flash-lite",  // cheapest, fastest
  "gemini-2.5-flash",       // very capable
  "gemini-2.0-flash-lite",  // fallback
]

const API_VERSION = "v1beta"

const MAX_RETRIES = 2
const INITIAL_DELAY_MS = 5000
const BETWEEN_MODELS_DELAY_MS = 3000
const RETRYABLE_BUSY_STATUSES = new Set([500, 502, 503, 504])

/* ── Per-key cooldown: minimum 4 s between any Gemini call ── */
let lastApiCallTime = 0
async function waitForCooldown() {
  const gap = Date.now() - lastApiCallTime
  if (gap < 4000) await sleep(4000 - gap)
}

/* ── Simple in-memory rate limiter ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10 // max requests per minute per IP

function getRateLimitStatus(ip: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { limited: false, retryAfterSec: 0 }
  }
  entry.count++
  const limited = entry.count > RATE_LIMIT_MAX
  return {
    limited,
    retryAfterSec: limited ? Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) : 0,
  }
}

async function callGemini(
  model: string,
  key: string,
  base64Data: string,
  mimeType: string,
  prompt: string
) {
  const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${key}`
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } },
          ],
        },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rateLimit = getRateLimitStatus(clientIp)
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait before trying again.",
          retryAfter: rateLimit.retryAfterSec,
        },
        { status: 429 }
      )
    }

    const { image } = await req.json()

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Image is required and must be a string" },
        { status: 400 }
      )
    }
    /* ── Validate base64 image size (max ~15MB encoded) ── */
    if (image.length > 20_000_000) {
      return NextResponse.json(
        { error: "Image too large. Please upload an image under 15MB." },
        { status: 400 }
      )
    }

    /* ── Build ordered list of API keys to try ── */
    const apiKeys = [
      process.env.GEMINI_CROP_API_KEY,  // dedicated crop key (primary)
      process.env.GEMINI_API_KEY,        // shared key (fallback)
    ].filter(Boolean) as string[]

    if (apiKeys.length === 0) {
      return NextResponse.json(
        { error: "No Gemini API key is configured on the server" },
        { status: 500 }
      )
    }

    // Strip the data-url prefix if present and detect mime type
    let mimeType = "image/jpeg"
    let base64Data = image
    if (image.includes("base64,")) {
      const prefix = image.split("base64,")[0]
      base64Data = image.split("base64,")[1]
      const mimeMatch = prefix.match(/data:([^;]+);/)
      if (mimeMatch) mimeType = mimeMatch[1]
    }

    const prompt = `You are an expert agricultural AI assistant. First, determine whether this image contains a real crop, plant, or agricultural field. If the image does NOT contain any crop, plant, leaf, or agricultural content (e.g. it is a person, animal, object, vehicle, building, random photo, screenshot, meme, etc.), return ONLY this JSON and nothing else:
{"not_crop": true, "message": "This is not a crop image. Please upload a photo of a crop, plant, or leaf."}

If the image DOES contain a crop/plant/leaf, analyze it very carefully and provide a detailed assessment in the following JSON format. Be specific and practical in your recommendations. IMPORTANT: Provide BOTH English AND Hindi text for every descriptive field as shown below.

Return ONLY valid JSON (no markdown, no code fences), exactly in this structure:
{
  "crop_name": "Name of the crop in English",
  "crop_name_hi": "फसल का नाम हिंदी में",
  "health": {
    "percentage": <number 0-100>,
    "status": "Healthy" | "Moderate" | "Unhealthy" | "Critical",
    "status_hi": "स्वस्थ" | "मध्यम" | "अस्वस्थ" | "गंभीर",
    "summary": "A 1-2 sentence summary of overall crop health in English",
    "summary_hi": "फसल स्वास्थ्य का 1-2 वाक्य सारांश हिंदी में",
    "issues": ["list of specific issues observed in English"],
    "issues_hi": ["समस्याओं की सूची हिंदी में"]
  },
  "nutrition": {
    "summary": "Overall nutrition assessment in English",
    "summary_hi": "पोषण मूल्यांकन हिंदी में",
    "deficiencies": [
      {
        "nutrient": "Nutrient name in English",
        "nutrient_hi": "पोषक तत्व का नाम हिंदी में",
        "severity": "Low" | "Medium" | "High",
        "recommendation": "What to apply and how much in English",
        "recommendation_hi": "क्या और कितना लगाना है हिंदी में"
      }
    ],
    "sufficient": ["List of adequate nutrients in English"],
    "sufficient_hi": ["पर्याप्त पोषक तत्वों की सूची हिंदी में"]
  },
  "irrigation": {
    "status": "Over-irrigated" | "Well-irrigated" | "Under-irrigated" | "Critically dry",
    "status_hi": "सिंचाई स्थिति हिंदी में",
    "percentage": <number 0-100 representing current irrigation adequacy>,
    "recommendation": "Practical irrigation advice in English",
    "recommendation_hi": "सिंचाई सलाह हिंदी में"
  },
  "harvest": {
    "estimated_time": "e.g. 2-3 weeks, 1-2 months etc.",
    "estimated_time_hi": "अनुमानित समय हिंदी में",
    "growth_stage": "e.g. Seedling, Vegetative, Flowering, Fruiting, Maturity, Ready to harvest",
    "growth_stage_hi": "विकास चरण हिंदी में",
    "recommendation": "When and how to harvest in English",
    "recommendation_hi": "कटाई की सलाह हिंदी में"
  },
  "additional_tips": [
    "Extra practical tips in English"
  ],
  "additional_tips_hi": [
    "अतिरिक्त सुझाव हिंदी में"
  ]
}

Analyze the image thoroughly. If you cannot identify the crop with certainty, make your best assessment and note the uncertainty. Always provide actionable advice a farmer can use. Make sure ALL Hindi translations are accurate and natural-sounding.`

    /* ── Try each key, then each model; switch key immediately on 429 ── */
    let lastError = ""
    let retryAfterSec = 60
    let hitRateLimit = false
    let hitTemporaryBusy = false

    for (let ki = 0; ki < apiKeys.length; ki++) {
      const key = apiKeys[ki]
      const keyLabel = ki === 0 ? "primary" : "fallback"
      console.log(`[analyze-crop] trying ${keyLabel} key`)

      let keyRateLimited = false

      let firstModel = true
      for (const model of MODELS) {
        if (keyRateLimited) break

        if (!firstModel) {
          console.log(`[analyze-crop] waiting ${BETWEEN_MODELS_DELAY_MS}ms before next model...`)
          await sleep(BETWEEN_MODELS_DELAY_MS)
        }
        firstModel = false
        let delay = INITIAL_DELAY_MS

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          console.log(
            `[analyze-crop] key=${keyLabel} model=${model} attempt=${attempt + 1}/${MAX_RETRIES}`
          )

          await waitForCooldown()
          const geminiResponse = await callGemini(model, key, base64Data, mimeType, prompt)

          if (geminiResponse.ok) {
            const data = await geminiResponse.json()
            const textContent =
              data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

            let jsonStr = textContent.trim()
            if (jsonStr.startsWith("```")) {
              jsonStr = jsonStr
                .replace(/^```(?:json)?\n?/, "")
                .replace(/\n?```$/, "")
            }

            try {
              const analysis = JSON.parse(jsonStr)

              if (analysis.not_crop) {
                return NextResponse.json(
                  { error: analysis.message || "This is not a crop image. Please upload a photo of a crop, plant, or leaf.", not_crop: true },
                  { status: 400 }
                )
              }

              lastApiCallTime = Date.now()
              return NextResponse.json({ analysis })
            } catch {
              console.error("JSON parse failed:", textContent.slice(0, 300))
              lastError = "Failed to parse AI response. Please try again."
              break
            }
          }

          if (geminiResponse.status === 429) {
            hitRateLimit = true
            keyRateLimited = true
            const errText = await geminiResponse.text()
            const retryAfterHeader = geminiResponse.headers.get("retry-after")
            const parsedRetryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : Number.NaN
            if (!Number.isNaN(parsedRetryAfter) && parsedRetryAfter > 0) {
              retryAfterSec = parsedRetryAfter
            }
            console.warn(
              `[analyze-crop] 429 on ${keyLabel}/${model}, waiting ${delay}ms...`,
              errText.slice(0, 120)
            )
            lastError =
              `Rate limit reached. Please wait ${retryAfterSec} seconds and try again. (Free Gemini tier allows ~15 requests/minute)`

            if (attempt < MAX_RETRIES - 1) {
              await sleep(delay)
              delay *= 2
              continue
            }
            // 429 is generally key/quota scoped; avoid wasting calls by trying more models on the same key.
            break
          }

          if (RETRYABLE_BUSY_STATUSES.has(geminiResponse.status)) {
            hitTemporaryBusy = true
            const errText = await geminiResponse.text()
            console.warn(
              `[analyze-crop] temporary busy ${geminiResponse.status} on ${keyLabel}/${model}`,
              errText.slice(0, 120)
            )
            lastError = "AI service is currently experiencing high demand. Please retry shortly."

            if (attempt < MAX_RETRIES - 1) {
              await sleep(delay)
              delay *= 2
              continue
            }
            break
          }

          if (geminiResponse.status === 404) {
            console.warn(`[analyze-crop] model ${model} not found, trying next`)
            lastError = `Model ${model} not available`
            break
          }

          // Other error
          const errText = await geminiResponse.text()
          console.error(`[analyze-crop] ${geminiResponse.status}:`, errText)
          return NextResponse.json(
            {
              error: `Gemini API error (${geminiResponse.status}): ${errText.slice(0, 200)}`,
            },
            { status: geminiResponse.status }
          )
        }
      }

      if (keyRateLimited && ki < apiKeys.length - 1) {
        console.log(`[analyze-crop] key ${keyLabel} rate-limited, switching to fallback key...`)
      }
    }

    // All models exhausted
    if (hitRateLimit) {
      return NextResponse.json(
        {
          error:
            lastError ||
            `Rate limit reached. Please wait ${retryAfterSec} seconds and try again. (Free Gemini tier allows ~15 requests/minute)`,
          retryAfter: retryAfterSec,
        },
        { status: 429 }
      )
    }

    if (hitTemporaryBusy) {
      return NextResponse.json(
        {
          error: lastError || "AI service is currently experiencing high demand. Please retry in 15-30 seconds.",
          retryAfter: 20,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: lastError || "Unable to analyze crop image right now. Please try again.",
      },
      { status: 500 }
    )
  } catch (err: any) {
    console.error("analyze-crop route error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
