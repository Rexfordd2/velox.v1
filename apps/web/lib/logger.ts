type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PII_FIELDS = new Set([
  'email', 'e_mail', 'userEmail', 'phone', 'phoneNumber', 'ssn', 'password', 'token', 'authorization', 'auth', 'cookie'
]);

function maskValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length <= 4) return '***';
    return value.slice(0, 2) + '***' + value.slice(-2);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(maskValue);
  if (typeof value === 'object') return maskObject(value as Record<string, unknown>);
  return '***';
}

export function maskObject(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input)) {
    if (PII_FIELDS.has(key.toLowerCase())) {
      out[key] = maskValue(val);
      continue;
    }
    if (key.toLowerCase().includes('email') || key.toLowerCase().includes('token')) {
      out[key] = maskValue(val);
      continue;
    }
    if (val && typeof val === 'object') {
      out[key] = maskValue(val);
    } else {
      out[key] = val as unknown;
    }
  }
  return out;
}

function nowIso(): string {
  try { return new Date().toISOString(); } catch { return String(Date.now()); }
}

function toJsonLine(payload: Record<string, unknown>): string {
  try { return JSON.stringify(payload); } catch { return JSON.stringify({ message: 'log_json_error' }); }
}

export interface LogContext {
  requestId?: string;
  route?: string;
  userId?: string;
  ip?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  [key: string]: unknown;
}

export const logger = {
  log(level: LogLevel, message: string, ctx: LogContext = {}) {
    const requestId = ctx.requestId || (typeof window !== 'undefined' ? (document.cookie.match(/(?:^|; )velox_rid=([^;]+)/)?.[1] ?? undefined) : undefined);
    const base = maskObject({ ...ctx, requestId });
    const line = toJsonLine({
      level,
      time: nowIso(),
      message,
      ...base,
    });
    // eslint-disable-next-line no-console
    if (level === 'error') console.error(line); else if (level === 'warn') console.warn(line); else if (level === 'debug') console.debug(line); else console.log(line);
  },
  debug(message: string, ctx?: LogContext) { this.log('debug', message, ctx); },
  info(message: string, ctx?: LogContext) { this.log('info', message, ctx); },
  warn(message: string, ctx?: LogContext) { this.log('warn', message, ctx); },
  error(message: string, ctx?: LogContext) { this.log('error', message, ctx); },
};

export function getRequestIdFromHeaders(headers: Headers | Record<string, string | string[] | undefined> | null | undefined): string | undefined {
  if (!headers) return undefined;
  try {
    if (headers instanceof Headers) {
      return headers.get('x-request-id') ?? headers.get('x-trace-id') ?? undefined;
    }
    const h = headers as Record<string, string | string[] | undefined>;
    const keys = Object.keys(h);
    for (const k of keys) {
      if (k.toLowerCase() === 'x-request-id' || k.toLowerCase() === 'x-trace-id') {
        const v = h[k];
        return Array.isArray(v) ? v[0] : v ?? undefined;
      }
    }
  } catch {}
  return undefined;
}


