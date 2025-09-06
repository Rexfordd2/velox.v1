import { describe, it, expect } from 'vitest';
import { evaluateTier, SponsorTier, TIER_RULES } from '../src/tiers';

describe('Sponsor tiers', () => {
  it('starts at Tier 0 with no activity', () => {
    const res = evaluateTier({
      windowDays: 30,
      avgFormQualityPct: 0,
      totalPoints: 0,
      verifiedWins: 0,
      top3Placements: 0,
    });
    expect(res.tier).toBe(SponsorTier.T0);
  });

  it('reaches Tier 1 with adequate form, points and one win', () => {
    const res = evaluateTier({
      windowDays: 30,
      avgFormQualityPct: 78,
      totalPoints: 350,
      verifiedWins: 1,
      top3Placements: 0,
    });
    expect(res.tier).toBe(SponsorTier.T1);
  });

  it('Tier 2 requires stronger sustained metrics', () => {
    const res = evaluateTier({
      windowDays: 60,
      avgFormQualityPct: 86,
      totalPoints: 1100,
      verifiedWins: 3,
      top3Placements: 12,
      sportsmanshipPct: 90,
    });
    expect(res.tier).toBe(SponsorTier.T2);
  });

  it('Tier 3 requires high form, many wins/placements and sportsmanship', () => {
    const res = evaluateTier({
      windowDays: 90,
      avgFormQualityPct: 92,
      totalPoints: 3200,
      verifiedWins: 8,
      top3Placements: 30,
      sportsmanshipPct: 85,
    });
    expect(res.tier).toBe(SponsorTier.T3);
  });
});


