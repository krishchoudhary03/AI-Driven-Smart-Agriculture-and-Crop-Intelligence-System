/**
 * Tests for formatting and calculation utilities
 */

import {
  formatYield,
  formatTemperature,
  formatMoisture,
  formatNPK,
  calculateAverageYield,
  calculateConfidenceScore,
  parseJSONResponse,
  sanitizeText,
  formatDate,
  calculateDaysToHarvest,
  getConfidenceLevel,
  extractErrorMessage,
} from '@/lib/formatting'

describe('Formatting and Calculation Utilities', () => {
  describe('formatYield', () => {
    it('should format yield correctly', () => {
      expect(formatYield(25.5)).toBe('25.50 q/ha')
      expect(formatYield(0)).toBe('0.00 q/ha')
      expect(formatYield(100.123)).toBe('100.12 q/ha')
    })

    it('should handle invalid values', () => {
      expect(formatYield(NaN)).toBe('N/A')
      expect(formatYield(Infinity)).toBe('N/A')
    })
  })

  describe('formatTemperature', () => {
    it('should format temperature correctly', () => {
      expect(formatTemperature(25)).toBe('25.0°C')
      expect(formatTemperature(-10.5)).toBe('-10.5°C')
      expect(formatTemperature(0)).toBe('0.0°C')
    })

    it('should handle invalid values', () => {
      expect(formatTemperature(NaN)).toBe('N/A')
      expect(formatTemperature(Infinity)).toBe('N/A')
    })
  })

  describe('formatMoisture', () => {
    it('should format moisture correctly', () => {
      expect(formatMoisture(50.123)).toBe('50.1%')
      expect(formatMoisture(0)).toBe('0.0%')
      expect(formatMoisture(100)).toBe('100.0%')
    })

    it('should handle invalid values', () => {
      expect(formatMoisture(NaN)).toBe('N/A')
    })
  })

  describe('formatNPK', () => {
    it('should format NPK values correctly', () => {
      expect(formatNPK(100)).toBe('100.00 kg/ha')
      expect(formatNPK(50.567)).toBe('50.57 kg/ha')
    })

    it('should handle invalid values', () => {
      expect(formatNPK(NaN)).toBe('N/A')
      expect(formatNPK(Infinity)).toBe('N/A')
    })
  })

  describe('calculateAverageYield', () => {
    it('should calculate average yield', () => {
      expect(calculateAverageYield(20, 30)).toBe(25)
      expect(calculateAverageYield(0, 100)).toBe(50)
    })

    it('should handle negative values', () => {
      expect(calculateAverageYield(-10, 10)).toBe(0)
    })

    it('should handle invalid inputs', () => {
      expect(calculateAverageYield(NaN, 50)).toBe(0)
      expect(calculateAverageYield(50, Infinity)).toBe(0)
    })
  })

  describe('calculateConfidenceScore', () => {
    it('should calculate base confidence score', () => {
      const score = calculateConfidenceScore(false, false, false, false)
      expect(score).toBe(50)
    })

    it('should increase score with moisture data', () => {
      const scoreWithMoisture = calculateConfidenceScore(true, false, false, false)
      expect(scoreWithMoisture).toBe(60)
    })

    it('should increase score with temperature data', () => {
      const scoreWithTemp = calculateConfidenceScore(false, true, false, false)
      expect(scoreWithTemp).toBe(60)
    })

    it('should increase score with NPK data', () => {
      const scoreWithNPK = calculateConfidenceScore(false, false, true, false)
      expect(scoreWithNPK).toBe(65)
    })

    it('should increase score with sowing date', () => {
      const scoreWithDate = calculateConfidenceScore(false, false, false, true)
      expect(scoreWithDate).toBe(65)
    })

    it('should reach maximum score with all data', () => {
      const maxScore = calculateConfidenceScore(true, true, true, true)
      expect(maxScore).toBe(100)
      expect(maxScore).toBeLessThanOrEqual(100)
    })
  })

  describe('parseJSONResponse', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "Wheat", "yield": 25}'
      const result = parseJSONResponse(json)
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Wheat')
      expect(result.data.yield).toBe(25)
    })

    it('should parse JSON with markdown code fences', () => {
      const json = '```json\n{"name": "Rice", "yield": 30}\n```'
      const result = parseJSONResponse(json)
      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Rice')
    })

    it('should handle empty response', () => {
      const result = parseJSONResponse('')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Empty')
    })

    it('should handle invalid JSON', () => {
      const result = parseJSONResponse('{invalid json}')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid JSON')
    })

    it('should handle array JSON', () => {
      const json = '[1, 2, 3]'
      const result = parseJSONResponse(json)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should remove code fence variations', () => {
      const json = '```\n{"test": true}\n```'
      const result = parseJSONResponse(json)
      expect(result.success).toBe(true)
    })
  })

  describe('sanitizeText', () => {
    it('should escape HTML characters', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('should escape ampersand', () => {
      expect(sanitizeText('Tom & Jerry')).toBe('Tom &amp; Jerry')
    })

    it('should escape quotes', () => {
      expect(sanitizeText('He said "hello"')).toBe('He said &quot;hello&quot;')
    })

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('')
    })

    it('should handle non-string input', () => {
      expect(sanitizeText(123 as any)).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should format valid date', () => {
      const result = formatDate('2024-04-21')
      expect(result).toContain('2024')
      expect(result).not.toBe('Invalid date')
    })

    it('should handle undefined date', () => {
      expect(formatDate(undefined)).toBe('N/A')
    })

    it('should handle invalid date', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date')
    })

    it('should format ISO date string', () => {
      const result = formatDate('2024-04-21T10:30:00Z')
      expect(result).toContain('2024')
    })
  })

  describe('calculateDaysToHarvest', () => {
    it('should return null for undefined sowing date', () => {
      expect(calculateDaysToHarvest(undefined, 'Wheat')).toBeNull()
    })

    it('should calculate days to harvest for wheat', () => {
      const date30DaysAgo = new Date()
      date30DaysAgo.setDate(date30DaysAgo.getDate() - 30)
      const result = calculateDaysToHarvest(date30DaysAgo.toISOString(), 'Wheat')
      expect(result).toBeDefined()
      expect(result).toBeLessThan(150)
    })

    it('should return positive value for recent sowing', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const result = calculateDaysToHarvest(yesterday.toISOString(), 'Rice')
      expect(result).toBeGreaterThan(0)
    })

    it('should return 0 or negative for old crops', () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setDate(twoYearsAgo.getDate() - 730)
      const result = calculateDaysToHarvest(twoYearsAgo.toISOString(), 'Wheat')
      expect(result).toBeLessThanOrEqual(0)
    })

    it('should handle invalid date string', () => {
      expect(calculateDaysToHarvest('invalid-date', 'Wheat')).toBeNull()
    })
  })

  describe('getConfidenceLevel', () => {
    it('should return High for confidence >= 80', () => {
      expect(getConfidenceLevel(80)).toBe('High')
      expect(getConfidenceLevel(100)).toBe('High')
    })

    it('should return Medium for confidence 60-79', () => {
      expect(getConfidenceLevel(60)).toBe('Medium')
      expect(getConfidenceLevel(79)).toBe('Medium')
    })

    it('should return Low for confidence < 60', () => {
      expect(getConfidenceLevel(59)).toBe('Low')
      expect(getConfidenceLevel(0)).toBe('Low')
    })
  })

  describe('extractErrorMessage', () => {
    it('should extract string error', () => {
      expect(extractErrorMessage('Error occurred')).toBe('Error occurred')
    })

    it('should extract message from error object', () => {
      const error = new Error('Something went wrong')
      expect(extractErrorMessage(error)).toBe('Something went wrong')
    })

    it('should extract error property', () => {
      expect(extractErrorMessage({ error: 'API Error' })).toBe('API Error')
    })

    it('should extract message property', () => {
      expect(extractErrorMessage({ message: 'Validation failed' })).toBe('Validation failed')
    })

    it('should return default message for unknown error', () => {
      expect(extractErrorMessage(null)).toBe('An unknown error occurred')
      expect(extractErrorMessage({})).toBe('An unknown error occurred')
    })
  })
})
