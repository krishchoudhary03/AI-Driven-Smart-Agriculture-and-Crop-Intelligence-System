import { createHmac, randomBytes } from 'crypto'

const SIGNING_SECRET = process.env.SIGNING_SECRET || 'dev-secret'

export function signRequest(payload: any, timestamp?: number): {
  signature: string
  timestamp: number
} {
  const ts = timestamp || Math.floor(Date.now() / 1000)
  const message = `${ts}.${JSON.stringify(payload)}`
  const signature = createHmac('sha256', SIGNING_SECRET).update(message).digest('hex')

  return { signature, timestamp: ts }
}

export function verifyRequest(payload: any, signature: string, timestamp: number, maxAge: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000)
  if (now - timestamp > maxAge) {
    return false
  }

  const message = `${timestamp}.${JSON.stringify(payload)}`
  const expectedSignature = createHmac('sha256', SIGNING_SECRET).update(message).digest('hex')

  return constantTimeCompare(signature, expectedSignature)
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex')
}
