type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogContext = {
  requestId?: string
  userId?: string
  endpoint?: string
  statusCode?: number
  duration?: number
  [key: string]: any
}

class Logger {
  private logLevel: LogLevel
  private isProduction: boolean

  constructor(logLevel: LogLevel = 'info', isProduction: boolean = false) {
    this.logLevel = logLevel
    this.isProduction = isProduction
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (this.isProduction) {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        context: context || {},
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      })
    } else {
      const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
      return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${contextStr}`
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context, error))
    }
  }

  logApiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
    this.info(`${method} ${path}`, {
      statusCode,
      duration,
      ...context,
    })
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info',
  process.env.NODE_ENV === 'production'
)

export const logDebug = (msg: string, ctx?: LogContext) => logger.debug(msg, ctx)
export const logInfo = (msg: string, ctx?: LogContext) => logger.info(msg, ctx)
export const logWarn = (msg: string, ctx?: LogContext) => logger.warn(msg, ctx)
export const logError = (msg: string, err?: Error, ctx?: LogContext) => logger.error(msg, err, ctx)
