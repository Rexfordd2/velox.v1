import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Add any critical service checks here
    // For example, database connection, cache service, etc.
    
    // For now, just return a success response
    return NextResponse.json(
      { status: 'healthy', timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { status: 'unhealthy', error: 'Service unavailable' },
      { status: 503 }
    )
  }
} 