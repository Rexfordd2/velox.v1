import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('converts to lowercase and replaces spaces', () => {
    expect(generateSlug('Push Ups')).toBe('push-ups');
  });
  it('removes special characters', () => {
    expect(generateSlug('Bench Press!')).toBe('bench-press');
  });
  it('trims hyphens', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });
  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });
}); 