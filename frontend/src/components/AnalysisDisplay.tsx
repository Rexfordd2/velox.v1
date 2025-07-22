'use client'

import { PoseAnalysisResult } from '@/lib/analyzeVideo'
import { CircularProgress } from './CircularProgress'

interface AnalysisDisplayProps {
  analysis: PoseAnalysisResult
  exerciseName: string
}

export function AnalysisDisplay({ analysis, exerciseName }: AnalysisDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Needs Work'
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">{exerciseName} Analysis</h2>
        <div className="flex justify-center mb-4">
          <CircularProgress 
            value={analysis.metrics.form_score} 
            size={180}
            strokeWidth={12}
            className={getScoreColor(analysis.metrics.form_score)}
          />
        </div>
        <p className={`text-xl font-semibold ${getScoreColor(analysis.metrics.form_score)}`}>
          {getScoreLabel(analysis.metrics.form_score)}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Rep Count"
          value={analysis.metrics.rep_count}
          unit="reps"
          icon="🔁"
        />
        <MetricCard
          label="Depth"
          value={`${Math.round(analysis.metrics.depth)}°`}
          unit=""
          icon="📐"
        />
        <MetricCard
          label="Tempo"
          value={analysis.metrics.tempo.toFixed(1)}
          unit="sec/rep"
          icon="⏱️"
        />
        <MetricCard
          label="Stability"
          value={`${Math.round(analysis.metrics.stability)}%`}
          unit=""
          icon="⚖️"
        />
      </div>

      {/* Feedback Section */}
      {analysis.feedback.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-purple-400">💡</span>
            Form Feedback
          </h3>
          <ul className="space-y-2">
            {analysis.feedback.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Score */}
      <div className="text-center text-sm text-gray-400">
        Analysis Confidence: {Math.round(analysis.confidence_score * 100)}%
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  unit: string
  icon: string
}

function MetricCard({ label, value, unit, icon }: MetricCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  )
} 