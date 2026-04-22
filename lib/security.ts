/**
 * Security middleware and utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''

  // Basic HTML escaping
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return input.replace(/[&<>"']/g, (char) => htmlEscapeMap[char])
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key])
      }
    }
    return sanitized
  }

  return obj
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https:;"
  )
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return response as NextResponse
}

/**
 * Configure CORS headers
 */
export function addCorsHeaders(response: NextResponse, allowedOrigins?: string[]): NextResponse {
  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://smartkisan.vercel.app',
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[]

  const allowedOriginsList = allowedOrigins || defaultAllowedOrigins
  const origin = process.env.NODE_ENV === 'development' ? '*' : allowedOriginsList.join(',')

  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '3600')

  return response as NextResponse
}

/**
 * Validate request has required authentication
 */
export function validateAuthHeader(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Rate limiting state (per-IP tracking)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Check if request is rate limited
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
): { limited: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return { limited: false, retryAfterSec: 0 }
  }

  entry.count++
  const limited = entry.count > maxRequests

  return {
    limited,
    retryAfterSec: limited ? Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) : 0,
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Create error response with security headers
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  additionalData?: Record<string, unknown>
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: message,
      ...additionalData,
    },
    { status }
  )

  const withSecurity = addSecurityHeaders(response)
  const withCors = addCorsHeaders(withSecurity)

  return withCors
}

/**
 * Create success response with security headers
 */
export function createSuccessResponse(
  data: any,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )

  const withSecurity = addSecurityHeaders(response)
  const withCors = addCorsHeaders(withSecurity)

  return withCors
}

/**
 * Validate request method
 */
export function validateMethod(req: NextRequest, allowedMethods: string[]): boolean {
  return allowedMethods.includes(req.method)
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleCorsPreFlight(): NextResponse {
  const response = NextResponse.json(null, { status: 200 })
  return addCorsHeaders(response)
}
