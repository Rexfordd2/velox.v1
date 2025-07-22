"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProgressChart from './ProgressChart';
import { PerformanceMetrics } from './PerformanceMetrics';
import { CircularProgress } from './PerformanceMetrics';
import { Activity, Target, AlertTriangle, TrendingUp, Check, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface FormError {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  jointAngles?: Record<string, number>;
}

interface FormAnalysisData {
  exerciseId: string;
  sessionId: string;
  overallScore: number;
  formErrors: FormError[];
  metrics: {
    stability: number;
    range: number;
    tempo: number;
    symmetry: number;
  };
  trends: {
    dates: string[];
    scores: number[];
  };
}

interface FormAnalysisDashboardProps {
  exerciseId: string;
  userId: string;
}

export function FormAnalysisDashboard({ exerciseId, userId }: FormAnalysisDashboardProps) {
  const [analysisData, setAnalysisData] = useState<FormAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      
      // Fetch latest session data
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*, reps(*)')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Fetch historical data for trends
      const { data: historicalData } = await supabase
        .from('sessions')
        .select('created_at, score')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (sessionData && historicalData) {
        const formattedData: FormAnalysisData = {
          exerciseId,
          sessionId: sessionData.id,
          overallScore: sessionData.score,
          formErrors: sessionData.reps.reduce((errors: FormError[], rep) => {
            return [...errors, ...rep.form_errors];
          }, []),
          metrics: {
            stability: calculateMetric(sessionData.reps, 'stability'),
            range: calculateMetric(sessionData.reps, 'range'),
            tempo: calculateMetric(sessionData.reps, 'tempo'),
            symmetry: calculateMetric(sessionData.reps, 'symmetry'),
          },
          trends: {
            dates: historicalData.map(d => new Date(d.created_at).toLocaleDateString()),
            scores: historicalData.map(d => d.score),
          }
        };

        setAnalysisData(formattedData);
      }

      setLoading(false);
    };

    fetchAnalysisData();
  }, [exerciseId, userId]);

  const calculateMetric = (reps: any[], metricType: string): number => {
    // Implement metric calculation based on rep data
    return reps.reduce((acc, rep) => acc + (rep[metricType] || 0), 0) / reps.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No analysis data available</p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Stability',
      value: analysisData.metrics.stability * 100,
      target: 90,
      color: 'purple'
    },
    {
      label: 'Range of Motion',
      value: analysisData.metrics.range * 100,
      target: 95,
      color: 'blue'
    },
    {
      label: 'Tempo',
      value: analysisData.metrics.tempo * 100,
      target: 85,
      color: 'green'
    },
    {
      label: 'Symmetry',
      value: analysisData.metrics.symmetry * 100,
      target: 90,
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Form Analysis</h2>
          <CircularProgress
            value={analysisData.overallScore}
            size={120}
            strokeWidth={8}
            color="purple"
          />
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
        <PerformanceMetrics metrics={metrics} />
      </motion.div>

      {/* Trend Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold mb-4">Progress Trend</h3>
        <ProgressChart
          labels={analysisData.trends.dates}
          values={analysisData.trends.scores}
        />
      </motion.div>

      {/* Form Feedback Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {analysisData.formErrors.map((error, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={`bg-gray-800 rounded-xl p-6 border-l-4 ${
              error.severity === 'high'
                ? 'border-red-500'
                : error.severity === 'medium'
                ? 'border-yellow-500'
                : 'border-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {error.severity === 'high' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : error.severity === 'medium' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Check className="w-5 h-5 text-green-500" />
                )}
                <h4 className="font-semibold">{error.type}</h4>
              </div>
            </div>
            <p className="text-gray-400 mb-4">{error.message}</p>
            {error.jointAngles && (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(error.jointAngles).map(([joint, angle]) => (
                  <div key={joint} className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400">{joint}</div>
                    <div className="text-lg font-semibold">{angle}°</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Improvement Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisData.formErrors.map((error, index) => (
            <div key={index} className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">
                  Improve {error.type.toLowerCase()} form
                </h4>
                <p className="text-sm text-gray-400">
                  Focus on maintaining proper {error.type.toLowerCase()} throughout the movement.
                  {error.severity === 'high' && ' This is a critical area for improvement.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 