import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/contexts/QueryProvider'
import Link from 'next/link'
import ObsProvider from './providers/ObsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Velox - Fitness Intelligence Platform',
  description: 'Compete Against Perfection with AI-powered movement analysis and rhythm-driven training.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <ObsProvider>
            <header className="bg-gray-900 border-b border-gray-800">
              <nav className="max-w-7xl mx-auto px-4 py-4 flex gap-4 text-sm">
                <Link href="/">Home</Link>
                <Link href="/profile">Profile</Link>
                <Link href="/feed">Feed</Link>
                <Link href="/leaderboard/squat">Leaderboards</Link>
                <Link href="/lift">Lift to the Beat</Link>
              </nav>
            </header>
            <main className="min-h-screen bg-gray-900 text-white">
              {children}
            </main>
            </ObsProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 