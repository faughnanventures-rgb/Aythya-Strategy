/**
 * Production-Safe Logger
 * 
 * Provides structured logging that:
 * - Suppresses debug/info logs in production
 * - Always allows error/warn logs (but sanitized)
 * - Prepares for integration with external logging (Sentry, DataDog, etc.)
 * 
 * SECURITY:
 * - Never logs sensitive data (API keys, passwords, tokens)
 * - Sanitizes user data before logging
 * - Rate limits error reporting to prevent log flooding
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  [key: string]: unknown;
}

// Sensitive keys that should never be logged
const SENSITIVE_KEYS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'ssn',
];

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting for error logs
const errorCounts = new Map<string, { count: number; resetAt: number }>();
const ERROR_RATE_LIMIT = 10; // Max errors per key per minute
const ERROR_RATE_WINDOW = 60000; // 1 minute

/**
 * Sanitize an object to remove sensitive data
 */
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Mask potential tokens or keys
    if (obj.length > 20 && /^(sk-|pk_|eyJ|ghp_|gho_)/.test(obj)) {
      return `${obj.substring(0, 8)}...REDACTED`;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Check if we should rate limit this error
 */
function shouldRateLimit(errorKey: string): boolean {
  const now = Date.now();
  const entry = errorCounts.get(errorKey);
  
  if (!entry || entry.resetAt < now) {
    errorCounts.set(errorKey, { count: 1, resetAt: now + ERROR_RATE_WINDOW });
    return false;
  }
  
  entry.count++;
  if (entry.count > ERROR_RATE_LIMIT) {
    return true;
  }
  
  return false;
}

/**
 * Format log message
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(sanitize(context))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * Debug logs - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (!isProduction) {
      console.log(formatMessage('debug', message, context));
    }
  },

  /**
   * Info logs - only in development
   */
  info(message: string, context?: LogContext): void {
    if (!isProduction) {
      console.info(formatMessage('info', message, context));
    }
  },

  /**
   * Warning logs - always shown but sanitized
   */
  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },

  /**
   * Error logs - always shown, rate limited, sanitized
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorKey = `${message}:${error instanceof Error ? error.message : String(error)}`;
    
    if (shouldRateLimit(errorKey)) {
      // Silently skip rate-limited errors
      return;
    }
    
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: isProduction ? undefined : error.stack,
      } : String(error),
    };
    
    console.error(formatMessage('error', message, errorContext));
    
    // TODO: Send to external error tracking
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: sanitize(context) });
    // }
  },

  /**
   * Audit log for security events
   */
  audit(action: string, context: LogContext): void {
    const auditContext = {
      ...context,
      timestamp: new Date().toISOString(),
      action,
    };
    
    // Always log audits, even in production (but sanitized)
    console.info(formatMessage('info', `[AUDIT] ${action}`, auditContext));
    
    // TODO: Send to audit log service or database
  },
};

/**
 * Create a child logger with preset context
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug: (msg: string, ctx?: LogContext) => logger.debug(msg, { ...baseContext, ...ctx }),
    info: (msg: string, ctx?: LogContext) => logger.info(msg, { ...baseContext, ...ctx }),
    warn: (msg: string, ctx?: LogContext) => logger.warn(msg, { ...baseContext, ...ctx }),
    error: (msg: string, err?: Error | unknown, ctx?: LogContext) => 
      logger.error(msg, err, { ...baseContext, ...ctx }),
    audit: (action: string, ctx?: LogContext) => logger.audit(action, { ...baseContext, ...ctx }),
  };
}

export default logger;
