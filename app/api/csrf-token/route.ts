import { NextRequest, NextResponse } from 'next/server'
import {
  addSecurityHeaders,
  addCorsHeaders,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/security'
import { generateCsrfToken } from '@/lib/csrf'

/**
 * GET /api/csrf-token
 * Generate a CSRF token for form submissions
 */
export async function OPTIONS(req: NextRequest) {
  const response = NextResponse.json(null, { status: 200 })
  return addCorsHeaders(response)
}

export async function GET(req: NextRequest) {
  try {
    // Generate CSRF token
    const token = generateCsrfToken('default-session')

    return createSuccessResponse({
      csrfToken: token,
      expiresIn: 86400, // 24 hours
    }, 200)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    return createErrorResponse(error.message || 'Failed to generate CSRF token', 500)
  }
}
