import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PerformanceLog } from '@/lib/performance-monitoring';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ALERT_THRESHOLDS = {
  MAX_LATENCY: 10000, // 10 seconds
  MAX_ERROR_RATE: 0.1, // 10%
  MIN_CONFIDENCE: 0.5, // 50%
};

async function checkAlerts(metrics: PerformanceLog) {
  const alerts = [];
  
  // Check total latency
  if (metrics.totalDuration && metrics.totalDuration > ALERT_THRESHOLDS.MAX_LATENCY) {
    alerts.push({
      type: 'latency',
      message: `High latency detected: ${metrics.totalDuration}ms`,
      value: metrics.totalDuration
    });
  }
  
  // Check error rate
  const errorRate = metrics.errors.length / (metrics.videoMetrics?.frameRate || 1);
  if (errorRate > ALERT_THRESHOLDS.MAX_ERROR_RATE) {
    alerts.push({
      type: 'error_rate',
      message: `High error rate detected: ${errorRate * 100}%`,
      value: errorRate
    });
  }
  
  // Check confidence scores
  const avgConfidence = metrics.confidenceScores.reduce((a, b) => a + b, 0) / metrics.confidenceScores.length;
  if (avgConfidence < ALERT_THRESHOLDS.MIN_CONFIDENCE) {
    alerts.push({
      type: 'confidence',
      message: `Low confidence detected: ${avgConfidence * 100}%`,
      value: avgConfidence
    });
  }
  
  // If any alerts were triggered, store them
  if (alerts.length > 0) {
    await supabase
      .from('performance_alerts')
      .insert(alerts.map(alert => ({
        session_id: metrics.sessionId,
        type: alert.type,
        message: alert.message,
        value: alert.value,
        timestamp: new Date().toISOString()
      })));
  }
  
  return alerts;
}

export async function POST(req: Request) {
  try {
    const metrics: PerformanceLog = await req.json();
    
    // Store the performance log
    const { error: logError } = await supabase
      .from('performance_logs')
      .insert({
        session_id: metrics.sessionId,
        start_time: new Date(metrics.startTime).toISOString(),
        end_time: metrics.endTime ? new Date(metrics.endTime).toISOString() : null,
        video_metrics: metrics.videoMetrics,
        upload_duration: metrics.uploadDuration,
        processing_duration: metrics.processingDuration,
        analysis_duration: metrics.analysisDuration,
        total_duration: metrics.totalDuration,
        frame_rate: metrics.frameRate,
        confidence_scores: metrics.confidenceScores,
        errors: metrics.errors,
        marks: Object.fromEntries(metrics.marks)
      });
      
    if (logError) {
      throw logError;
    }
    
    // Check for performance alerts
    const alerts = await checkAlerts(metrics);
    
    return NextResponse.json({
      success: true,
      alerts: alerts.length > 0 ? alerts : null
    });
    
  } catch (error) {
    console.error('Error storing performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to store performance metrics' },
      { status: 500 }
    );
  }
} 