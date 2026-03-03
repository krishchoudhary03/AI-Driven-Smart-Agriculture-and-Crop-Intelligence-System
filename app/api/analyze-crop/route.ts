import { NextRequest, NextResponse } from "next/server"

/* Models to try in order — lite models have highest free-tier quota */
const MODELS = [
  "gemini-2.5-flash-lite",   // newest lite — highest RPM on free tier
  "gemini-2.0-flash-lite",   // stable lite fallback
  "gemini-2.5-flash",        // better quality, slightly lower quota
  "gemini-2.0-flash",        // last resort
]

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 2000 // 2 seconds

async function callGemini(
  model: string,
  key: string,
  base64Data: string,
  prompt: string
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } },
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
    const { image } = await req.json()

    const key = process.env.GEMINI_API_KEY
    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      )
    }
    if (!key) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server" },
        { status: 500 }
      )
    }

    // Strip the data-url prefix if present
    const base64Data = image.includes("base64,")
      ? image.split("base64,")[1]
      : image

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

    /* ── Try each model, with retries + exponential backoff for 429s ── */
    let lastError = ""

    for (const model of MODELS) {
      let delay = INITIAL_DELAY_MS

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        console.log(
          `[analyze-crop] model=${model} attempt=${attempt + 1}/${MAX_RETRIES}`
        )

        const geminiResponse = await callGemini(model, key, base64Data, prompt)

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

            // If the AI determined this is not a crop image, return an error
            if (analysis.not_crop) {
              return NextResponse.json(
                { error: analysis.message || "This is not a crop image. Please upload a photo of a crop, plant, or leaf.", not_crop: true },
                { status: 400 }
              )
            }

            return NextResponse.json({ analysis })
          } catch {
            console.error("JSON parse failed:", textContent.slice(0, 300))
            lastError = "Failed to parse AI response. Please try again."
            break // don't retry parse failures on the same model
          }
        }

        // 429 = rate limit → wait and retry, or try next model
        if (geminiResponse.status === 429) {
          const errText = await geminiResponse.text()
          console.warn(
            `[analyze-crop] 429 on ${model}, waiting ${delay}ms...`,
            errText.slice(0, 120)
          )
          lastError =
            "AI service is busy. Retrying automatically — please wait..."

          if (attempt < MAX_RETRIES - 1) {
            await sleep(delay)
            delay *= 2 // exponential backoff
            continue
          }
          // exhausted retries for this model → try next model
          break
        }

        // 404 = model not found → skip to next model immediately
        if (geminiResponse.status === 404) {
          console.warn(`[analyze-crop] model ${model} not found, trying next`)
          lastError = `Model ${model} not available`
          break
        }

        // Other error → report immediately
        const errText = await geminiResponse.text()
        console.error(`[analyze-crop] ${geminiResponse.status}:`, errText)
        return NextResponse.json(
          {
            error: `Gemini API error (${geminiResponse.status}): ${errText.slice(
              0,
              200
            )}`,
          },
          { status: geminiResponse.status }
        )
      }
    }

    // All models exhausted
    return NextResponse.json(
      {
        error:
          lastError ||
          "All AI models are currently rate-limited. Please wait 1-2 minutes and try again.",
      },
      { status: 429 }
    )
  } catch (err: any) {
    console.error("analyze-crop route error:", err)
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
