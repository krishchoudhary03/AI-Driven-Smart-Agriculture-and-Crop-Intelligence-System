import { NextRequest, NextResponse } from "next/server"

/* Models to try in order — lite models have highest free-tier quota */
const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
]

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 2000

/* ── Simple in-memory rate limiter ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

async function callGeminiText(model: string, key: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      )
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server" },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(req.url)
    const rawState = searchParams.get("state") || "India"
    // Sanitize: allow only letters, spaces, and hyphens
    const state = rawState.replace(/[^a-zA-Z\s-]/g, "").slice(0, 50) || "India"

    const prompt = `You are an expert on Indian government agricultural schemes and subsidies. Provide a list of 8-10 REAL, CURRENTLY ACTIVE government schemes for farmers in ${state}, India.

For each scheme, provide accurate and up-to-date information. Include both central government and state-level schemes if applicable.

Return ONLY valid JSON (no markdown, no code fences), exactly in this structure:
{
  "schemes": [
    {
      "name": "Official scheme name in English",
      "name_hi": "योजना का नाम हिंदी में",
      "description": "2-3 sentence description of the scheme, eligibility, and benefits in English",
      "description_hi": "योजना का विवरण हिंदी में",
      "benefit": "Key financial benefit (e.g. Rs 6,000/year, 50% subsidy, etc.)",
      "category": "Category in English (e.g. Income Support, Insurance, Credit, Irrigation, Equipment, Soil, Education, Market)",
      "category_hi": "श्रेणी हिंदी में",
      "status": "Active" | "Enrolling" | "Apply Now",
      "website": "Official website URL (must be a real .gov.in or .nic.in URL)",
      "apply_url": "Direct application/registration URL if available, otherwise same as website"
    }
  ]
}

IMPORTANT RULES:
1. Only include REAL schemes that actually exist and are currently active
2. Website URLs MUST be real, working government websites (e.g. pmkisan.gov.in, pmfby.gov.in, etc.)
3. Include popular schemes like PM-KISAN, PMFBY, KCC, PM-KISAN Samman Nidhi, Soil Health Card, SMAM, PMKSY etc.
4. If providing state-specific schemes for ${state}, make sure they are real
5. Benefit amounts must be accurate and current
6. All Hindi translations must be natural and accurate`

    let lastError = ""

    for (const model of MODELS) {
      let delay = INITIAL_DELAY_MS

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        console.log(`[gov-schemes] model=${model} attempt=${attempt + 1}/${MAX_RETRIES}`)

        const res = await callGeminiText(model, key, prompt)

        if (res.ok) {
          const data = await res.json()
          const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

          let jsonStr = textContent.trim()
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
          }

          try {
            const result = JSON.parse(jsonStr)
            return NextResponse.json(result)
          } catch {
            console.error("JSON parse failed:", textContent.slice(0, 300))
            lastError = "Failed to parse AI response. Please try again."
            break
          }
        }

        if (res.status === 429) {
          const errText = await res.text()
          console.warn(`[gov-schemes] 429 on ${model}, waiting ${delay}ms...`, errText.slice(0, 120))
          lastError = "AI service is busy. Retrying..."
          if (attempt < MAX_RETRIES - 1) {
            await sleep(delay)
            delay *= 2
            continue
          }
          break
        }

        if (res.status === 404) {
          console.warn(`[gov-schemes] model ${model} not found, trying next`)
          lastError = `Model ${model} not available`
          break
        }

        const errText = await res.text()
        console.error(`[gov-schemes] ${res.status}:`, errText)
        return NextResponse.json(
          { error: `Gemini API error (${res.status}): ${errText.slice(0, 200)}` },
          { status: res.status }
        )
      }
    }

    return NextResponse.json(
      { error: lastError || "All AI models are currently rate-limited. Please wait and try again." },
      { status: 429 }
    )
  } catch (err: any) {
    console.error("gov-schemes route error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
