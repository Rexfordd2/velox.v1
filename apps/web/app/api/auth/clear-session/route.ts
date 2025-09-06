import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('sb-access-token', '', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  res.cookies.set('sb-refresh-token', '', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}


