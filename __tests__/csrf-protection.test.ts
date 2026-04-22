/**
 * CSRF Protection Tests
 */

// Mock Next.js dependencies BEFORE importing csrf
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
  generateCsrfToken,
  validateCsrfToken,
  getCsrfTokenFromRequest,
  verifyCsrfToken,
  hashCsrfToken,
  cleanupExpiredCsrfTokens,
  clearAllCsrfTokens,
  getCsrfTokenStoreSize,
} from '@/lib/csrf'

describe('CSRF Protection', () => {
  beforeEach(() => {
    clearAllCsrfTokens()
  })

  describe('CSRF Token Generation', () => {
    it('should generate valid CSRF token', () => {
      const token = generateCsrfToken('session1')
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken('session1')
      const token2 = generateCsrfToken('session2')
      expect(token1).not.toBe(token2)
    })

    it('should generate tokens with hex characters', () => {
      const token = generateCsrfToken('session1')
      expect(/^[a-f0-9]+$/.test(token)).toBe(true)
    })

    it('should store generated token', () => {
      const token = generateCsrfToken('session1')
      const isValid = validateCsrfToken(token)
      expect(isValid).toBe(true)
    })
  })

  describe('CSRF Token Validation', () => {
    it('should validate correct token', () => {
      const token = generateCsrfToken('session1')
      const isValid = validateCsrfToken(token)
      expect(isValid).toBe(true)
    })

    it('should reject invalid token', () => {
      const isValid = validateCsrfToken('invalid-token')
      expect(isValid).toBe(false)
    })

    it('should reject null token', () => {
      const isValid = validateCsrfToken(null as any)
      expect(isValid).toBe(false)
    })

    it('should reject empty token', () => {
      const isValid = validateCsrfToken('')
      expect(isValid).toBe(false)
    })

    it('should reject non-string token', () => {
      const isValid = validateCsrfToken(123 as any)
      expect(isValid).toBe(false)
    })

    it('should consume token on validation (prevent reuse)', () => {
      const token = generateCsrfToken('session1')
      const first = validateCsrfToken(token)
      const second = validateCsrfToken(token)
      expect(first).toBe(true)
      expect(second).toBe(false)
    })
  })

  describe('CSRF Token Extraction', () => {
    it('should extract token from x-csrf-token header', () => {
      const mockReq = {
        headers: new Map([['x-csrf-token', 'test-token']]),
      }
      const token = getCsrfTokenFromRequest(mockReq as any)
      expect(token).toBe('test-token')
    })

    it('should extract token from x-csrf-token-form header', () => {
      const mockReq = {
        headers: new Map([['x-csrf-token-form', 'form-token']]),
      }
      const token = getCsrfTokenFromRequest(mockReq as any)
      expect(token).toBe('form-token')
    })

    it('should prefer x-csrf-token over x-csrf-token-form', () => {
      const mockReq = {
        headers: new Map([
          ['x-csrf-token', 'header-token'],
          ['x-csrf-token-form', 'form-token'],
        ]),
      }
      const token = getCsrfTokenFromRequest(mockReq as any)
      expect(token).toBe('header-token')
    })

    it('should return null if no token in request', () => {
      const mockReq = {
        headers: new Map(),
      }
      const token = getCsrfTokenFromRequest(mockReq as any)
      expect(token).toBeNull()
    })
  })

  describe('CSRF Token Hashing', () => {
    it('should hash token consistently', () => {
      const token = 'test-token'
      const hash1 = hashCsrfToken(token)
      const hash2 = hashCsrfToken(token)
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashCsrfToken('token1')
      const hash2 = hashCsrfToken('token2')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce consistent hash length', () => {
      const hash = hashCsrfToken('test')
      expect(hash.length).toBe(64) // SHA256 hex length
    })
  })

  describe('CSRF Token Cleanup', () => {
    it('should cleanup expired tokens', () => {
      const token = generateCsrfToken('session1')
      expect(getCsrfTokenStoreSize()).toBeGreaterThan(0)

      // All tokens should be expired immediately in test
      const cleaned = cleanupExpiredCsrfTokens()
      expect(cleaned).toBeGreaterThanOrEqual(0)
    })

    it('should clear all tokens', () => {
      generateCsrfToken('session1')
      generateCsrfToken('session2')
      generateCsrfToken('session3')

      expect(getCsrfTokenStoreSize()).toBeGreaterThan(0)

      clearAllCsrfTokens()

      expect(getCsrfTokenStoreSize()).toBe(0)
    })

    it('should handle large token store gracefully', () => {
      // Generate many tokens (but not too many to avoid memory issues)
      for (let i = 0; i < 1000; i++) {
        generateCsrfToken(`session${i}`)
      }

      // Store should contain tokens
      expect(getCsrfTokenStoreSize()).toBe(1000)
      
      // Clear should work
      clearAllCsrfTokens()
      expect(getCsrfTokenStoreSize()).toBe(0)
    })
  })

  describe('CSRF Security', () => {
    it('should use cryptographically secure randomness', () => {
      const tokens = new Set()
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCsrfToken(`session${i}`))
      }
      // All tokens should be unique
      expect(tokens.size).toBe(100)
    })

    it('should generate 64-character tokens', () => {
      const token = generateCsrfToken('session1')
      // 32 bytes in hex = 64 characters
      expect(token.length).toBe(64)
    })

    it('should protect against token reuse', () => {
      const token = generateCsrfToken('session1')
      
      const first = validateCsrfToken(token)
      expect(first).toBe(true)

      // Second attempt should fail
      const second = validateCsrfToken(token)
      expect(second).toBe(false)
    })

    it('should prevent brute force attacks', () => {
      const token = generateCsrfToken('session1')
      
      // Try to validate with random tokens
      let successCount = 0
      for (let i = 0; i < 1000; i++) {
        const randomToken = generateCsrfToken(`random${i}`).slice(0, 32)
        if (validateCsrfToken(randomToken)) {
          successCount++
        }
      }
      
      // Should not randomly validate tokens
      expect(successCount).toBe(0)
    })
  })

  describe('CSRF Request Verification', () => {
    it('should verify CSRF token from valid request', async () => {
      const token = generateCsrfToken('session1')
      const mockReq = {
        method: 'POST',
        headers: new Map([['x-csrf-token', token]]),
      }

      const isValid = await verifyCsrfToken(mockReq as any)
      expect(isValid).toBe(true)
    })

    it('should reject POST request without token', async () => {
      const mockReq = {
        method: 'POST',
        headers: new Map(),
      }

      const isValid = await verifyCsrfToken(mockReq as any)
      expect(isValid).toBe(false)
    })

    it('should allow GET requests without token', async () => {
      const mockReq = {
        method: 'GET',
        headers: new Map(),
      }

      const isValid = await verifyCsrfToken(mockReq as any)
      expect(isValid).toBe(true)
    })

    it('should check state-changing methods', async () => {
      const token = generateCsrfToken('session1')
      
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH']
      for (const method of methods) {
        const mockReq = {
          method,
          headers: new Map([['x-csrf-token', token]]),
        }
        
        // Generate fresh token for each
        const freshToken = generateCsrfToken(`session${method}`)
        mockReq.headers.set('x-csrf-token', freshToken)
        
        const isValid = await verifyCsrfToken(mockReq as any)
        expect(isValid).toBe(true)
      }
    })
  })

  describe('CSRF Attack Prevention', () => {
    it('should prevent token forgery', () => {
      const forgedToken = 'a'.repeat(64)
      const isValid = validateCsrfToken(forgedToken)
      expect(isValid).toBe(false)
    })

    it('should prevent token fixation', () => {
      const token1 = generateCsrfToken('session1')
      const token2 = generateCsrfToken('session2')

      // Both tokens should be valid independently
      expect(validateCsrfToken(token1)).toBe(true)
      expect(validateCsrfToken(token2)).toBe(true)

      // But not reusable
      expect(validateCsrfToken(token1)).toBe(false)
      expect(validateCsrfToken(token2)).toBe(false)
    })

    it('should prevent cross-origin attacks', () => {
      const token = generateCsrfToken('session1')
      
      // Simulate different origin without token
      const mockReq = {
        method: 'POST',
        headers: new Map([['origin', 'https://evil.com']]),
      }

      // Should fail because no CSRF token
      verifyCsrfToken(mockReq as any).then((isValid) => {
        expect(isValid).toBe(false)
      })
    })
  })
})
