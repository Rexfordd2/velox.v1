import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Compete Against Perfection
          </h1>
          <p className="text-xl text-gray-300">
            AI-powered movement analysis meets rhythm-driven training
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="card space-y-4">
            <h2 className="text-2xl font-semibold text-purple-400">AI Movement Analysis</h2>
            <p className="text-gray-300">
              Real-time pose detection and form analysis with instant feedback on your technique
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="text-2xl font-semibold text-cyan-400">Velocity-Based Training</h2>
            <p className="text-gray-300">
              Track bar speed, tempo, and performance metrics to optimize your training
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="text-2xl font-semibold text-purple-400">Rhythm-Driven Gameplay</h2>
            <p className="text-gray-300">
              Sync with your music's BPM and train to the beat with dynamic challenges
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="text-2xl font-semibold text-cyan-400">Community & Social</h2>
            <p className="text-gray-300">
              Join challenges, compete on leaderboards, and share your progress
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 mt-12">
          <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
            Get Started
          </Link>
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 