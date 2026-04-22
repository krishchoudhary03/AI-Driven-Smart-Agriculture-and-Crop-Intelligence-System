interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// In-memory fallback for rate limiting (Redis optional)
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

export async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<{ limited: boolean; remaining: number; reset: number }> {
  const { maxRequests, windowMs } = config
  const now = Date.now()
  const window = Math.floor(now / windowMs) * windowMs

  try {
    // Use Upstash Redis if available
    if (process.env.UPSTASH_REDIS_URL) {
      return await checkRateLimitUpstash(key, config)
    }

    // Fallback to in-memory
    return checkRateLimitInMemory(key, config)
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return { limited: false, remaining: maxRequests, reset: 0 }
  }
}

function checkRateLimitInMemory(
  key: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; reset: number } {
  const { maxRequests, windowMs } = config
  const now = Date.now()
  const window = Math.floor(now / windowMs) * windowMs
  const redisKey = `rate-limit:${key}:${window}`

  const entry = inMemoryStore.get(redisKey)
  let current = 1

  if (entry && entry.resetTime > now) {
    current = entry.count + 1
    entry.count = current
  } else {
    inMemoryStore.set(redisKey, { count: current, resetTime: window + windowMs })
  }

  const limited = current > maxRequests
  const remaining = Math.max(0, maxRequests - current + 1)
  const reset = window + windowMs

  // Cleanup old entries
  if (Math.random() < 0.01) {
    for (const [k, v] of inMemoryStore.entries()) {
      if (v.resetTime < now) {
        inMemoryStore.delete(k)
      }
    }
  }

  return { limited, remaining, reset: Math.ceil(reset / 1000) }
}

async function checkRateLimitUpstash(
  key: string,
  config: RateLimitConfig
): Promise<{ limited: boolean; remaining: number; reset: number }> {
  const { maxRequests, windowMs } = config
  const now = Date.now()
  const window = Math.floor(now / windowMs) * windowMs
  const redisKey = `rate-limit:${key}:${window}`

  const response = await fetch(process.env.UPSTASH_REDIS_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['INCR', redisKey]),
  })

  const { result: current } = await response.json()

  if (current === 1) {
    await fetch(process.env.UPSTASH_REDIS_URL!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['EXPIRE', redisKey, Math.ceil(windowMs / 1000)]),
    })
  }

  const limited = current > maxRequests
  const remaining = Math.max(0, maxRequests - current + 1)
  const reset = window + windowMs

  return { limited, remaining, reset: Math.ceil(reset / 1000) }
}

export async function getRateLimitHeaders(
  limited: boolean,
  remaining: number,
  reset: number
) {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
    ...(limited && { 'Retry-After': reset.toString() }),
  }
}
