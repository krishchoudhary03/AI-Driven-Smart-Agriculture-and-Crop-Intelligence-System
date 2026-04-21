/**
 * Tests for yield prediction calculation logic
 */

import {
  calculateAverageYield,
  calculateConfidenceScore,
  getConfidenceLevel,
  parseJSONResponse,
} from '@/lib/formatting'

describe('Yield Prediction Calculation Logic', () => {
  describe('Yield Range Calculation', () => {
    it('should calculate yield range from min and max', () => {
      const minYield = 20
      const maxYield = 30
      const avgYield = calculateAverageYield(minYield, maxYield)
      expect(avgYield).toBe(25)
    })

    it('should handle large yield values', () => {
      const avgYield = calculateAverageYield(100, 200)
      expect(avgYield).toBe(150)
    })

    it('should handle decimal yield values', () => {
      const avgYield = calculateAverageYield(20.5, 30.7)
      expect(avgYield).toBeCloseTo(25.6, 1)
    })

    it('should calculate yield with different ranges', () => {
      const ranges = [
        { min: 10, max: 20, expected: 15 },
        { min: 25, max: 35, expected: 30 },
        { min: 40, max: 60, expected: 50 },
      ]

      ranges.forEach(({ min, max, expected }) => {
        expect(calculateAverageYield(min, max)).toBe(expected)
      })
    })
  })

  describe('Confidence Score Calculation', () => {
    it('should start with base score of 50', () => {
      const score = calculateConfidenceScore(false, false, false, false)
      expect(score).toBe(50)
    })

    it('should add 10 points for moisture data', () => {
      const scoreWithoutMoisture = calculateConfidenceScore(false, false, false, false)
      const scoreWithMoisture = calculateConfidenceScore(true, false, false, false)
      expect(scoreWithMoisture).toBe(scoreWithoutMoisture + 10)
    })

    it('should add 10 points for temperature data', () => {
      const scoreWithoutTemp = calculateConfidenceScore(false, false, false, false)
      const scoreWithTemp = calculateConfidenceScore(false, true, false, false)
      expect(scoreWithTemp).toBe(scoreWithoutTemp + 10)
    })

    it('should add 15 points for NPK data', () => {
      const scoreWithoutNPK = calculateConfidenceScore(false, false, false, false)
      const scoreWithNPK = calculateConfidenceScore(false, false, true, false)
      expect(scoreWithNPK).toBe(scoreWithoutNPK + 15)
    })

    it('should add 15 points for sowing date', () => {
      const scoreWithoutDate = calculateConfidenceScore(false, false, false, false)
      const scoreWithDate = calculateConfidenceScore(false, false, false, true)
      expect(scoreWithDate).toBe(scoreWithoutDate + 15)
    })

    it('should cap score at 100', () => {
      const maxScore = calculateConfidenceScore(true, true, true, true)
      expect(maxScore).toBeLessThanOrEqual(100)
    })

    it('should combine multiple data sources', () => {
      const combinedScore = calculateConfidenceScore(true, true, true, true)
      expect(combinedScore).toBe(100)
    })

    it('should calculate intermediate combinations', () => {
      const score1 = calculateConfidenceScore(true, true, false, false)
      expect(score1).toBe(70) // 50 + 10 + 10
    })
  })

  describe('Confidence Level Classification', () => {
    it('should classify High confidence (80+)', () => {
      expect(getConfidenceLevel(80)).toBe('High')
      expect(getConfidenceLevel(90)).toBe('High')
      expect(getConfidenceLevel(100)).toBe('High')
    })

    it('should classify Medium confidence (60-79)', () => {
      expect(getConfidenceLevel(60)).toBe('Medium')
      expect(getConfidenceLevel(70)).toBe('Medium')
      expect(getConfidenceLevel(79)).toBe('Medium')
    })

    it('should classify Low confidence (<60)', () => {
      expect(getConfidenceLevel(0)).toBe('Low')
      expect(getConfidenceLevel(30)).toBe('Low')
      expect(getConfidenceLevel(59)).toBe('Low')
    })

    it('should classify boundary values correctly', () => {
      expect(getConfidenceLevel(59)).toBe('Low')
      expect(getConfidenceLevel(60)).toBe('Medium')
      expect(getConfidenceLevel(79)).toBe('Medium')
      expect(getConfidenceLevel(80)).toBe('High')
    })
  })

  describe('Yield Prediction Response Parsing', () => {
    it('should parse valid yield prediction response', () => {
      const mockResponse = JSON.stringify({
        prediction: {
          predicted_yield: 28.5,
          yield_range: { min: 25, max: 32 },
          confidence: 85,
          growth_stage: 'Flowering',
        },
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data.prediction.predicted_yield).toBe(28.5)
      expect(result.data.prediction.confidence).toBe(85)
    })

    it('should validate yield range is reasonable', () => {
      const mockResponse = JSON.stringify({
        predicted_yield: 25,
        yield_range: { min: 20, max: 30 },
        confidence: 75,
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      const { predicted_yield, yield_range } = result.data
      expect(predicted_yield).toBeGreaterThanOrEqual(yield_range.min)
      expect(predicted_yield).toBeLessThanOrEqual(yield_range.max)
    })

    it('should handle yield factors', () => {
      const mockResponse = JSON.stringify({
        predicted_yield: 28,
        factors: [
          { factor: 'Soil Moisture', impact: 'Positive', detail: 'Optimal levels' },
          { factor: 'Temperature', impact: 'Neutral', detail: 'Within range' },
          { factor: 'NPK Levels', impact: 'Negative', detail: 'Low nitrogen' },
        ],
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.factors)).toBe(true)
      expect(result.data.factors.length).toBe(3)
    })

    it('should include recommendations', () => {
      const mockResponse = JSON.stringify({
        predicted_yield: 26,
        recommendation: 'Increase nitrogen fertilizer application',
        recommendation_hindi: 'नाइट्रोजन खाद का उपयोग बढ़ाएं',
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data.recommendation).toBeDefined()
      expect(result.data.recommendation_hindi).toBeDefined()
    })

    it('should handle growth stage information', () => {
      const stages = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Ready to harvest']
      const mockResponse = JSON.stringify({
        growth_stage: 'Flowering',
        days_to_harvest: 45,
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(stages.includes(result.data.growth_stage)).toBe(true)
    })
  })

  describe('Yield Prediction Edge Cases', () => {
    it('should handle very low yield predictions', () => {
      const lowYieldResponse = JSON.stringify({
        predicted_yield: 2,
        confidence: 40,
        warning: 'Severe conditions detected',
      })

      const result = parseJSONResponse(lowYieldResponse)
      expect(result.success).toBe(true)
      expect(result.data.predicted_yield).toBeGreaterThan(0)
    })

    it('should handle very high yield predictions', () => {
      const highYieldResponse = JSON.stringify({
        predicted_yield: 95,
        confidence: 60,
      })

      const result = parseJSONResponse(highYieldResponse)
      expect(result.success).toBe(true)
      expect(result.data.predicted_yield).toBeGreaterThan(0)
    })

    it('should handle missing optional fields', () => {
      const minimalResponse = JSON.stringify({
        predicted_yield: 25,
      })

      const result = parseJSONResponse(minimalResponse)
      expect(result.success).toBe(true)
      expect(result.data.predicted_yield).toBe(25)
    })

    it('should handle uncertainty in predictions', () => {
      const uncertainResponse = JSON.stringify({
        predicted_yield: 25,
        yield_range: { min: 15, max: 35 },
        confidence: 45,
      })

      const result = parseJSONResponse(uncertainResponse)
      expect(result.success).toBe(true)
      expect(result.data.confidence).toBeLessThan(60)
    })
  })

  describe('Yield Calculation with Sensor Data', () => {
    it('should calculate yield boost for optimal moisture', () => {
      const optimalMoisture = calculateConfidenceScore(true, false, false, false)
      expect(optimalMoisture).toBeGreaterThan(50)
    })

    it('should incorporate temperature data', () => {
      const withTemperature = calculateConfidenceScore(false, true, false, false)
      expect(withTemperature).toBeGreaterThan(50)
    })

    it('should highly weight NPK data', () => {
      const npkPoints = calculateConfidenceScore(false, false, true, false) - 50
      const tempPoints = calculateConfidenceScore(false, true, false, false) - 50
      expect(npkPoints).toBeGreaterThan(tempPoints)
    })

    it('should value historical data (sowing date)', () => {
      const datePoints = calculateConfidenceScore(false, false, false, true) - 50
      expect(datePoints).toBeGreaterThan(10)
    })
  })

  describe('Multiple Yield Scenarios', () => {
    it('should handle complete data scenario', () => {
      const completeDataConfidence = calculateConfidenceScore(true, true, true, true)
      expect(completeDataConfidence).toBe(100)
    })

    it('should handle partial data scenario', () => {
      const partialDataConfidence = calculateConfidenceScore(true, false, true, false)
      expect(partialDataConfidence).toBeGreaterThan(50)
      expect(partialDataConfidence).toBeLessThan(100)
    })

    it('should handle minimal data scenario', () => {
      const minimalDataConfidence = calculateConfidenceScore(false, false, false, false)
      expect(minimalDataConfidence).toBe(50)
    })

    it('should maintain consistency across calculations', () => {
      const score1 = calculateConfidenceScore(true, true, false, false)
      const score2 = calculateConfidenceScore(true, true, false, false)
      expect(score1).toBe(score2)
    })
  })
})
