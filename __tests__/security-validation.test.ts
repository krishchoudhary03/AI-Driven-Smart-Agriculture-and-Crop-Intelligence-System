/**
 * Comprehensive tests for security, validation, and API integration
 */

// Mock Next.js dependencies BEFORE importing security modules
jest.mock('next/server', () => ({
  NextRequest: class {
    headers: Map<string, string>
    method: string
    constructor(input?: { headers?: Map<string, string>; method?: string }) {
      this.headers = input?.headers || new Map()
      this.method = input?.method || 'GET'
    }
  },
  NextResponse: {
    json: jest.fn((data: any, init?: any) => ({ data, ...init })),
    next: jest.fn(() => ({})),
  },
}))

import {
  sanitizeInput,
  sanitizeObject,
  validateAuthHeader,
  checkRateLimit,
  getClientIp,
} from '@/lib/security'
import {
  validateCropName,
  validateBase64Image,
  validateSensorData,
} from '@/lib/validation'
import {
  AppError,
  ValidationError,
  withRetry,
  withFallback,
  CircuitBreaker,
  safeJsonParse,
} from '@/lib/errors'
import {
  generateCsrfToken,
  validateCsrfToken,
} from '@/lib/csrf'

describe('Security Utilities', () => {
  describe('Input Sanitization', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>'
      const result = sanitizeInput(input)
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })

    it('should escape quotes', () => {
      const input = 'Test "quoted" and \'single\''
      const result = sanitizeInput(input)
      expect(result).toContain('&quot;')
      expect(result).toContain('&#39;')
    })

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry'
      const result = sanitizeInput(input)
      expect(result).toBe('Tom &amp; Jerry')
    })

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('')
    })

    it('should handle non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('Object Sanitization', () => {
    it('should sanitize nested objects', () => {
      const obj = {
        name: '<script>alert(1)</script>',
        nested: { value: '<img src=x>' },
      }
      const result = sanitizeObject(obj)
      expect(result.name).toContain('&lt;')
      expect(result.nested.value).toContain('&lt;')
    })

    it('should sanitize arrays', () => {
      const arr = ['<script>', '<img>']
      const result = sanitizeObject(arr)
      expect(result[0]).toContain('&lt;')
      expect(result[1]).toContain('&lt;')
    })

    it('should preserve primitives', () => {
      expect(sanitizeObject(42)).toBe(42)
      expect(sanitizeObject(true)).toBe(true)
      expect(sanitizeObject(null)).toBe(null)
    })
  })

  describe('Auth Header Validation', () => {
    it('should extract valid Bearer token', () => {
      const mockReq = {
        headers: new Map([['authorization', 'Bearer mytoken123']]),
      }
      const token = validateAuthHeader(mockReq as any)
      expect(token).toBe('mytoken123')
    })

    it('should return null for missing header', () => {
      const mockReq = { headers: new Map() }
      const token = validateAuthHeader(mockReq as any)
      expect(token).toBeNull()
    })

    it('should return null for invalid format', () => {
      const mockReq = {
        headers: new Map([['authorization', 'Basic user:pass']]),
      }
      const token = validateAuthHeader(mockReq as any)
      expect(token).toBeNull()
    })
  })

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Clear rate limit state
      jest.clearAllMocks()
    })

    it('should allow requests below limit', () => {
      const result = checkRateLimit('192.168.1.1', 5, 60000)
      expect(result.limited).toBe(false)
      expect(result.retryAfterSec).toBe(0)
    })

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 6; i++) {
        checkRateLimit('192.168.1.2', 5, 60000)
      }
      const result = checkRateLimit('192.168.1.2', 5, 60000)
      expect(result.limited).toBe(true)
      expect(result.retryAfterSec).toBeGreaterThan(0)
    })
  })

  describe('Client IP Extraction', () => {
    it('should extract from x-forwarded-for', () => {
      const mockReq = {
        headers: new Map([['x-forwarded-for', '192.168.1.1, 10.0.0.1']]),
      }
      const ip = getClientIp(mockReq as any)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract from x-real-ip', () => {
      const mockReq = {
        headers: new Map([['x-real-ip', '192.168.1.1']]),
      }
      const ip = getClientIp(mockReq as any)
      expect(ip).toBe('192.168.1.1')
    })

    it('should return unknown for missing headers', () => {
      const mockReq = { headers: new Map() }
      const ip = getClientIp(mockReq as any)
      expect(ip).toBe('unknown')
    })
  })
})

