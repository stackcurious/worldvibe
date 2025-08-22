// src/lib/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  timestamp: string;
  level: string;
  app?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDev: boolean;
  private appName: string;

  private colors = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m'   // Reset
  };

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
    this.level = (process.env.LOG_LEVEL as LogLevel) || (this.isDev ? 'debug' : 'info');
    this.appName = 'worldvibe';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.level];
  }

  private formatTime(): string {
    return new Date().toISOString();
  }

  private createContext(level: LogLevel): LogContext {
    const context: LogContext = {
      timestamp: this.formatTime(),
      level: level.toUpperCase(),
    };

    if (this.isDev) {
      context.app = this.appName;
    }

    return context;
  }

  private formatForDev(level: LogLevel, context: LogContext, message: string, data?: any): string {
    const color = this.colors[level];
    const timeStr = new Date(context.timestamp).toLocaleTimeString();
    
    let output = `${color}[${context.level}]${this.colors.reset} [${timeStr}] ${message}`;
    
    if (data) {
      const dataStr = typeof data === 'object' 
        ? '\n' + JSON.stringify(data, null, 2)
        : ` ${data}`;
      output += dataStr;
    }
    
    return output;
  }

  private formatForProd(context: LogContext, message: string, data?: any): string {
    return JSON.stringify({
      ...context,
      message,
      ...(data && { data })
    });
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const context = this.createContext(level);
    const output = this.isDev
      ? this.formatForDev(level, context, message, data)
      : this.formatForProd(context, message, data);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'info':
      case 'debug':
      default:
        console.log(output);
    }
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: this.isDev ? error.stack : undefined,
      ...context
    } : context;

    this.log('error', message, errorData);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }

  logError(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.error(message, error, context);
  }

  logWarning(message: string, data?: Record<string, unknown>) {
    this.warn(message, data);
  }

  logInfo(message: string, data?: Record<string, unknown>) {
    this.info(message, data);
  }

  logDebug(message: string, data?: Record<string, unknown>) {
    this.debug(message, data);
  }

  child(bindings: Record<string, unknown>) {
    const childLogger = new Logger();
    const boundLog = (level: LogLevel, message: string, data?: any) => {
      childLogger.log(level, message, { ...bindings, ...data });
    };

    return {
      error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => 
        boundLog('error', msg, { error: err, ...ctx }),
      warn: (msg: string, data?: Record<string, unknown>) => 
        boundLog('warn', msg, data),
      info: (msg: string, data?: Record<string, unknown>) => 
        boundLog('info', msg, data),
      debug: (msg: string, data?: Record<string, unknown>) => 
        boundLog('debug', msg, data)
    };
  }
}

// Create singleton instance
const loggerInstance = new Logger();

// Export the logger instance as default
export default loggerInstance;

// Export the logger instance as named export
export const logger = loggerInstance;

// Export convenience functions
export const logError = loggerInstance.logError.bind(loggerInstance);
export const logWarning = loggerInstance.logWarning.bind(loggerInstance);
export const logInfo = loggerInstance.logInfo.bind(loggerInstance);
export const logDebug = loggerInstance.logDebug.bind(loggerInstance);