import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCacheControlForPath, setCacheControl } from './lib/cache'
import { createClient } from '@supabase/supabase-js'
import { env } from './lib/env'

function getOrCreateRequestId(request: NextRequest): string {
  const headerId = request.headers.get('x-request-id')
  if (headerId && headerId.length > 0) return headerId
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID()
  }
  // Fallback in rare environments
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function middleware(request: NextRequest) {
  // Get or create request id and ensure it is forwarded to the app routes
  const requestId = getOrCreateRequestId(request)
  const forwardedHeaders = new Headers(request.headers)
  forwardedHeaders.set('x-request-id', requestId)

  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname

  // Create base response and forward the modified request headers downstream
  let response = NextResponse.next({ request: { headers: forwardedHeaders } })

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

  // Attach request id header and cookie for client visibility
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-trace-id', requestId)
  response.cookies.set({
    name: 'velox_rid',
    value: requestId,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: request.nextUrl.protocol === 'https:'
  })

  // Auth guard
  const protectedPaths = [
    '/profile',
    '/analyze',
    '/progress',
    '/replay',
    '/verify',
    '/admin',
  ]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected) {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    // Support both Authorization header and httpOnly cookies set by our API
    const authHeader = request.headers.get('authorization') || ''
    const headerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null
    const cookieToken = request.cookies.get('sb-access-token')?.value || null
    const token = headerToken || cookieToken

    if (!token) {
      const resp = NextResponse.redirect(new URL('/login', request.url))
      resp.headers.set('x-request-id', requestId)
      resp.headers.set('x-trace-id', requestId)
      return resp
    }
    return supabase.auth
      .getUser(token)
      .then(({ data }) => {
        if (!data.user) {
          const resp = NextResponse.redirect(new URL('/login', request.url))
          resp.headers.set('x-request-id', requestId)
          resp.headers.set('x-trace-id', requestId)
          return resp
        }
        if (pathname.startsWith('/admin')) {
          const role = (data.user.user_metadata as any)?.role
          if (role !== 'admin') {
            const resp = NextResponse.redirect(new URL('/', request.url))
            resp.headers.set('x-request-id', requestId)
            resp.headers.set('x-trace-id', requestId)
            return resp
          }
        }
        return response
      })
      .catch(() => {
        const resp = NextResponse.redirect(new URL('/login', request.url))
        resp.headers.set('x-request-id', requestId)
        resp.headers.set('x-trace-id', requestId)
        return resp
      })
  }

  return response
}

// Configure paths that should be handled by middleware
export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
} 