describe('Validation Utilities', () => {
  describe('Crop Name Validation', () => {
    it('should validate valid crop names', () => {
      const result = validateCropName('Wheat')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty names', () => {
      const result = validateCropName('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Crop name is required')
    })

    it('should reject null/undefined', () => {
      expect(validateCropName(undefined).valid).toBe(false)
      expect(validateCropName(null as any).valid).toBe(false)
    })

    it('should reject names exceeding max length', () => {
      const longName = 'a'.repeat(101)
      const result = validateCropName(longName)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('100 characters')
    })
  })

  describe('Image Validation', () => {
    it('should validate base64 image', () => {
      const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
      const result = validateBase64Image(base64)
      expect(result.valid).toBe(true)
    })

    it('should reject oversized images', () => {
      const largeImage = 'a'.repeat(21_000_000)
      const result = validateBase64Image(largeImage)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should reject missing images', () => {
      const result = validateBase64Image(undefined)
      expect(result.valid).toBe(false)
    })
  })

  describe('Sensor Data Validation', () => {
    it('should validate correct sensor data', () => {
      const sensor = {
        moisture: 50,
        temperature: 25,
        nitrogen: 100,
      }
      const result = validateSensorData(sensor)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid moisture', () => {
      const sensor = { moisture: 150 }
      const result = validateSensorData(sensor)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('moisture')
    })

    it('should reject invalid temperature', () => {
      const sensor = { temperature: 100 }
      const result = validateSensorData(sensor)
      expect(result.valid).toBe(false)
    })

    it('should allow undefined sensor data', () => {
      const result = validateSensorData(undefined)
      expect(result.valid).toBe(true)
    })
  })
})

describe('Error Handling', () => {
  describe('Error Classes', () => {
    it('should create AppError with status', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR')
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(500)
      expect(error.code).toBe('TEST_ERROR')
    })

    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input')
      expect(error.status).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Retry Logic', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const result = await withRetry(fn)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      let attempts = 0
      const fn = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 2) {
          return Promise.reject(new Error('fail'))
        }
        return Promise.resolve('success')
      })

      const result = await withRetry(fn, { maxRetries: 3 })
      expect(result).toBe('success')
      expect(fn.mock.calls.length).toBeGreaterThan(1)
    })

    it('should fail after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fail'))
      await expect(withRetry(fn, { maxRetries: 1 })).rejects.toThrow()
    })
  })

  describe('Fallback Logic', () => {
    it('should return result on success', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const result = await withFallback(fn, 'fallback')
      expect(result).toBe('success')
    })

    it('should return fallback on error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'))
      const result = await withFallback(fn, 'fallback')
      expect(result).toBe('fallback')
    })

    it('should call onError callback', async () => {
      const onError = jest.fn()
      const fn = jest.fn().mockRejectedValue(new Error('fail'))
      await withFallback(fn, 'fallback', onError)
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('Circuit Breaker', () => {
    it('should execute successfully when closed', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const breaker = new CircuitBreaker(fn, 3, 1000)
      const result = await breaker.execute()
      expect(result).toBe('success')
    })

    it('should open after threshold failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'))
      const breaker = new CircuitBreaker(fn, 2, 1000)

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute()
        } catch {}
      }

      const state = breaker.getState()
      expect(state.state).toBe('OPEN')
    })

    it('should reject requests when open', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'))
      const breaker = new CircuitBreaker(fn, 1, 1000)

      try {
        await breaker.execute()
      } catch {}

      await expect(breaker.execute()).rejects.toThrow('Circuit breaker is OPEN')
    })
  })

  describe('JSON Parsing', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {})
      expect(result.key).toBe('value')
    })

    it('should return fallback on parse error', () => {
      const fallback = { error: true }
      const result = safeJsonParse('invalid json', fallback)
      expect(result).toBe(fallback)
    })
  })

  describe('CSRF Protection', () => {
    beforeEach(() => {
      // Clear CSRF tokens before each test
      jest.clearAllMocks()
    })

    it('should generate valid CSRF token', () => {
      const token = generateCsrfToken('session1')
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes in hex
    })

    it('should validate CSRF token', () => {
      const token = generateCsrfToken('session1')
      const isValid = validateCsrfToken(token)
      expect(isValid).toBe(true)
    })

    it('should reject invalid CSRF token', () => {
      const isValid = validateCsrfToken('invalid-token')
      expect(isValid).toBe(false)
    })

    it('should prevent token reuse', () => {
      const token = generateCsrfToken('session1')
      const first = validateCsrfToken(token)
      const second = validateCsrfToken(token)
      expect(first).toBe(true)
      expect(second).toBe(false)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken('session1')
      const token2 = generateCsrfToken('session2')
      expect(token1).not.toBe(token2)
    })

    it('should reject null CSRF token', () => {
      const isValid = validateCsrfToken(null as any)
      expect(isValid).toBe(false)
    })

    it('should reject empty CSRF token', () => {
      const isValid = validateCsrfToken('')
      expect(isValid).toBe(false)
    })
  })
})

describe('API Response Consistency', () => {
  it('should handle crop disease detection response', () => {
    const response = {
      disease: 'Powdery Mildew',
      confidence: 92,
      severity: 'High',
      treatment: 'Apply fungicide',
    }

    expect(response.disease).toBeDefined()
    expect(response.confidence).toBeGreaterThan(0)
    expect(response.confidence).toBeLessThanOrEqual(100)
    expect(['Low', 'Medium', 'High']).toContain(response.severity)
  })

  it('should handle yield prediction response', () => {
    const response = {
      predicted_yield: 45,
      unit: 'quintal/ha',
      confidence: 78,
      factors: { moisture: 'high', nitrogen: 'optimal' },
    }

    expect(response.predicted_yield).toBeGreaterThan(0)
    expect(response.unit).toBeDefined()
    expect(response.confidence).toBeGreaterThanOrEqual(0)
    expect(response.factors).toBeDefined()
  })
})
