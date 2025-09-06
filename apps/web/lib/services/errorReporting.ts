import { z } from 'zod'

export const errorContextSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string(),
  timestamp: z.string(),
  user: z.object({
    id: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
  system: z.object({
    browser: z.string(),
    os: z.string(),
    device: z.string(),
    viewport: z.string(),
    memory: z.number().optional(),
  }),
  performance: z.object({
    connection: z.string().optional(),
    memory: z.number().optional(),
    cpu: z.number().optional(),
  }).optional(),
  app: z.object({
    version: z.string(),
    environment: z.string(),
    lastAction: z.string().optional(),
    componentTree: z.string().optional(),
  }),
})

export type ErrorContext = z.infer<typeof errorContextSchema>

class ErrorReportingService {
  private static instance: ErrorReportingService
  private initialized: boolean = false

  private constructor() {}

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService()
    }
    return ErrorReportingService.instance
  }

  init() {
    if (this.initialized) return

    // Set up global error handlers
    window.onerror = (message, source, lineno, colno, error) => {
      this.reportError(error || new Error(message as string))
    }

    window.onunhandledrejection = (event) => {
      this.reportError(event.reason)
    }

    this.initialized = true
  }

  private async getSystemInfo() {
    const connection = (navigator as any).connection
    const memory = (performance as any).memory

    return {
      browser: navigator.userAgent,
      os: navigator.platform,
      device: `${window.innerWidth}x${window.innerHeight}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: connection ? connection.effectiveType : undefined,
      memory: memory ? memory.usedJSHeapSize : undefined,
    }
  }

  private async getPerformanceMetrics() {
    return {
      connection: (navigator as any).connection?.effectiveType,
      memory: (performance as any).memory?.usedJSHeapSize,
      cpu: undefined, // Could be implemented with more sophisticated monitoring
    }
  }

  async reportError(error: Error, additionalContext: Partial<ErrorContext> = {}) {
    try {
      const systemInfo = await this.getSystemInfo()
      const performanceMetrics = await this.getPerformanceMetrics()

      const errorContext: ErrorContext = {
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        system: {
          ...systemInfo,
        },
        performance: performanceMetrics,
        app: {
          version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
          environment: process.env.NODE_ENV,
          lastAction: this.getLastUserAction(),
          componentTree: this.getComponentTree(),
        },
        ...additionalContext,
      }

      // Validate error context
      errorContextSchema.parse(errorContext)

      // Send to your error reporting service
      await this.sendErrorReport(errorContext)

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private getLastUserAction(): string {
    // Implement based on your action tracking system
    return 'unknown'
  }

  private getComponentTree(): string {
    // Implement based on your component hierarchy tracking
    return 'unknown'
  }

  private async sendErrorReport(errorContext: ErrorContext) {
    try {
      const response = await fetch('/api/error-reporting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Propagate request id if present for correlation on server
          'x-request-id': (document.cookie.match(/(?:^|; )velox_rid=([^;]+)/)?.[1] ?? ''),
        },
        body: JSON.stringify(errorContext),
      })

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.statusText}`)
      }

    } catch (error) {
      console.error('Failed to send error report:', error)
    }
  }
}

export const errorReporting = ErrorReportingService.getInstance()

// Initialize error reporting
if (typeof window !== 'undefined') {
  errorReporting.init()
} 