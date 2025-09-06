'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ExercisePicker, Exercise } from '@/components/ExercisePicker'
import { VideoCapture } from '@/components/VideoCapture'

type GameStep = 'connect' | 'select-exercise' | 'select-music' | 'playing' | 'recording' | 'results'

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

interface SpotifyAudioFeatures {
  tempo: number;
}

interface GameSession {
  exercise: Exercise;
  track: SpotifyTrack;
  audioFeatures: SpotifyAudioFeatures;
  targetReps: number;
  score: number;
}

// Mock data
const mockTracks: SpotifyTrack[] = [
  {
    id: 'track1',
    name: 'Workout Anthem',
    artists: [{ name: 'Fitness DJ' }],
    album: {
      name: 'Gym Hits 2024',
      images: [{ url: 'https://api.dicebear.com/7.x/shapes/svg?seed=workout' }]
    }
  },
  {
    id: 'track2',
    name: 'Power Up',
    artists: [{ name: 'Gym Beats' }],
    album: {
      name: 'Training Mix',
      images: [{ url: 'https://api.dicebear.com/7.x/shapes/svg?seed=power' }]
    }
  },
  {
    id: 'track3',
    name: 'Beast Mode',
    artists: [{ name: 'Workout Kings' }],
    album: {
      name: 'Heavy Lifts',
      images: [{ url: 'https://api.dicebear.com/7.x/shapes/svg?seed=beast' }]
    }
  }
];

const mockAudioFeatures: SpotifyAudioFeatures = {
  tempo: 128
};

