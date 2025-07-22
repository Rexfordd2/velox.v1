import { NextResponse } from 'next/server'

export const CACHE_CONTROL = {
  // Static assets (images, fonts, etc.)
  static: 'public, max-age=31536000, immutable',
  
  // Dynamic but rarely changing content
  dynamic: 'public, max-age=3600, stale-while-revalidate=86400',
  
  // Frequently changing content
  frequent: 'public, max-age=60, stale-while-revalidate=600',
  
  // API responses
  api: 'private, no-cache, no-store, must-revalidate',
  
  // User-specific content
  user: 'private, no-cache, no-store, must-revalidate',
} as const

type CacheControlType = keyof typeof CACHE_CONTROL

export const setCacheControl = (res: NextResponse, type: CacheControlType) => {
  res.headers.set('Cache-Control', CACHE_CONTROL[type])
  return res
}

export const getCacheControlForPath = (path: string): CacheControlType => {
  // Static assets
  if (path.match(/\.(jpg|jpeg|png|gif|ico|svg|woff2?|ttf|eot)$/)) {
    return 'static'
  }
  
  // API endpoints
  if (path.startsWith('/api/')) {
    return 'api'
  }
  
  // User-specific pages
  if (path.startsWith('/profile/') || path.startsWith('/dashboard/')) {
    return 'user'
  }
  
  // Dynamic content
  if (path.match(/\/(exercises|workouts|leaderboard)/)) {
    return 'frequent'
  }
  
  // Default to dynamic caching
  return 'dynamic'
}

export const withCache = (handler: Function) => {
  return async (req: Request, ...args: any[]) => {
    const response = await handler(req, ...args)
    
    if (response instanceof NextResponse) {
      const cacheType = getCacheControlForPath(new URL(req.url).pathname)
      return setCacheControl(response, cacheType)
    }
    
    return response
  }
} 