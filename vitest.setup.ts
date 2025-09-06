import { vi, expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Provide minimal env vars for Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon';

// JSDOM polyfills commonly used by components and hooks
if (!(globalThis as any).window) {
  (globalThis as any).window = globalThis as any;
}

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

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(window as any).ResizeObserver = (window as any).ResizeObserver || ResizeObserverMock;

class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  constructor(_callback: IntersectionObserverCallback) {}
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}
(window as any).IntersectionObserver = (window as any).IntersectionObserver || IntersectionObserverMock as any;

// Mock URL APIs often used for blobs/media
if (typeof URL.createObjectURL === 'undefined') {
  (URL as any).createObjectURL = vi.fn();
}
if (typeof URL.revokeObjectURL === 'undefined') {
  (URL as any).revokeObjectURL = vi.fn();
}

// Supabase global mock so calls do not touch network
vi.mock('@supabase/supabase-js', () => {
  const makeChain = () => {
    const chain: any = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.throwOnError = vi.fn(() => chain);
    chain.single = vi.fn(async () => ({ data: null, error: null }));
    chain.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    chain.then = vi.fn(async () => ({ data: null, error: null }));
    chain.insert = vi.fn(() => chain);
    chain.update = vi.fn(() => chain);
    chain.delete = vi.fn(() => chain);
    chain.upsert = vi.fn(() => chain);
    return chain;
  };
  const shared: any = {
    from: vi.fn((_table: string) => makeChain()),
    storage: { from: () => ({ upload: vi.fn().mockResolvedValue({ data: {}, error: null }), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }) }) },
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
  };
  return {
    createClient: vi.fn(() => shared),
  };
});

// Silence noisy React act warnings
const originalError = console.error;
console.error = (...args: any[]) => {
  const msg = String(args[0] ?? '');
  if (msg.includes('act(')) return;
  originalError(...args);
};

afterEach(() => {
  vi.clearAllMocks();
});

// Make React available globally for legacy JSX transform cases
(global as any).React = React;

// Extend expect with jest-dom matchers
expect.extend(matchers as any);

// Provide a minimal Jest global shim for tests using global jest
(global as any).jest = {
  fn: vi.fn,
  mock: vi.mock.bind(vi),
  clearAllMocks: vi.clearAllMocks,
  setTimeout: (_ms: number) => {},
};

// React Native/Expo flags used by some libs
(global as any).__DEV__ = false;

// Stable UUIDs for tests expecting deterministic values
vi.mock('uuid', () => ({ v4: () => '00000000-0000-0000-0000-000000000000' }));