export default function GameMode() {
  const router = useRouter()
  const { user } = useAuthContext()
  const [step, setStep] = useState<GameStep>('connect')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(mockTracks[0])
  const [audioFeatures, setAudioFeatures] = useState<SpotifyAudioFeatures | null>(mockAudioFeatures)
  const [recommendedTracks, setRecommendedTracks] = useState<SpotifyTrack[]>(mockTracks)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beatCount, setBeatCount] = useState(0)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadExercises()
  }, [])

  useEffect(() => {
    return () => {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current)
      }
    }
  }, [])

  const loadExercises = async () => {
    // Mock exercises
    setExercises([
      {
        id: 'squat-001',
        name: 'Barbell Squat',
        description: 'A compound exercise targeting legs and core',
        category: 'lower',
        difficulty: 'intermediate',
        muscle_groups: ['quadriceps', 'hamstrings', 'glutes', 'core']
      },
      {
        id: 'deadlift-001',
        name: 'Deadlift',
        description: 'A fundamental strength movement',
        category: 'lower',
        difficulty: 'intermediate',
        muscle_groups: ['back', 'hamstrings', 'glutes']
      },
      {
        id: 'bench-001',
        name: 'Bench Press',
        description: 'Classic upper body strength exercise',
        category: 'upper',
        difficulty: 'intermediate',
        muscle_groups: ['chest', 'shoulders', 'triceps']
      }
    ]);
  }

  const connectSpotify = () => {
    // In mock mode, just proceed to exercise selection
    setStep('select-exercise')
  }

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setStep('select-music')
  }

  const handleTrackSelect = async (track: SpotifyTrack) => {
    setCurrentTrack(track)
    setAudioFeatures(mockAudioFeatures)
    
    if (selectedExercise) {
      const targetReps = Math.round((mockAudioFeatures.tempo / 60) * 30) // 30 seconds of exercise
      
      setGameSession({
        exercise: selectedExercise,
        track,
        audioFeatures: mockAudioFeatures,
        targetReps,
        score: 0
      })
      
      setStep('playing')
    }
  }

  const startGame = () => {
    setIsPlaying(true)
    setBeatCount(0)

    // Start beat counter based on mock BPM
    const beatInterval = 60000 / mockAudioFeatures.tempo
    beatIntervalRef.current = setInterval(() => {
      setBeatCount(prev => prev + 1)
    }, beatInterval)

    // Auto-transition to recording after countdown
    setTimeout(() => {
      setStep('recording')
    }, 5000)
  }

  const handleVideoCapture = async (file: File) => {
    setVideoFile(file)
    setIsPlaying(false)
    
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current)
    }

    if (user && gameSession) {
      try {
        setLoading(true)
        
        // Mock video analysis
        const mockScore = Math.floor(Math.random() * 20) + 80; // Random score between 80-100
        
        setGameSession({
          ...gameSession,
          score: mockScore
        })
        
        setStep('results')
      } catch (err: any) {
        console.error('Error processing game session:', err)
        setError(err.message || 'Failed to process game session')
      } finally {
        setLoading(false)
      }
    }
  }

  const calculateRhythmScore = (actualTempo: number, targetTempo: number): number => {
    const difference = Math.abs(actualTempo - targetTempo)
    const tolerance = targetTempo * 0.1 // 10% tolerance
    
    if (difference <= tolerance) {
      return 100 - Math.round((difference / tolerance) * 10)
    }
    return Math.max(50, 100 - Math.round(difference))
  }

  // Render different steps
  if (step === 'connect') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
              Rhythm Game Mode
            </h1>
            <p className="text-gray-300 mb-8">
              Exercise to the beat of your favorite music! Connect Spotify to sync your workouts with BPM.
            </p>
            
            <button
              onClick={connectSpotify}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center gap-3 mx-auto transition-all hover:scale-105"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Connect Spotify
            </button>
            
            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold text-purple-400 mb-2">How it works:</h3>
              <ol className="text-sm text-gray-300 text-left space-y-1">
                <li>1. Connect your Spotify account</li>
                <li>2. Choose an exercise</li>
                <li>3. Select a song with the right BPM</li>
                <li>4. Exercise to the beat!</li>
                <li>5. Get scored on form & rhythm</li>
              </ol>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (step === 'select-exercise') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            
            <h1 className="text-3xl font-bold mb-2">Choose Your Exercise</h1>
            <p className="text-gray-400 mb-8">We'll find the perfect BPM for your workout</p>
            
            <div className="card">
              <ExercisePicker exercises={exercises} onSelect={handleExerciseSelect} />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (step === 'select-music') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setStep('select-exercise')}
              className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <h1 className="text-3xl font-bold mb-2">Choose Your Beat</h1>
            <p className="text-gray-400 mb-8">
              Recommended BPM for {selectedExercise?.name}: {mockAudioFeatures.tempo}
            </p>
            
            {currentTrack && (
              <div className="card mb-6">
                <h3 className="font-semibold mb-3">Currently Playing</h3>
                <TrackCard 
                  track={currentTrack} 
                  audioFeatures={audioFeatures}
                  onSelect={() => handleTrackSelect(currentTrack)}
                />
              </div>
            )}
            
            <div className="card">
              <h3 className="font-semibold mb-3">Recommended Workout Tracks</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedTracks.map((track) => (
                    <TrackCard 
                      key={track.id}
                      track={track} 
                      onSelect={() => handleTrackSelect(track)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (step === 'playing') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{gameSession?.exercise.name}</h1>
            <div className="mb-8">
              <p className="text-2xl text-gray-300 mb-2">{gameSession?.track.name}</p>
              <p className="text-lg text-gray-400">
                {gameSession?.track.artists.map(a => a.name).join(', ')}
              </p>
            </div>
            
            <div className="mb-8">
              <div className="text-6xl font-bold text-purple-400 mb-4">
                {Math.round(gameSession?.audioFeatures.tempo || 0)}
              </div>
              <p className="text-gray-400">BPM</p>
            </div>
            
            {!isPlaying ? (
              <button
                onClick={startGame}
                className="btn-primary text-xl px-12 py-4"
              >
                Start Game
              </button>
            ) : (
              <div>
                <div className="text-8xl font-bold mb-4">
                  {5 - Math.floor(beatCount / 4)}
                </div>
                <p className="text-gray-400">Get Ready!</p>
                <div className="mt-8 flex justify-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full transition-all ${
                        beatCount % 4 === i ? 'bg-purple-400 scale-150' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (step === 'recording') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Record Your Exercise</h1>
            <p className="text-gray-400 mb-8">
              Exercise to the beat! Target: {gameSession?.targetReps} reps
            </p>
            
            <div className="card">
              <VideoCapture 
                onCapture={handleVideoCapture} 
                exerciseName={gameSession?.exercise.name}
              />
            </div>
            
            {/* Beat indicator */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-gray-800 rounded-full px-8 py-4 flex items-center gap-4">
                <span className="text-gray-400">BPM: {Math.round(gameSession?.audioFeatures.tempo || 0)}</span>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all ${
                        beatCount % 4 === i ? 'bg-purple-400 scale-150' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (step === 'results') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-8 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-bold mb-8">Game Complete!</h1>
            
            <div className="card mb-6">
              <div className="text-6xl font-bold text-purple-400 mb-2">
                {gameSession?.score}%
              </div>
              <p className="text-gray-400">Total Score</p>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Exercise</span>
                  <span>{gameSession?.exercise.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Song</span>
                  <span>{gameSession?.track.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Target BPM</span>
                  <span>{Math.round(gameSession?.audioFeatures.tempo || 0)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('select-music')
                  setGameSession(null)
                }}
                className="btn-secondary flex-1"
              >
                Play Again
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary flex-1"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return null
}

// Track card component
function TrackCard({ 
  track, 
  audioFeatures,
  onSelect 
}: { 
  track: SpotifyTrack
  audioFeatures?: SpotifyAudioFeatures | null
  onSelect: () => void 
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all text-left flex items-center gap-4"
    >
      {track.album.images[0] && (
        <img 
          src={track.album.images[0].url} 
          alt={track.album.name}
          className="w-16 h-16 rounded"
        />
      )}
      <div className="flex-1">
        <h4 className="font-medium text-white">{track.name}</h4>
        <p className="text-sm text-gray-400">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>
      {audioFeatures && (
        <div className="text-right">
          <div className="text-lg font-semibold text-purple-400">
            {Math.round(audioFeatures.tempo)}
          </div>
          <div className="text-xs text-gray-400">BPM</div>
        </div>
      )}
    </button>
  )
} 