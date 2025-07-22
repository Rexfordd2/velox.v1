import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import React from 'react';
import { JSDOM } from 'jsdom';
import './mocks/supabase';

// Set up JSDOM
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

// Set up global variables that JSDOM provides
const window = dom.window as unknown as Window & typeof globalThis;
global.window = window;
global.document = window.document;
global.navigator = window.navigator;

// Create a mock MediaDevices implementation
const mockMediaDevices = {
  ondevicechange: null,
  enumerateDevices: vi.fn().mockResolvedValue([]),
  getDisplayMedia: vi.fn().mockRejectedValue(new Error('Not implemented')),
  getSupportedConstraints: vi.fn().mockReturnValue({}),
  getUserMedia: vi.fn().mockImplementation(() => Promise.resolve({ getTracks: () => [] })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
} as unknown as MediaDevices;

// Set up navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
  configurable: true,
});

// Make React available globally for JSX
global.React = React;

// Extend expect with testing-library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit
  ) {
    if (options?.root instanceof Element) this.root = options.root;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    if (options?.threshold) {
      this.thresholds = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold];
    }
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

window.IntersectionObserver = IntersectionObserverMock;

// Mock createRange
document.createRange = () => {
  const range = new Range();
  range.getBoundingClientRect = vi.fn();
  range.getClientRects = () => ({
    item: () => null,
    length: 0,
    [Symbol.iterator]: vi.fn(),
  });
  return range;
};

// Mock HTMLElement
if (typeof window.HTMLElement === 'undefined') {
  Object.defineProperty(window, 'HTMLElement', {
    writable: true,
    value: class HTMLElement {},
  });
}

// Mock HTMLMediaElement
if (typeof window.HTMLMediaElement === 'undefined') {
  Object.defineProperty(window, 'HTMLMediaElement', {
    writable: true,
    value: class HTMLMediaElement {
      play = vi.fn();
      pause = vi.fn();
      load = vi.fn();
      addTextTrack = vi.fn();
      canPlayType = vi.fn();
    },
  });
}

// Mock window.URL.createObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn() });
}

// Mock window.URL.revokeObjectURL
if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn() });
}

// Set up global fetch mock
global.fetch = vi.fn(); 