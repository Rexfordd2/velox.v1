import { describe, it, expect } from 'vitest';
import { evaluateByls, enforceCalloutQuotas } from '../src/rules';

describe('BYLS improvement detection', () => {
  it('detects improvement when higher is better', () => {
    const res = evaluateByls({
      previous: 0.5,
      current: 0.6,
      metric: 'meanConVel',
      massKg: 100,
      prevMassKg: 100,
      setup: { stance: 'medium' },
      prevSetup: { stance: 'medium' },
      integrityScore: 0.9,
      formScore: 0.8,
      fps: 60,
    });
    expect(res.ok).toBe(true);
    expect(res.improved).toBe(true);
  });

  it('detects improvement when lower is better (velLossPct)', () => {
    const res = evaluateByls({
      previous: 25,
      current: 20,
      metric: 'velLossPct',
      massKg: 80,
      prevMassKg: 80,
      integrityScore: 0.95,
      formScore: 0.7,
      fps: 30,
    });
    expect(res.ok).toBe(true);
    expect(res.improved).toBe(true);
  });

  it('fails fairness if load or setup changed', () => {
    const res = evaluateByls({
      previous: 0.5,
      current: 0.6,
      metric: 'meanConVel',
      massKg: 102,
      prevMassKg: 100,
      setup: { grip: 'wide' },
      prevSetup: { grip: 'narrow' },
      integrityScore: 0.9,
      formScore: 0.9,
      fps: 60,
    });
    expect(res.ok).toBe(false);
    expect(res.reasons).toContain('load_changed');
    expect(res.reasons).toContain('setup_grip_changed');
  });
});

describe('Call-out quotas', () => {
  it('enforces daily cap and accept rate', () => {
    const res = enforceCalloutQuotas({
      userId: 'u1',
      periodCalls: 5,
      periodAccepted: 1,
      periodRejected: 4,
      maxCallsPerDay: 5,
      minAcceptRate: 0.4,
      maxRejects: 3,
    });
    expect(res.allowed).toBe(false);
    expect(res.reasons).toContain('quota_exceeded');
    expect(res.reasons).toContain('low_accept_rate');
    expect(res.reasons).toContain('too_many_rejections');
  });

  it('allows when within quotas', () => {
    const res = enforceCalloutQuotas({
      userId: 'u1',
      periodCalls: 2,
      periodAccepted: 1,
      periodRejected: 0,
    });
    expect(res.allowed).toBe(true);
    expect(res.reasons.length).toBe(0);
  });
});


