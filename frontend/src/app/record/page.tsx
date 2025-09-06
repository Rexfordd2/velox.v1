'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ExercisePicker, Exercise } from '@/components/ExercisePicker'
import { VideoCapture } from '@/components/VideoCapture'
import { AnalysisDisplay } from '@/components/AnalysisDisplay'
import { supabase } from '@/lib/supabase'
import { uploadVideo } from '@/lib/uploadVideo'
import { insertSession } from '@/lib/insertSession'
import { getExercises } from '@/lib/getExercises'
import { analyzeVideo, PoseAnalysisResult } from '@/lib/analyzeVideo'

type RecordingStep = 'select' | 'record' | 'analyze' | 'review' | 'saving'

export default function RecordExercise() {
  const router = useRouter()
  const { user } = useAuthContext()
  const [step, setStep] = useState<RecordingStep>('select')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PoseAnalysisResult | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExercises()
  }, [])

  useEffect(() => {
    // Create object URL for video preview
    if (videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [videoFile])

  const loadExercises = async () => {
    try {
      const data = await getExercises()
      setExercises(data || [])
    } catch (err) {
      console.error('Error loading exercises:', err)
      setError('Failed to load exercises')
    }
  }

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setStep('record')
  }

  const handleVideoCapture = async (file: File) => {
    setVideoFile(file)
    setStep('analyze')
    setError(null)
    
    // Start AI analysis
    if (selectedExercise && user) {
      try {
        setLoading(true)
        // Map exercise name to type that AI backend expects
        const exerciseType = selectedExercise.name.toLowerCase().includes('squat') ? 'squat' :
                           selectedExercise.name.toLowerCase().includes('deadlift') ? 'deadlift' :
                           selectedExercise.name.toLowerCase().includes('bench') ? 'bench_press' :
                           'squat' // default
        
        const result = await analyzeVideo(file, exerciseType, user.id)
        setAnalysis(result)
        setStep('review')
      } catch (err: any) {
        console.error('Error analyzing video:', err)
        setError(err.message || 'Failed to analyze video. You can still save without analysis.')
        // Allow proceeding without analysis
        setStep('review')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSave = async () => {
    if (!selectedExercise || !videoFile || !user) return

    setStep('saving')
    setLoading(true)
    setError(null)

    try {
      // Upload video to Supabase Storage
      const videoPath = await uploadVideo(videoFile, user.id)
      
      // Create session record with analysis data
      await insertSession({
        user_id: user.id,
        exercise_id: selectedExercise.id,
        notes: notes.trim() || null,
        video_url: videoPath,
        score: analysis?.metrics.form_score,
        duration: analysis ? Math.round(analysis.metrics.tempo * analysis.metrics.rep_count) : undefined
      })

      router.push('/dashboard?success=recorded')
    } catch (err: any) {
      console.error('Error saving exercise:', err)
      setError(err.message || 'Failed to save exercise')
      setStep('review')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'record') {
      setStep('select')
    } else if (step === 'analyze') {
      setStep('record')
      setVideoFile(null)
      setVideoUrl(null)
      setAnalysis(null)
    } else if (step === 'review') {
      setStep('record')
      setVideoFile(null)
      setVideoUrl(null)
      setAnalysis(null)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            
            <h1 className="text-3xl font-bold mb-2">Record Exercise</h1>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mt-6">
              <div className={`flex items-center gap-2 ${step === 'select' ? 'text-purple-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'select' ? 'bg-purple-500' : 'bg-gray-700'
                }`}>
                  1
                </div>
                <span className="hidden sm:inline">Select</span>
              </div>
              
              <div className="flex-1 h-px bg-gray-700" />
              
              <div className={`flex items-center gap-2 ${step === 'record' ? 'text-purple-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'record' ? 'bg-purple-500' : ['analyze', 'review', 'saving'].includes(step) ? 'bg-gray-600' : 'bg-gray-700'
                }`}>
                  2
                </div>
                <span className="hidden sm:inline">Record</span>
              </div>
              
              <div className="flex-1 h-px bg-gray-700" />
              
              <div className={`flex items-center gap-2 ${step === 'analyze' ? 'text-purple-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'analyze' ? 'bg-purple-500' : ['review', 'saving'].includes(step) ? 'bg-gray-600' : 'bg-gray-700'
                }`}>
                  3
                </div>
                <span className="hidden sm:inline">Analyze</span>
              </div>
              
              <div className="flex-1 h-px bg-gray-700" />
              
              <div className={`flex items-center gap-2 ${['review', 'saving'].includes(step) ? 'text-purple-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['review', 'saving'].includes(step) ? 'bg-purple-500' : 'bg-gray-700'
                }`}>
                  4
                </div>
                <span className="hidden sm:inline">Review</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="card">
            {step === 'select' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Choose an Exercise</h2>
                <ExercisePicker exercises={exercises} onSelect={handleExerciseSelect} />
              </div>
            )}

            {step === 'record' && selectedExercise && (
              <div>
                <div className="mb-6">
                  <button
                    onClick={handleBack}
                    className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Change Exercise
                  </button>
                  
                  <h2 className="text-xl font-semibold">{selectedExercise.name}</h2>
                  {selectedExercise.description && (
                    <p className="text-gray-400 mt-1">{selectedExercise.description}</p>
                  )}
                </div>
                
                <VideoCapture onCapture={handleVideoCapture} exerciseName={selectedExercise.name} />
                
                {selectedExercise.instructions && (
                  <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="font-medium mb-2">Instructions</h3>
                    <p className="text-sm text-gray-300">{selectedExercise.instructions}</p>
                  </div>
                )}
              </div>
            )}

            {step === 'analyze' && (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">Analyzing Your Form...</h2>
                <div className="inline-flex items-center justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500" />
                </div>
                <p className="text-gray-400 mt-4">
                  Our AI is analyzing your movement patterns
                </p>
              </div>
            )}

            {(step === 'review' || step === 'saving') && selectedExercise && videoUrl && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Review Your Recording</h2>
                
                <div className="space-y-6">
                  {/* Video and Analysis side by side on larger screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Video Preview</h3>
                      <video
                        src={videoUrl}
                        controls
                        className="w-full rounded-lg bg-black"
                      />
                    </div>
                    
                    {analysis && (
                      <div>
                        <AnalysisDisplay 
                          analysis={analysis} 
                          exerciseName={selectedExercise.name}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block font-medium mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field w-full h-24 resize-none"
                      placeholder="Any notes about your form, how it felt, etc..."
                      disabled={step === 'saving'}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleBack}
                      className="btn-secondary"
                      disabled={step === 'saving'}
                    >
                      Re-record
                    </button>
                    
                    <button
                      onClick={handleSave}
                      className="btn-primary flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Exercise'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 