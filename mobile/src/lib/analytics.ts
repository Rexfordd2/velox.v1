import * as Sentry from '@sentry/react-native';
import * as Analytics from 'expo-firebase-analytics';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

// Core event types that matter most
export const ANALYTICS_EVENTS = {
  WORKOUT: {
    STARTED: 'workout_started',
    COMPLETED: 'workout_completed',
    FAILED: 'workout_failed',
    FORM_ISSUE: 'form_issue_detected',
    REP_COMPLETED: 'rep_completed',
    SET_COMPLETED: 'set_completed',
  },
  PERFORMANCE: {
    SLOW_ANALYSIS: 'slow_analysis',
    APP_FREEZE: 'app_freeze',
    MEMORY_WARNING: 'memory_warning',
    CAMERA_ISSUE: 'camera_issue',
    POSE_DETECTION_FAILED: 'pose_detection_failed',
  },
  USER: {
    FEEDBACK: 'user_feedback',
    ERROR_ENCOUNTERED: 'user_error',
  },
} as const;

// Exercise-specific thresholds
export const EXERCISE_THRESHOLDS = {
  SQUAT: {
    MIN_DEPTH: 0.6, // 60% of max depth
    KNEE_ALIGNMENT: 15, // degrees of acceptable deviation
    BACK_ANGLE: 30, // max forward lean in degrees
    MIN_CONFIDENCE: 0.7,
  },
  DEADLIFT: {
    BACK_ANGLE: 20, // degrees from vertical
    BAR_PATH: 10, // cm deviation from vertical
    HIP_HINGE: 45, // minimum hip hinge angle
    MIN_CONFIDENCE: 0.8,
  },
  BENCH_PRESS: {
    BAR_PATH: 8, // cm deviation from ideal
    ELBOW_ANGLE: 45, // minimum angle at bottom
    WRIST_ALIGNMENT: 15, // degrees of acceptable deviation
    MIN_CONFIDENCE: 0.75,
  },
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  ANALYSIS: {
    CRITICAL: 3000, // 3 seconds
    WARNING: 1500, // 1.5 seconds
    IDEAL: 500, // 500ms
  },
  FRAME_PROCESSING: {
    CRITICAL: 100, // 100ms
    WARNING: 50, // 50ms
    IDEAL: 16, // ~60fps
  },
  MEMORY: {
    CRITICAL: 90, // 90% usage
    WARNING: 80, // 80% usage
    IDEAL: 70, // target usage
  },
  ERROR_RATE: {
    CRITICAL: 5, // errors per minute
    WARNING: 3,
    IDEAL: 0,
  },
  POSE_CONFIDENCE: {
    CRITICAL: 0.5,
    WARNING: 0.7,
    IDEAL: 0.9,
  },
} as const;

// Error categories for better tracking
export const ERROR_CATEGORIES = {
  CAMERA: {
    INITIALIZATION: 'camera_init',
    PERMISSION: 'camera_permission',
    STREAM: 'camera_stream',
  },
  POSE: {
    DETECTION: 'pose_detection',
    TRACKING: 'pose_tracking',
    ANALYSIS: 'pose_analysis',
  },
  FORM: {
    ALIGNMENT: 'form_alignment',
    DEPTH: 'form_depth',
    TEMPO: 'form_tempo',
  },
  SYSTEM: {
    MEMORY: 'system_memory',
    PERFORMANCE: 'system_performance',
    CRASH: 'system_crash',
  },
} as const;

interface FormMetrics {
  exerciseType: keyof typeof EXERCISE_THRESHOLDS;
  repCount: number;
  setCount: number;
  formScore: number;
  issues?: {
    type: keyof typeof ERROR_CATEGORIES.FORM;
    severity: 'low' | 'medium' | 'high';
    details: string;
    timestamp: number;
  }[];
  keypoints: {
    confidence: number;
    position: { x: number; y: number };
    name: string;
  }[];
}

interface WorkoutMetrics {
  exerciseId: string;
  exerciseName: string;
  startTime: number;
  duration?: number;
  success: boolean;
  failureReason?: string;
  form?: FormMetrics;
}

interface PerformanceMetrics {
  operationName: string;
  duration: number;
  threshold: number;
  context?: Record<string, any>;
}

interface ErrorReport {
  error: Error;
  category?: keyof typeof ERROR_CATEGORIES;
  subCategory?: string;
  context?: Record<string, any>;
  isCritical: boolean;
}

