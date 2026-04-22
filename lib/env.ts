type EnvConfig = {
  supabase: {
    url: string
    anonKey: string
  }
  gemini: {
    apiKey: string
    cropApiKey?: string
  }
  app: {
    nodeEnv: 'development' | 'production' | 'test'
    appUrl: string
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
}

export function validateEnv(): EnvConfig {
  const errors: string[] = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_CROP_API_KEY) {
    errors.push('At least one Gemini API key (GEMINI_API_KEY or GEMINI_CROP_API_KEY) is required')
  }

  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test'
  if (nodeEnv === 'production' && !process.env.GEMINI_CROP_API_KEY) {
    console.warn('⚠️ GEMINI_CROP_API_KEY not set - will fall back to GEMINI_API_KEY')
  }

  if (errors.length > 0) {
    const errorMessage = `\n❌ Environment Configuration Errors:\n${errors.map(e => `  • ${e}`).join('\n')}\n`
    console.error(errorMessage)
    throw new Error(`Invalid environment configuration: ${errors.join('; ')}`)
  }

  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      cropApiKey: process.env.GEMINI_CROP_API_KEY,
    },
    app: {
      nodeEnv,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      logLevel: (process.env.LOG_LEVEL || 'info') as any,
    },
  }
}

export const env = validateEnv()

export const isProduction = env.app.nodeEnv === 'production'
export const isDevelopment = env.app.nodeEnv === 'development'
