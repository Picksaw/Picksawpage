/**
 * Production-Ready Client Logger & Diagnostics Utility
 * 
 * Automatically captures client-side runtime errors, unhandled promise rejections,
 * and key performance metrics (FCP, LCP, CLS) without external dependencies.
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
  details?: Record<string, unknown>;
}

class ClientLogger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 50;
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Capture global unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('RuntimeError', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Capture unhandled asynchronous Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('UnhandledPromise', event.reason?.message || String(event.reason), {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });

    // Performance Monitoring (FCP & LCP)
    if ('PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.info('Performance', 'First Contentful Paint (FCP)', {
                startTimeMs: Math.round(entry.startTime),
              });
            }
            if (entry.entryType === 'largest-contentful-paint') {
              this.info('Performance', 'Largest Contentful Paint (LCP)', {
                startTimeMs: Math.round(entry.startTime),
              });
            }
          }
        });

        perfObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch {
        // PerformanceObserver types might be partially supported in older environments
      }
    }

    this.info('System', 'Clarity Template #2 initialized successfully');
  }

  public info(category: string, message: string, details?: Record<string, unknown>) {
    this.addLog('info', category, message, details);
  }

  public warn(category: string, message: string, details?: Record<string, unknown>) {
    this.addLog('warn', category, message, details);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[${category}] ${message}`, details || '');
    }
  }

  public error(category: string, message: string, details?: Record<string, unknown>) {
    this.addLog('error', category, message, details);
    console.error(`[${category}] ${message}`, details || '');
  }

  private addLog(level: 'info' | 'warn' | 'error', category: string, message: string, details?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  public getRecentLogs(): readonly LogEntry[] {
    return this.logs;
  }
}

export const logger = new ClientLogger();
