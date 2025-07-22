'use client'

import Link from 'next/link'

export default function VerifyEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            We've sent you a verification link to confirm your email address
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="text-purple-400">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <p className="text-gray-300">
            Please check your inbox and click the verification link to activate your account.
          </p>
          
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button className="text-purple-400 hover:text-purple-300">
              resend verification email
            </button>
          </p>
        </div>

        <div className="pt-4">
          <Link href="/auth/signin" className="text-purple-400 hover:text-purple-300">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
} 