import { v4 as uuidv4 } from 'uuid';

export interface PerformanceMetric {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface PerformanceError {
  timestamp: number;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface VideoMetrics {
  size: number;
  duration: number;
  frameRate: number;
  resolution: string;
}

export interface PerformanceLog {
  sessionId: string;
  startTime: number;
  endTime?: number;
  videoMetrics?: VideoMetrics;
  uploadDuration?: number;
  processingDuration?: number;
  analysisDuration?: number;
  totalDuration?: number;
  frameRate?: number;
  confidenceScores: number[];
  errors: PerformanceError[];
  marks: Map<string, PerformanceMetric>;
}

export class PerformanceMonitor {
  private log: PerformanceLog;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.log = {
      sessionId: uuidv4(),
      startTime: Date.now(),
      confidenceScores: [],
      errors: [],
      marks: new Map()
    };
  }

  mark(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      value: performance.now(),
      metadata
    };
    this.log.marks.set(name, metric);
    
    if (this.isDevelopment) {
      console.log(`[Performance] Mark: ${name}`, metric);
    }
  }

  measure(startMark: string, endMark: string): number {
    const start = this.log.marks.get(startMark);
    const end = this.log.marks.get(endMark);
    
    if (!start || !end) {
      this.logError(new Error(`Missing marks for measurement: ${startMark} -> ${endMark}`));
      return 0;
    }
    
    return end.value - start.value;
  }

  logError(error: Error, context?: Record<string, any>): void {
    const perfError: PerformanceError = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context
    };
    
    this.log.errors.push(perfError);
    
    if (this.isDevelopment) {
      console.error('[Performance] Error:', perfError);
    }
  }

  updateVideoMetrics(metrics: VideoMetrics): void {
    this.log.videoMetrics = metrics;
    
    if (this.isDevelopment) {
      console.log('[Performance] Video metrics:', metrics);
    }
  }

  addConfidenceScore(score: number): void {
    this.log.confidenceScores.push(score);
  }

  computeMetrics(): PerformanceLog {
    const uploadDuration = this.measure('uploadStart', 'uploadEnd');
    const processingDuration = this.measure('processingStart', 'processingEnd');
    const analysisDuration = this.measure('analysisStart', 'analysisEnd');
    
    return {
      ...this.log,
      endTime: Date.now(),
      uploadDuration,
      processingDuration,
      analysisDuration,
      totalDuration: this.measure('uploadStart', 'analysisEnd'),
      frameRate: this.log.videoMetrics?.frameRate || 0
    };
  }

  async sendMetrics(): Promise<void> {
    try {
      const metrics = this.computeMetrics();
      
      const response = await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send metrics: ${response.statusText}`);
      }
      
      if (this.isDevelopment) {
        console.log('[Performance] Metrics sent successfully:', metrics);
      }
    } catch (error) {
      this.logError(error as Error, { context: 'sendMetrics' });
    }
  }
}

// React Hook for easy component integration
export function usePerformanceMonitor() {
  const monitorRef = React.useRef<PerformanceMonitor>();
  
  if (!monitorRef.current) {
    monitorRef.current = new PerformanceMonitor();
  }
  
  return monitorRef.current;
} 