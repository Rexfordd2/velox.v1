import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCacheControlForPath, setCacheControl } from './lib/cache'

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname

  // Create base response
  let response = NextResponse.next()

  // Apply cache control headers based on path
  const cacheType = getCacheControlForPath(pathname)
  response = setCacheControl(response, cacheType)

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Remove powered by header
  response.headers.delete('x-powered-by')

  return response
}

// Configure paths that should be handled by middleware
export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
} 