import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger, maskObject } from '@/lib/logger'

const schema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  url: z.string().optional(),
  timestamp: z.string().optional(),
  user: z.object({ id: z.string().optional(), email: z.string().optional(), role: z.string().optional() }).optional(),
  system: z.object({ browser: z.string().optional(), os: z.string().optional(), device: z.string().optional(), viewport: z.string().optional(), memory: z.number().optional() }).optional(),
  performance: z.object({ connection: z.string().optional(), memory: z.number().optional(), cpu: z.number().optional() }).optional(),
  app: z.object({ version: z.string().optional(), environment: z.string().optional(), lastAction: z.string().optional(), componentTree: z.string().optional() }).optional(),
  extra: z.record(z.any()).optional(),
})

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') || request.headers.get('x-trace-id') || undefined
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = schema.parse(body)

    // Mask PII and log as structured JSON; avoid storing raw email/token
    const safe = maskObject(parsed as unknown as Record<string, unknown>)
    logger.error('client_error', { requestId, route: '/api/error-reporting', ...safe })
    return NextResponse.json({ ok: true }, { status: 202, headers: { 'x-request-id': requestId || '' } })
  } catch (err: any) {
    logger.error('client_error_invalid', { requestId, route: '/api/error-reporting', error: err?.message })
    return NextResponse.json({ ok: false }, { status: 400, headers: { 'x-request-id': requestId || '' } })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}


