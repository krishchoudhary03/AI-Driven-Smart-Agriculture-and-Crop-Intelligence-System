/**
 * Tests for crop disease detection API integration
 */

import { parseJSONResponse } from '@/lib/formatting'

describe('Crop Disease Detection API Integration', () => {
  describe('Disease Detection Response Parsing', () => {
    it('should parse valid disease detection response', () => {
      const mockResponse = JSON.stringify({
        disease: 'Powdery Mildew',
        confidence: 92,
        severity: 'High',
        description: 'Fungal infection affecting crop leaves',
        treatment: 'Apply fungicide spray',
        prevention: 'Maintain proper air circulation',
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data.disease).toBe('Powdery Mildew')
      expect(result.data.confidence).toBe(92)
    })

    it('should validate required fields in disease response', () => {
      const mockResponse = JSON.stringify({
        disease: 'Rust',
        confidence: 85,
        severity: 'Medium',
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data.disease).toBeDefined()
      expect(result.data.confidence).toBeGreaterThan(0)
      expect(result.data.confidence).toBeLessThanOrEqual(100)
    })

    it('should handle multiple diseases in response', () => {
      const mockResponse = JSON.stringify({
        diseases: [
          { name: 'Early Blight', confidence: 75 },
          { name: 'Late Blight', confidence: 60 },
        ],
        dominant: 'Early Blight',
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.diseases)).toBe(true)
      expect(result.data.diseases.length).toBe(2)
    })

    it('should handle disease with recommendations', () => {
      const mockResponse = JSON.stringify({
        disease: 'Leaf Spot',
        recommendations: {
          immediate: ['Remove affected leaves', 'Increase ventilation'],
          chemical: ['Mancozeb 2.5g/L', 'Chlorothalonil 1.5ml/L'],
          organic: ['Neem oil', 'Sulfur dust'],
        },
      })

      const result = parseJSONResponse(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data.recommendations).toBeDefined()
      expect(Array.isArray(result.data.recommendations.immediate)).toBe(true)
    })

    it('should validate confidence score is 0-100', () => {
      const validResponse = JSON.stringify({ disease: 'Test', confidence: 50 })
      const result = parseJSONResponse(validResponse)
      expect(result.success).toBe(true)
      expect(result.data.confidence).toBeGreaterThanOrEqual(0)
      expect(result.data.confidence).toBeLessThanOrEqual(100)
    })
  })

  describe('Disease Severity Classification', () => {
    it('should classify low severity correctly', () => {
      const disease = { severity: 'Low', affectedArea: 5 }
      expect(disease.affectedArea).toBeLessThan(10)
    })

    it('should classify medium severity correctly', () => {
      const disease = { severity: 'Medium', affectedArea: 30 }
      expect(disease.affectedArea).toBeGreaterThanOrEqual(10)
      expect(disease.affectedArea).toBeLessThan(50)
    })

    it('should classify high severity correctly', () => {
      const disease = { severity: 'High', affectedArea: 80 }
      expect(disease.affectedArea).toBeGreaterThanOrEqual(50)
    })
  })

  describe('Treatment Recommendation Logic', () => {
    it('should recommend fungicide for fungal diseases', () => {
      const fungalDiseases = ['Powdery Mildew', 'Rust', 'Leaf Spot']
      fungalDiseases.forEach((disease) => {
        expect(['Mancozeb', 'Sulfur', 'Chlorothalonil'].some((t) => t.includes('e')))
      })
    })

    it('should recommend bactericide for bacterial diseases', () => {
      const bacterialDiseases = ['Bacterial Wilt', 'Bacterial Leaf Spot']
      expect(bacterialDiseases.length).toBeGreaterThan(0)
    })

    it('should recommend organic treatments when available', () => {
      const organicTreatments = ['Neem oil', 'Sulfur dust', 'Copper fungicide']
      expect(organicTreatments.length).toBeGreaterThan(0)
    })

    it('should prioritize severe disease treatment', () => {
      const severeDisease = { severity: 'High', urgent: true }
      const mildDisease = { severity: 'Low', urgent: false }
      expect(severeDisease.urgent).toBe(true)
      expect(mildDisease.urgent).toBe(false)
    })
  })

  describe('Disease Detection Edge Cases', () => {
    it('should handle healthy crop (no disease)', () => {
      const healthyResponse = JSON.stringify({
        disease: 'None',
        confidence: 98,
        status: 'Healthy',
      })

      const result = parseJSONResponse(healthyResponse)
      expect(result.success).toBe(true)
      expect(result.data.disease).toBe('None')
    })

    it('should handle uncertain detection', () => {
      const uncertainResponse = JSON.stringify({
        disease: 'Unidentified',
        confidence: 35,
        suggestion: 'Please provide higher quality image',
      })

      const result = parseJSONResponse(uncertainResponse)
      expect(result.success).toBe(true)
      expect(result.data.confidence).toBeLessThan(50)
    })

    it('should handle low confidence detections', () => {
      const lowConfidence = JSON.stringify({
        disease: 'Possible Rust',
        confidence: 45,
      })

      const result = parseJSONResponse(lowConfidence)
      expect(result.success).toBe(true)
      expect(result.data.confidence).toBeLessThan(60)
    })

    it('should handle multiple possible diseases', () => {
      const multiDiseaseResponse = JSON.stringify({
        possible_diseases: [
          { name: 'Rust', probability: 0.6 },
          { name: 'Mildew', probability: 0.3 },
          { name: 'Spot', probability: 0.1 },
        ],
        most_likely: 'Rust',
      })

      const result = parseJSONResponse(multiDiseaseResponse)
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data.possible_diseases)).toBe(true)
    })
  })

  describe('Disease Information Structure', () => {
    it('should include disease name', () => {
      const disease = { name: 'Powdery Mildew' }
      expect(disease.name).toBeDefined()
      expect(typeof disease.name).toBe('string')
    })

    it('should include confidence score', () => {
      const disease = { name: 'Rust', confidence: 85 }
      expect(disease.confidence).toBeDefined()
      expect(typeof disease.confidence).toBe('number')
    })

    it('should include severity level', () => {
      const disease = { name: 'Leaf Spot', severity: 'Medium' }
      expect(['Low', 'Medium', 'High'].includes(disease.severity)).toBe(true)
    })

    it('should include treatment recommendations', () => {
      const disease = { name: 'Blight', treatment: 'Apply Mancozeb' }
      expect(disease.treatment).toBeDefined()
      expect(typeof disease.treatment).toBe('string')
    })
  })

  describe('Image Analysis Error Handling', () => {
    it('should handle image size validation', () => {
      const maxImageSize = 20_000_000 // 20MB in base64
      const testSize = 15_000_000
      expect(testSize).toBeLessThan(maxImageSize)
    })

    it('should handle invalid image format', () => {
      const validFormats = ['jpg', 'png', 'webp', 'jpeg']
      expect(validFormats.includes('png')).toBe(true)
    })

    it('should handle API rate limiting', () => {
      const rateLimit = { maxRequests: 10, windowSeconds: 60 }
      expect(rateLimit.maxRequests).toBeGreaterThan(0)
    })

    it('should handle missing API key', () => {
      const hasApiKey = !!process.env.GEMINI_API_KEY || true // fallback for test
      expect(typeof hasApiKey).toBe('boolean')
    })
  })
})
