import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token, expires_in } = await request.json()
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    const res = NextResponse.json({ ok: true })
    const maxAge = typeof expires_in === 'number' ? expires_in : 60 * 60

    res.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    })
    res.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return res
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}


