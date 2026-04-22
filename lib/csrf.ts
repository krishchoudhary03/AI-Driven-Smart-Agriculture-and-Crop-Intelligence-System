/**
 * CSRF protection utilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

/**
 * Store for CSRF tokens (in production, use Redis or database)
 */
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>()
const CSRF_TOKEN_LIFETIME = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate CSRF token
 */
export function generateCsrfToken(sessionId: string): string {
  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + CSRF_TOKEN_LIFETIME

  csrfTokenStore.set(token, { token, expiresAt })

  // Cleanup old tokens
  if (csrfTokenStore.size > 10000) {
    const now = Date.now()
    for (const [key, value] of csrfTokenStore.entries()) {
      if (value.expiresAt < now) {
        csrfTokenStore.delete(key)
      }
    }
  }

  return token
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const stored = csrfTokenStore.get(token)

  if (!stored) {
    return false
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    csrfTokenStore.delete(token)
    return false
  }

  // Token is valid, delete it to prevent reuse
  csrfTokenStore.delete(token)

  return true
}

/**
 * Extract CSRF token from request
 */
export function getCsrfTokenFromRequest(req: NextRequest): string | null {
  // Try to get from header
  const headerToken = req.headers.get('x-csrf-token')
  if (headerToken) {
    return headerToken
  }

  // Try to get from form data
  const formToken = req.headers.get('x-csrf-token-form')
  if (formToken) {
    return formToken
  }

  return null
}

/**
 * Verify CSRF token from request
 */
export async function verifyCsrfToken(req: NextRequest): Promise<boolean> {
  // Only check for state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return true
  }

  const token = getCsrfTokenFromRequest(req)

  if (!token) {
    return false
  }

  return validateCsrfToken(token)
}

/**
 * Create CSRF middleware for API routes
 */
export async function csrfMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  // Skip GET requests
  if (req.method === 'GET') {
    return null
  }

  const isValid = await verifyCsrfToken(req)

  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token validation failed',
        code: 'CSRF_INVALID',
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Hash CSRF token for storage (optional)
 */
export function hashCsrfToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Clear expired CSRF tokens
 */
export function cleanupExpiredCsrfTokens(): number {
  const now = Date.now()
  let count = 0

  for (const [key, value] of csrfTokenStore.entries()) {
    if (value.expiresAt < now) {
      csrfTokenStore.delete(key)
      count++
    }
  }

  return count
}

/**
 * Clear all CSRF tokens (for testing)
 */
export function clearAllCsrfTokens(): void {
  csrfTokenStore.clear()
}

/**
 * Get CSRF token store size (for monitoring)
 */
export function getCsrfTokenStoreSize(): number {
  return csrfTokenStore.size
}
