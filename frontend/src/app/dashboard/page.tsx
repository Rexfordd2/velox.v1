'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getUserSessions } from '@/lib/getUserSessions'
import { supabase } from '@/lib/supabase'
import { CircularProgress } from '@/components/CircularProgress'

export default function Dashboard() {
  const { user, signOut } = useAuthContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [averageScore, setAverageScore] = useState<number | null>(null)

  useEffect(() => {
    if (user) {
      loadRecentSessions()
    }
  }, [user])

  useEffect(() => {
    // Show success message if redirected after recording
    if (searchParams.get('success') === 'recorded') {
      // You could show a toast notification here
      console.log('Exercise recorded successfully!')
    }
  }, [searchParams])

  const loadRecentSessions = async () => {
    try {
      const sessions = await getUserSessions(user!.id)
      setRecentSessions(sessions.slice(0, 5)) // Show last 5
      
      // Calculate average form score
      const sessionsWithScores = sessions.filter(s => s.score !== null && s.score !== undefined)
      if (sessionsWithScores.length > 0) {
        const avg = sessionsWithScores.reduce((acc, s) => acc + s.score, 0) / sessionsWithScores.length
        setAverageScore(Math.round(avg))
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <button
              onClick={signOut}
              className="btn-secondary"
            >
              Sign Out
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => router.push('/record')}
              className="card hover:border-purple-500 transition-all hover:scale-105"
            >
              <div className="text-purple-400 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Record Exercise</h3>
              <p className="text-sm text-gray-400">Capture and analyze your form</p>
            </button>

            <button
              onClick={() => router.push('/game')}
              className="card hover:border-green-500 transition-all hover:scale-105 bg-gradient-to-br from-purple-900/20 to-green-900/20"
            >
              <div className="text-green-400 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Game Mode</h3>
              <p className="text-sm text-gray-400">Exercise to the beat with Spotify</p>
            </button>

            <button
              onClick={() => router.push('/profile')}
              className="card hover:border-cyan-500 transition-all hover:scale-105"
            >
              <div className="text-cyan-400 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">View Profile</h3>
              <p className="text-sm text-gray-400">Track your progress</p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Workouts */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="border-l-2 border-purple-500 pl-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{session.exercise?.name || 'Unknown Exercise'}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {session.score !== null && session.score !== undefined && (
                          <span className={`text-sm font-semibold ${getScoreColor(session.score)}`}>
                            {session.score}%
                          </span>
                        )}
                      </div>
                      {session.notes && (
                        <p className="text-sm text-gray-500 mt-1">{session.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No recent workouts</p>
              )}
            </div>

            {/* Average Form Score */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Average Form Score</h2>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-20 bg-gray-700 rounded"></div>
                </div>
              ) : averageScore !== null ? (
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore}%
                  </div>
                  <p className="text-gray-400 mt-2">
                    Based on {recentSessions.filter(s => s.score).length} analyzed sessions
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">90%+ Excellent</span>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">70%+ Good</span>
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">50%+ Fair</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>No analyzed sessions yet</p>
                  <p className="text-sm mt-2">Record an exercise to get AI form analysis</p>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Sessions</span>
                    <span className="font-semibold">{recentSessions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">This Week</span>
                    <span className="font-semibold">
                      {recentSessions.filter(s => {
                        const date = new Date(s.created_at)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return date > weekAgo
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best Score</span>
                    <span className="font-semibold">
                      {recentSessions.reduce((max, s) => 
                        s.score > max ? s.score : max, 0
                      ) || '-'}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 