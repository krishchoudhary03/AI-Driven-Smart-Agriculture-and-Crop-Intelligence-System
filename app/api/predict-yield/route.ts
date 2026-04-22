import { NextRequest, NextResponse } from "next/server"
import {
  addSecurityHeaders,
  addCorsHeaders,
  getClientIp,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/security"
import { validateCropName, validateSensorData } from "@/lib/validation"
import { logError, withRetry } from "@/lib/errors"
import { TelemetryService } from "@/lib/telemetry"

// Initialize telemetry
const telemetry = new TelemetryService({
  enabled: true,
  batchSize: 10,
  flushIntervalMs: 5000,
  endpoint: process.env.TELEMETRY_ENDPOINT || '/api/telemetry',
  retryAttempts: 3,
})

/* Models to try in order — lite models have highest free-tier quota */
const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
]

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 2000

async function callGeminiText(
  model: string,
  key: string,
  prompt: string
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
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

export async function POST(req: NextRequest) {
  try {
    /* ── Rate limiting ── */
    const clientIp = getClientIp(req)
    const { limited, retryAfterSec } = checkRateLimit(clientIp, 10, 60 * 1000)
    
    if (limited) {
      return createErrorResponse(
        "Too many requests. Please wait before trying again.",
        429,
        { retryAfter: retryAfterSec }
      )
    }

    const body = await req.json()
    const { crop_name, crop_type, field_size, location, sowing_date, sensor } = body

    // Validate inputs
    const cropValidation = validateCropName(crop_name)
    if (!cropValidation.valid) {
      return createErrorResponse(cropValidation.error || "Invalid crop name", 400)
    }

    const sensorValidation = validateSensorData(sensor)
    if (!sensorValidation.valid) {
      return createErrorResponse(sensorValidation.error || "Invalid sensor data", 400)
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      logError(new Error("GEMINI_API_KEY not configured"))
      return createErrorResponse("Service not configured", 500)
    }

    /* Build context for the model */
    let context = `Crop: ${crop_name}`
    if (crop_type) context += ` (${crop_type})`
    if (field_size) context += `\nField Size: ${field_size}`
    if (location) context += `\nLocation: ${location}`
    if (sowing_date) context += `\nSowing Date: ${sowing_date}`
    if (sensor) {
      context += `\nLatest Sensor Data:`
      if (sensor.moisture != null) context += `\n  Soil Moisture: ${sensor.moisture}%`
      if (sensor.temperature != null) context += `\n  Temperature: ${sensor.temperature}°C`
      if (sensor.nitrogen != null) context += `\n  Nitrogen (N): ${sensor.nitrogen} kg/ha`
      if (sensor.phosphorus != null) context += `\n  Phosphorus (P): ${sensor.phosphorus} kg/ha`
      if (sensor.potassium != null) context += `\n  Potassium (K): ${sensor.potassium} kg/ha`
    }

    const prompt = `You are an expert agricultural yield prediction AI model. Based on the following crop and field data, predict the expected yield.

${context}

Consider the crop type, location/region, sowing date, field size, soil conditions (moisture, temperature, NPK levels) to make your prediction. Use standard Indian agricultural metrics.

Return ONLY valid JSON (no markdown, no code fences), exactly in this structure:
{
  "predicted_yield": <number in quintal per hectare>,
  "yield_range": { "min": <number>, "max": <number> },
  "confidence": <number 0-100>,
  "growth_stage": "Seedling" | "Vegetative" | "Flowering" | "Fruiting" | "Maturity" | "Ready to harvest",
  "factors": [
    { "factor": "factor name", "impact": "Positive" | "Negative" | "Neutral", "detail": "brief explanation" }
  ],
  "recommendation": "1-2 sentence actionable advice to maximize yield",
  "recommendation_hindi": "Same advice in Hindi"
}`

    /* ── Try each model with retries + exponential backoff ── */
    let lastError = ""

    for (const model of MODELS) {
      let delay = INITIAL_DELAY_MS

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        console.log(`[predict-yield] model=${model} attempt=${attempt + 1}/${MAX_RETRIES}`)

        const res = await callGeminiText(model, key, prompt)

        if (res.ok) {
          const data = await res.json()
          const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

          let jsonStr = textContent.trim()
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
          }

          try {
            const prediction = JSON.parse(jsonStr)
            
            // Track successful prediction
            telemetry.trackEvent('yield_predicted', undefined, {
              crop: crop_name,
              predicted_yield: prediction.predicted_yield,
              confidence: prediction.confidence,
            })
            
            return createSuccessResponse({ prediction }, 200)
          } catch (parseErr) {
            logError(parseErr, { context: "JSON parse failed in predict-yield" })
            lastError = "Failed to parse AI response. Please try again."
            break
          }
        }

        if (res.status === 429) {
          const errText = await res.text()
          console.warn(`[predict-yield] 429 on ${model}`, errText.slice(0, 120))
          lastError = "AI service is busy. Retrying..."
          if (attempt < MAX_RETRIES - 1) {
            await sleep(delay)
            delay *= 2
            continue
          }
          break
        }

        if (res.status === 404) {
          console.warn(`[predict-yield] model ${model} not found, trying next`)
          lastError = `Model ${model} not available`
          break
        }

        const errText = await res.text()
        logError(new Error(`Gemini API error ${res.status}`), { context: "predict-yield" })
        return createErrorResponse(`Service error: ${res.status}`, res.status)
      }
    }

    return createErrorResponse(
      lastError || "All AI models are currently rate-limited. Please wait and try again.",
      429
    )
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logError(error, { context: "predict-yield route" })
    
    // Track error
    telemetry.trackError(error, { endpoint: '/api/predict-yield' })
    
    return createErrorResponse(error.message || "Internal server error", 500)
  }
}
