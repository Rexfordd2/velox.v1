// Vitest root setup: provide minimal JSDOM globals and silences
import { expect, vi } from 'vitest';

// Polyfill window and document if needed (jsdom env usually provides these)
if (!(globalThis as any).window) {
  (globalThis as any).window = globalThis as any;
}

// Stub matchMedia often required by UI libs
if (!(window as any).matchMedia) {
  (window as any).matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Quiet console noise during tests
const originalError = console.error;
console.error = (...args: any[]) => {
  const msg = String(args[0] ?? '');
  if (msg.includes('React') && msg.includes('act')) return;
  originalError(...args);
};

expect.extend({});


