import { NextRequest, NextResponse } from "next/server"
import {
  addSecurityHeaders,
  addCorsHeaders,
  getClientIp,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/security"
import { logError } from "@/lib/errors"
import { TelemetryService } from "@/lib/telemetry"

// Initialize telemetry
const telemetry = new TelemetryService({
  enabled: true,
  batchSize: 10,
  flushIntervalMs: 5000,
  endpoint: process.env.TELEMETRY_ENDPOINT || '/api/telemetry',
  retryAttempts: 3,
})

/* Models that actually exist as of 2026 — all use v1beta */
const MODELS = [
  "gemini-2.5-flash-lite",  // cheapest, fastest
  "gemini-2.5-flash",       // fallback
]

const API_VERSION = "v1beta"

const MAX_RETRIES = 1
const INITIAL_DELAY_MS = 5000

/* ── In-memory cache to avoid repeated API calls ── */
const cache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

async function callGeminiText(model: string, key: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${key}`
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function OPTIONS(req: NextRequest) {
  const response = NextResponse.json(null, { status: 200 })
  return addCorsHeaders(response)
}

export async function GET(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const clientIp = getClientIp(req)
    const { limited, retryAfterSec } = checkRateLimit(clientIp, 5, 60 * 1000)

    const { searchParams } = new URL(req.url)
    const rawState = searchParams.get("state") || "India"
    const state = rawState.replace(/[^a-zA-Z\s-]/g, "").slice(0, 50) || "India"
    const cacheKey = `schemes_${state.toLowerCase()}`

    /* ── Check cache first ── */
    const cached = cache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return createSuccessResponse(cached.data, 200)
    }

    if (limited) {
      // If rate-limited but we have stale cache, return it
      if (cached) {
        return createSuccessResponse(cached.data, 200)
      }
      return createErrorResponse(
        "Too many requests. Please wait before trying again.",
        429,
        { retryAfter: retryAfterSec }
      )
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      logError(new Error("GEMINI_API_KEY not configured"))
      return createErrorResponse("Service not configured", 500)
    }

    const prompt = `You are an expert on Indian government agricultural schemes. Provide exactly 5 REAL, CURRENTLY ACTIVE government schemes for farmers in ${state}, India.

Return ONLY valid JSON (no markdown, no code fences):
{
  "schemes": [
    {
      "name": "Official scheme name",
      "name_hi": "हिंदी नाम",
      "description": "1-2 sentence description",
      "description_hi": "विवरण हिंदी में",
      "benefit": "Key benefit (e.g. Rs 6,000/year)",
      "category": "Category",
      "category_hi": "श्रेणी",
      "status": "Active",
      "website": "real .gov.in URL",
      "apply_url": "application URL"
    }
  ]
}

Only include real schemes with real .gov.in URLs. Include PM-KISAN, PMFBY, KCC, Soil Health Card, PMKSY. Keep descriptions short to save tokens.`

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
            // Cache the successful result
            cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
            
            // Track successful schemes retrieval
            telemetry.trackEvent('schemes_retrieved', undefined, {
              state: state,
              scheme_count: result.schemes?.length || 0,
            })
            
            return createSuccessResponse(result, 200)
          } catch (parseErr) {
            logError(parseErr, { context: "JSON parse failed in gov-schemes" })
            lastError = "Failed to parse AI response. Please try again."
            break
          }
        }

        if (res.status === 429) {
          const errText = await res.text()
          console.warn(`[gov-schemes] 429 on ${model}`, errText.slice(0, 120))
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
        logError(new Error(`Gemini API error ${res.status}`), { context: "gov-schemes" })
        return createErrorResponse(`Service error: ${res.status}`, res.status)
      }
    }

    // All models exhausted — return fallback static data so the page always works
    console.warn("[gov-schemes] All models failed, returning fallback data. Last error:", lastError)
    return createSuccessResponse({ schemes: FALLBACK_SCHEMES }, 200)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logError(error, { context: "gov-schemes route" })
    
    // Track error
    telemetry.trackError(error, { endpoint: '/api/gov-schemes' })
    
    return createSuccessResponse({ schemes: FALLBACK_SCHEMES }, 200)
  }
}

/* ── Hardcoded fallback schemes — always available ── */
const FALLBACK_SCHEMES = [
  {
    name: "PM-KISAN Samman Nidhi",
    name_hi: "\u092a\u094d\u0930\u0927\u093e\u0928\u092e\u0902\u0924\u094d\u0930\u0940 \u0915\u093f\u0938\u093e\u0928 \u0938\u092e\u094d\u092e\u093e\u0928 \u0928\u093f\u0927\u093f",
    description: "Direct income support of Rs 6,000 per year to all landholding farmer families, paid in three equal installments.",
    description_hi: "\u0938\u092d\u0940 \u092d\u0942\u092e\u093f\u0927\u093e\u0930\u0915 \u0915\u093f\u0938\u093e\u0928 \u092a\u0930\u093f\u0935\u093e\u0930\u094b\u0902 \u0915\u094b \u092a\u094d\u0930\u0924\u093f \u0935\u0930\u094d\u0937 \u20b96,000 \u0915\u0940 \u0906\u092f \u0938\u0939\u093e\u092f\u0924\u093e\u0964",
    benefit: "\u20b96,000/year",
    category: "Income Support",
    category_hi: "\u0906\u092f \u0938\u0939\u093e\u092f\u0924\u093e",
    status: "Active",
    website: "https://pmkisan.gov.in",
    apply_url: "https://pmkisan.gov.in/registrationform.aspx",
  },
  {
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    name_hi: "\u092a\u094d\u0930\u0927\u093e\u0928\u092e\u0902\u0924\u094d\u0930\u0940 \u092b\u0938\u0932 \u092c\u0940\u092e\u093e \u092f\u094b\u091c\u0928\u093e",
    description: "Crop insurance providing financial support for crop loss due to natural calamities, pests, and diseases.",
    description_hi: "\u092a\u094d\u0930\u093e\u0915\u0943\u0924\u093f\u0915 \u0906\u092a\u0926\u093e\u0913\u0902 \u0938\u0947 \u092b\u0938\u0932 \u0939\u093e\u0928\u093f \u092a\u0930 \u0935\u093f\u0924\u094d\u0924\u0940\u092f \u0938\u0939\u093e\u092f\u0924\u093e\u0964",
    benefit: "Up to full sum insured",
    category: "Insurance",
    category_hi: "\u092c\u0940\u092e\u093e",
    status: "Active",
    website: "https://pmfby.gov.in",
    apply_url: "https://pmfby.gov.in",
  },
  {
    name: "Kisan Credit Card (KCC)",
    name_hi: "\u0915\u093f\u0938\u093e\u0928 \u0915\u094d\u0930\u0947\u0921\u093f\u091f \u0915\u093e\u0930\u094d\u0921",
    description: "Affordable credit for crop production and post-harvest expenses at subsidized interest rates.",
    description_hi: "\u0930\u093f\u092f\u093e\u092f\u0924\u0940 \u092c\u094d\u092f\u093e\u091c \u0926\u0930\u094b\u0902 \u092a\u0930 \u092b\u0938\u0932 \u0909\u0924\u094d\u092a\u093e\u0926\u0928 \u0915\u0947 \u0932\u093f\u090f \u0915\u093f\u092b\u093e\u092f\u0924\u0940 \u090b\u0923\u0964",
    benefit: "4% interest rate",
    category: "Credit",
    category_hi: "\u090b\u0923",
    status: "Active",
    website: "https://pmkisan.gov.in/KCCForm.aspx",
    apply_url: "https://pmkisan.gov.in/KCCForm.aspx",
  },
  {
    name: "Soil Health Card Scheme",
    name_hi: "\u092e\u0943\u0926\u093e \u0938\u094d\u0935\u093e\u0938\u094d\u0925\u094d\u092f \u0915\u093e\u0930\u094d\u0921 \u092f\u094b\u091c\u0928\u093e",
    description: "Free soil testing with crop-wise nutrient and fertilizer recommendations.",
    description_hi: "\u092b\u0938\u0932-\u0935\u093e\u0930 \u092a\u094b\u0937\u0915 \u0924\u0924\u094d\u0935 \u0905\u0928\u0941\u0936\u0902\u0938\u093e\u0913\u0902 \u0915\u0947 \u0938\u093e\u0925 \u092e\u0941\u092b\u094d\u0924 \u092e\u093f\u091f\u094d\u091f\u0940 \u092a\u0930\u0940\u0915\u094d\u0937\u0923\u0964",
    benefit: "Free soil testing",
    category: "Soil",
    category_hi: "\u092e\u0943\u0926\u093e",
    status: "Active",
    website: "https://soilhealth.dac.gov.in",
    apply_url: "https://soilhealth.dac.gov.in",
  },
  {
    name: "PM Krishi Sinchai Yojana (PMKSY)",
    name_hi: "\u092a\u094d\u0930\u0927\u093e\u0928\u092e\u0902\u0924\u094d\u0930\u0940 \u0915\u0943\u0937\u093f \u0938\u093f\u0902\u091a\u093e\u0908 \u092f\u094b\u091c\u0928\u093e",
    description: "Subsidies up to 55% for micro-irrigation like drip and sprinkler systems.",
    description_hi: "\u0921\u094d\u0930\u093f\u092a \u0914\u0930 \u0938\u094d\u092a\u094d\u0930\u093f\u0902\u0915\u0932\u0930 \u091c\u0948\u0938\u0940 \u0938\u0942\u0915\u094d\u0937\u094d\u092e \u0938\u093f\u0902\u091a\u093e\u0908 \u092a\u0930 55% \u0924\u0915 \u0938\u092c\u094d\u0938\u093f\u0921\u0940\u0964",
    benefit: "Up to 55% subsidy",
    category: "Irrigation",
    category_hi: "\u0938\u093f\u0902\u091a\u093e\u0908",
    status: "Active",
    website: "https://pmksy.gov.in",
    apply_url: "https://pmksy.gov.in",
  },
]
