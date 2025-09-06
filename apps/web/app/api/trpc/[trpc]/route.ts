import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/api/root';
import { createContext } from '@/api/context';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = env.CORS_ALLOWED_ORIGINS;
  if (allowed.includes('*')) return true;
  return allowed.includes(origin);
}

function buildCorsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Vary': 'Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
  if (origin && isOriginAllowed(origin)) {
    return { ...headers, 'Access-Control-Allow-Origin': origin };
  }
  if (env.NODE_ENV !== 'production' && env.CORS_ALLOWED_ORIGINS.includes('*')) {
    return { ...headers, 'Access-Control-Allow-Origin': '*' };
  }
  return headers;
}

async function handler(req: Request) {
  const origin = req.headers.get('origin');
  const requestId = req.headers.get('x-request-id') || req.headers.get('x-trace-id') || undefined;
  // Pre-flight handled in OPTIONS export below
  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    responseMeta({ errors }) {
      if (errors.length > 0) {
        const first = errors[0];
        const code = first.code;
        const map: Record<string, number> = {
          BAD_REQUEST: 400,
          UNAUTHORIZED: 401,
          FORBIDDEN: 403,
          NOT_FOUND: 404,
          CONFLICT: 409,
          PRECONDITION_FAILED: 412,
          TOO_MANY_REQUESTS: 429,
          METHOD_NOT_SUPPORTED: 405,
        };
        const status = map[code] ?? 500;
        // Log first error in a structured way without PII
        try {
          logger.error('trpc_error', {
            requestId,
            route: '/api/trpc',
            code,
            message: first.message,
            path: (first as any).path,
          });
        } catch {}
        return { status };
      }
      return {};
    },
  });
  const corsHeaders = buildCorsHeaders(origin);
  const resp = new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
  if (requestId) resp.headers.set('x-request-id', requestId);
  Object.entries(corsHeaders).forEach(([k, v]) => resp.headers.set(k, v as string));
  return resp;
}

export { handler as GET, handler as POST };

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  if (!isOriginAllowed(origin) && !(env.NODE_ENV !== 'production' && env.CORS_ALLOWED_ORIGINS.includes('*'))) {
    return new Response(null, { status: 403 });
  }
  const headers = buildCorsHeaders(origin);
  return new Response(null, { status: 204, headers });
}