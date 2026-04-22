/**
 * Error handling and fail-safe mechanisms with retry logic
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHZ_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(
    public retryAfter: number = 60,
    message: string = 'Too many requests'
  ) {
    super(message, 429, 'RATE_LIMIT')
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    public serviceName: string,
    message: string,
    public originalError?: Error
  ) {
    super(`External service error (${serviceName}): ${message}`, 503, 'EXT_SERVICE_ERROR')
    this.name = 'ExternalServiceError'
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatuses: Set<number>
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatuses: new Set([408, 429, 500, 502, 503, 504]),
}

/**
 * Execute function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === finalConfig.maxRetries) {
        break
      }

      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelayMs
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Unknown error')
}

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new AppError(`Operation timed out after ${timeoutMs}ms`, 504, 'TIMEOUT')
          ),
        timeoutMs
      )
    ),
  ])
}

/**
 * Execute function with fallback value
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
    return fallback
  }
}

/**
 * Execute function with circuit breaker pattern
 */
export class CircuitBreaker<T> {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private fn: () => Promise<T>,
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  async execute(): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN'
        this.failureCount = 0
      } else {
        throw new AppError('Circuit breaker is OPEN', 503, 'CIRCUIT_OPEN')
      }
    }

    try {
      const result = await this.fn()
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failureCount = 0
      }
      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN'
      }

      throw error
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    }
  }

  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.lastFailureTime = 0
  }
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): string {
  if (error instanceof AppError) {
    return `[${error.code}] ${error.message}`
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  return String(error)
}

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error({
    timestamp: new Date().toISOString(),
    error: formatError(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  })
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json) as T
  } catch (error) {
    console.warn('JSON parse error:', error)
    return fallback
  }
}
