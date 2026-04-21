/**
 * Tests for input validation functions
 */

import {
  validateCropName,
  validateBase64Image,
  validateSensorData,
  validateFieldSize,
  validateLocation,
  validateYieldPredictionInput,
} from '@/lib/validation'

describe('Input Validation Functions', () => {
  describe('validateCropName', () => {
    it('should accept valid crop name', () => {
      const result = validateCropName('Wheat')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty crop name', () => {
      const result = validateCropName('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('is required')
    })

    it('should reject undefined crop name', () => {
      const result = validateCropName(undefined)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject crop name exceeding 100 characters', () => {
      const longName = 'A'.repeat(101)
      const result = validateCropName(longName)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('less than 100 characters')
    })

    it('should reject non-string crop name', () => {
      const result = validateCropName(123 as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a string')
    })

    it('should accept various valid crop names', () => {
      const validNames = ['Rice', 'Corn', 'Cotton', 'Sugarcane', 'Potato']
      validNames.forEach((name) => {
        expect(validateCropName(name).valid).toBe(true)
      })
    })
  })

  describe('validateBase64Image', () => {
    it('should accept valid base64 image', () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const result = validateBase64Image(validBase64)
      expect(result.valid).toBe(true)
    })

    it('should accept data URL format', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const result = validateBase64Image(dataUrl)
      expect(result.valid).toBe(true)
    })

    it('should reject undefined image', () => {
      const result = validateBase64Image(undefined)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject empty image', () => {
      const result = validateBase64Image('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should reject oversized image', () => {
      const largeImage = 'A'.repeat(20_000_001)
      const result = validateBase64Image(largeImage)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should reject invalid image format', () => {
      const result = validateBase64Image('not-a-valid-base64!')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid image format')
    })

    it('should reject non-string image', () => {
      const result = validateBase64Image(123 as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a string')
    })
  })

  describe('validateSensorData', () => {
    it('should accept undefined sensor data', () => {
      const result = validateSensorData(undefined)
      expect(result.valid).toBe(true)
    })

    it('should accept valid sensor data', () => {
      const result = validateSensorData({
        moisture: 50,
        temperature: 25,
        nitrogen: 100,
        phosphorus: 50,
        potassium: 75,
      })
      expect(result.valid).toBe(true)
    })

    it('should reject moisture below 0%', () => {
      const result = validateSensorData({ moisture: -1 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('0-100%')
    })

    it('should reject moisture above 100%', () => {
      const result = validateSensorData({ moisture: 101 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('0-100%')
    })

    it('should reject temperature below -50°C', () => {
      const result = validateSensorData({ temperature: -51 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Temperature')
    })

    it('should reject temperature above 60°C', () => {
      const result = validateSensorData({ temperature: 61 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Temperature')
    })

    it('should reject nitrogen below 0', () => {
      const result = validateSensorData({ nitrogen: -1 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Nitrogen')
    })

    it('should reject nitrogen above 500 kg/ha', () => {
      const result = validateSensorData({ nitrogen: 501 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Nitrogen')
    })

    it('should accept boundary values', () => {
      const result = validateSensorData({
        moisture: 0,
        temperature: -50,
        nitrogen: 500,
        phosphorus: 0,
        potassium: 500,
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('validateFieldSize', () => {
    it('should accept undefined field size', () => {
      const result = validateFieldSize(undefined)
      expect(result.valid).toBe(true)
    })

    it('should accept valid field size', () => {
      const result = validateFieldSize(50)
      expect(result.valid).toBe(true)
    })

    it('should reject zero field size', () => {
      const result = validateFieldSize(0)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('between 0 and 10000')
    })

    it('should reject negative field size', () => {
      const result = validateFieldSize(-10)
      expect(result.valid).toBe(false)
    })

    it('should reject field size over 10000 hectares', () => {
      const result = validateFieldSize(10001)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('between 0 and 10000')
    })

    it('should accept boundary values', () => {
      expect(validateFieldSize(0.1).valid).toBe(true)
      expect(validateFieldSize(10000).valid).toBe(true)
    })
  })

  describe('validateLocation', () => {
    it('should accept undefined location', () => {
      const result = validateLocation(undefined)
      expect(result.valid).toBe(true)
    })

    it('should accept valid location', () => {
      const result = validateLocation('Punjab, India')
      expect(result.valid).toBe(true)
    })

    it('should reject location over 200 characters', () => {
      const longLocation = 'A'.repeat(201)
      const result = validateLocation(longLocation)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('less than 200 characters')
    })

    it('should reject non-string location', () => {
      const result = validateLocation(123 as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a string')
    })

    it('should accept location with special characters', () => {
      const result = validateLocation("Delhi, NCR - India's capital")
      expect(result.valid).toBe(true)
    })
  })

  describe('validateYieldPredictionInput', () => {
    const validInput = {
      crop_name: 'Wheat',
      crop_type: 'Winter Crop',
      field_size: 50,
      location: 'Punjab',
      sensor: { moisture: 45, temperature: 20 },
    }

    it('should accept complete valid input', () => {
      const result = validateYieldPredictionInput(validInput)
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('should reject input without crop name', () => {
      const input = { ...validInput, crop_name: '' }
      const result = validateYieldPredictionInput(input)
      expect(result.valid).toBe(false)
      expect(result.errors.crop_name).toBeDefined()
    })

    it('should collect multiple validation errors', () => {
      const input = {
        crop_name: '',
        field_size: -10,
        sensor: { moisture: 150 },
      }
      const result = validateYieldPredictionInput(input)
      expect(result.valid).toBe(false)
      expect(Object.keys(result.errors).length).toBeGreaterThan(1)
    })

    it('should accept input with only required fields', () => {
      const input = { crop_name: 'Rice' }
      const result = validateYieldPredictionInput(input)
      expect(result.valid).toBe(true)
    })
  })
})