interface UserFeedback {
  type: 'bug' | 'feature' | 'general';
  message: string;
  context?: Record<string, any>;
}

class AnalyticsService {
  private sessionId: string;
  private sessionStartTime: number;
  private errorCount: { [key: string]: number } = {};
  private lastErrorTime: number = 0;
  private isDevelopment: boolean;
  private formIssueCount: number = 0;

  constructor() {
    this.sessionId = uuidv4();
    this.sessionStartTime = Date.now();
    this.isDevelopment = __DEV__;

    // Initialize Sentry for production only
    if (!this.isDevelopment) {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableAutoSessionTracking: true,
        beforeSend: (event) => {
          if (event.level === 'fatal' || this.shouldAlertError(event)) {
            return event;
          }
          return null;
        },
      });
    }
  }

  // Track exercise form and metrics
  async trackExerciseForm(metrics: FormMetrics) {
    const thresholds = EXERCISE_THRESHOLDS[metrics.exerciseType];
    const issues: FormMetrics['issues'] = [];

    // Check form against thresholds
    metrics.keypoints.forEach(keypoint => {
      if (keypoint.confidence < thresholds.MIN_CONFIDENCE) {
        issues.push({
          type: 'ALIGNMENT',
          severity: 'high',
          details: `Low confidence for ${keypoint.name}`,
          timestamp: Date.now(),
        });
      }
    });

    // Track form issues
    if (issues.length > 0) {
      this.formIssueCount++;
      await this.logEvent(ANALYTICS_EVENTS.WORKOUT.FORM_ISSUE, {
        exercise_type: metrics.exerciseType,
        issues,
        form_score: metrics.formScore,
        rep_count: metrics.repCount,
      });

      // Alert if form issues are frequent
      if (this.formIssueCount >= 3) {
        await this.alertFormIssues(metrics.exerciseType, issues);
      }
    }

    // Track rep completion
    await this.logEvent(ANALYTICS_EVENTS.WORKOUT.REP_COMPLETED, {
      exercise_type: metrics.exerciseType,
      form_score: metrics.formScore,
      rep_number: metrics.repCount,
      set_number: metrics.setCount,
      issues: issues.length,
    });
  }

  // Track workout with enhanced metrics
  async trackWorkout(metrics: WorkoutMetrics) {
    const event = metrics.success ? 
      ANALYTICS_EVENTS.WORKOUT.COMPLETED : 
      ANALYTICS_EVENTS.WORKOUT.FAILED;

    await this.logEvent(event, {
      ...metrics,
      session_duration: Date.now() - this.sessionStartTime,
      form_issues: this.formIssueCount,
    });

    if (!metrics.success) {
      await this.trackError({
        error: new Error(metrics.failureReason || 'Unknown failure'),
        category: 'POSE',
        subCategory: 'ANALYSIS',
        context: { 
          exercise: metrics.exerciseName,
          form_metrics: metrics.form,
        },
        isCritical: false,
      });
    }

    // Reset form issue count for next workout
    this.formIssueCount = 0;
  }

  // Enhanced performance tracking
  async trackPerformance(metrics: PerformanceMetrics) {
    const thresholds = PERFORMANCE_THRESHOLDS[metrics.operationName as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return;

    let severity: 'critical' | 'warning' | 'info' = 'info';
    if (metrics.duration > thresholds.CRITICAL) {
      severity = 'critical';
    } else if (metrics.duration > thresholds.WARNING) {
      severity = 'warning';
    }

    if (severity !== 'info') {
      await this.logEvent(ANALYTICS_EVENTS.PERFORMANCE.SLOW_ANALYSIS, {
        ...metrics,
        severity,
        threshold_exceeded: metrics.duration - thresholds.IDEAL,
      });

      if (severity === 'critical') {
        await this.alertPerformanceIssue(metrics);
      }
    }
  }

  // Enhanced error tracking
  async trackError(report: ErrorReport) {
    const category = report.category || 'SYSTEM';
    const subCategory = report.subCategory || 'CRASH';
    
    // Track error rate by category
    const errorKey = `${category}_${subCategory}`;
    this.errorCount[errorKey] = (this.errorCount[errorKey] || 0) + 1;

    const timeSinceLastError = Date.now() - this.lastErrorTime;
    const errorRate = this.errorCount[errorKey] / (timeSinceLastError / 60000); // errors per minute

    // Send to Sentry if critical or high error rate
    if (report.isCritical || errorRate >= PERFORMANCE_THRESHOLDS.ERROR_RATE.CRITICAL) {
      Sentry.withScope((scope) => {
        scope.setLevel(report.isCritical ? 'fatal' : 'error');
        scope.setTag('error_category', category);
        scope.setTag('error_subcategory', subCategory);
        scope.setContext('error_context', {
          ...report.context,
          error_rate: errorRate,
          session_id: this.sessionId,
          error_count: this.errorCount[errorKey],
        });
        Sentry.captureException(report.error);
      });
    }

    await this.logEvent(ANALYTICS_EVENTS.USER.ERROR_ENCOUNTERED, {
      error_message: report.error.message,
      error_category: category,
      error_subcategory: subCategory,
      is_critical: report.isCritical,
      error_rate: errorRate,
      ...report.context,
    });

    // Alert if error rate is high
    if (errorRate >= PERFORMANCE_THRESHOLDS.ERROR_RATE.CRITICAL) {
      await this.alertHighErrorRate(category, subCategory, errorRate);
    }

    this.lastErrorTime = Date.now();
  }

  // Track user feedback with context
  async trackFeedback(feedback: UserFeedback) {
    await this.logEvent(ANALYTICS_EVENTS.USER.FEEDBACK, {
      ...feedback,
      platform: Platform.OS,
      session_duration: Date.now() - this.sessionStartTime,
    });

    // Alert on critical feedback
    if (feedback.type === 'bug' && this.isCriticalFeedback(feedback.message)) {
      await this.alertCriticalFeedback(feedback);
    }
  }

  // Alert systems
  private async alertFormIssues(
    exerciseType: keyof typeof EXERCISE_THRESHOLDS,
    issues: FormMetrics['issues']
  ) {
    await this.alertCriticalIssue('Form', {
      message: `Multiple form issues detected for ${exerciseType}`,
      context: { issues, count: this.formIssueCount },
    });
  }

  private async alertPerformanceIssue(metrics: PerformanceMetrics) {
    await this.alertCriticalIssue('Performance', {
      message: `Critical performance issue in ${metrics.operationName}`,
      context: metrics,
    });
  }

  private async alertHighErrorRate(
    category: string,
    subCategory: string,
    errorRate: number
  ) {
    await this.alertCriticalIssue('Error Rate', {
      message: `High error rate in ${category}/${subCategory}: ${errorRate.toFixed(2)}/min`,
      context: { category, subCategory, error_rate: errorRate },
    });
  }

  private async alertCriticalFeedback(feedback: UserFeedback) {
    await this.alertCriticalIssue('User Feedback', {
      message: feedback.message,
      context: feedback.context,
    });
  }

  private async alertCriticalIssue(
    type: string,
    { message, context }: { message: string; context?: Record<string, any> }
  ) {
    await this.logEvent('critical_alert', {
      alert_type: type,
      message,
      ...context,
    });

    Sentry.captureMessage(`[CRITICAL] ${type}: ${message}`, {
      level: 'fatal',
      contexts: { additional: context },
    });

    if (this.isDevelopment) {
      console.error(`[CRITICAL ${type}]`, message, context);
    }
  }

  private isCriticalFeedback(message: string): boolean {
    const criticalKeywords = [
      'crash', 'freeze', 'stuck', 'unusable', 'broken',
      'data loss', 'privacy', 'security', 'injury', 'pain',
    ];
    return criticalKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private shouldAlertError(event: any): boolean {
    const criticalPaths = [
      'workout_analysis',
      'user_data',
      'camera_stream',
      'pose_detection',
      'form_analysis',
    ];
    return criticalPaths.some(path => 
      event.message?.includes(path) || 
      event.exception?.values?.[0]?.stacktrace?.frames?.some(
        (frame: any) => frame.filename?.includes(path)
      )
    );
  }

  private async logEvent(eventName: string, params?: Record<string, any>) {
    try {
      await Analytics.logEvent(eventName, {
        ...params,
        session_id: this.sessionId,
        platform: Platform.OS,
        app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      });
      
      if (this.isDevelopment) {
        console.log(`[Analytics] ${eventName}:`, params);
      }
    } catch (error) {
      if (this.isDevelopment) {
        console.error(`[Analytics] Failed to log event ${eventName}:`, error);
      }
    }
  }
}

export const analytics = new AnalyticsService();

export function useAnalytics() {
  return analytics;
} 