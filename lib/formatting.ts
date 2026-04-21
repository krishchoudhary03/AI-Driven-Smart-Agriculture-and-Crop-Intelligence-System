/**
 * Helper utilities for data formatting and calculations
 */

/**
 * Format yield value with proper units (quintal per hectare)
 */
export function formatYield(value: number): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return 'N/A'
  }
  return `${value.toFixed(2)} q/ha`
}

/**
 * Format temperature with Celsius symbol
 */
export function formatTemperature(value: number): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return 'N/A'
  }
  return `${value.toFixed(1)}°C`
}

/**
 * Format soil moisture percentage
 */
export function formatMoisture(value: number): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return 'N/A'
  }
  return `${value.toFixed(1)}%`
}

/**
 * Format NPK values (kg/ha)
 */
export function formatNPK(value: number): string {
  if (typeof value !== 'number' || !isFinite(value)) {
    return 'N/A'
  }
  return `${value.toFixed(2)} kg/ha`
}

/**
 * Calculate average yield from range
 */
export function calculateAverageYield(min: number, max: number): number {
  if (!isFinite(min) || !isFinite(max)) {
    return 0
  }
  return (min + max) / 2
}

/**
 * Calculate confidence score based on data completeness (0-100)
 */
export function calculateConfidenceScore(
  hasMoisture: boolean,
  hasTemperature: boolean,
  hasNPK: boolean,
  hasSowingDate: boolean
): number {
  let score = 50 // base score
  if (hasMoisture) score += 10
  if (hasTemperature) score += 10
  if (hasNPK) score += 15
  if (hasSowingDate) score += 15
  return Math.min(100, score)
}

/**
 * Parse JSON response with error handling
 */
export function parseJSONResponse(text: string): { success: boolean; data?: any; error?: string } {
  if (!text) {
    return { success: false, error: 'Empty response' }
  }

  let jsonStr = text.trim()

  // Remove markdown code fences if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const data = JSON.parse(jsonStr)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

/**
 * Sanitize text for safe display
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return ''
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) {
    return 'N/A'
  }
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return 'Invalid date'
  }
}

/**
 * Calculate days until harvest based on sowing date and growth stage
 */
export function calculateDaysToHarvest(
  sowingDate: string | undefined,
  cropType: string | undefined
): number | null {
  if (!sowingDate) {
    return null
  }

  try {
    const sown = new Date(sowingDate)
    if (isNaN(sown.getTime())) {
      return null
    }
    const today = new Date()
    const daysSinceSowing = Math.floor((today.getTime() - sown.getTime()) / (1000 * 60 * 60 * 24))

    // Rough estimates for common crops (in days)
    const cropDurations: Record<string, number> = {
      wheat: 150,
      rice: 180,
      corn: 120,
      cotton: 200,
      sugarcane: 365,
      potato: 90,
      tomato: 100,
    }

    const cropLower = (cropType || '').toLowerCase()
    const totalDuration = Object.entries(cropDurations).find(([key]) => cropLower.includes(key))?.[1] || 150

    return Math.max(0, totalDuration - daysSinceSowing)
  } catch {
    return null
  }
}

/**
 * Categorize yield prediction confidence
 */
export function getConfidenceLevel(confidence: number): 'Low' | 'Medium' | 'High' {
  if (confidence >= 80) return 'High'
  if (confidence >= 60) return 'Medium'
  return 'Low'
}

/**
 * Extract error message from API response
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  return 'An unknown error occurred'
}
