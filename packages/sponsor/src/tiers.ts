export enum SponsorTier {
  T0 = 0,
  T1 = 1,
  T2 = 2,
  T3 = 3,
}

export interface TierEvaluationInput {
  // Rolling window aggregation for the evaluation period
  windowDays: number;
  avgFormQualityPct: number; // 0-100
  totalPoints: number; // computed via points engine
  verifiedWins: number; // count within window
  top3Placements: number; // count within window (excluding wins)
  sportsmanshipPct?: number; // 0-100, optional
}

export interface TierRule {
  tier: SponsorTier;
  windowDays: number;
  minFormQualityPct: number;
  minPoints: number;
  minVerifiedWins?: number;
  minTop3Placements?: number;
  minSportsmanshipPct?: number;
}

// ASSUMPTIONS: No spec file exists in the repo. The following rules are
// conservative and easy to tune. They encode thresholds, minimum form quality,
// and rolling windows for each tier.
export const TIER_RULES: TierRule[] = [
  {
    tier: SponsorTier.T0,
    windowDays: 30,
    minFormQualityPct: 0,
    minPoints: 0,
  },
  {
    tier: SponsorTier.T1,
    windowDays: 30,
    minFormQualityPct: 75,
    minPoints: 300,
    minVerifiedWins: 1,
    // or 3 top3 finishes can substitute a win
    minTop3Placements: 3,
  },
  {
    tier: SponsorTier.T2,
    windowDays: 60,
    minFormQualityPct: 85,
    minPoints: 1000,
    minVerifiedWins: 3,
    minTop3Placements: 10,
  },
  {
    tier: SponsorTier.T3,
    windowDays: 90,
    minFormQualityPct: 90,
    minPoints: 3000,
    minVerifiedWins: 8,
    minTop3Placements: 25,
    minSportsmanshipPct: 80,
  },
];

export interface TierEvaluationResult {
  tier: SponsorTier;
  // Progress (0-1) towards the NEXT tier on each axis
  progress: {
    form: number;
    points: number;
    verified: number;
    placements: number;
    sportsmanship: number;
    overall: number; // harmonic mean of available axes
  };
  nextTarget?: TierRule; // undefined if at top tier
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function harmonicMean(values: number[]): number {
  const filtered = values.filter((v) => Number.isFinite(v) && v > 0);
  if (filtered.length === 0) return 0;
  const denom = filtered.reduce((s, v) => s + 1 / v, 0);
  return filtered.length / denom;
}

export function evaluateTier(input: TierEvaluationInput): TierEvaluationResult {
  // Find the highest tier whose requirements are satisfied.
  let achieved: SponsorTier = SponsorTier.T0;
  for (const rule of TIER_RULES) {
    if (!meetsRule(input, rule)) break;
    achieved = rule.tier;
  }

  const nextIndex = Math.min(
    TIER_RULES.findIndex((r) => r.tier === achieved) + 1,
    TIER_RULES.length - 1
  );
  const nextTarget = achieved === SponsorTier.T3 ? undefined : TIER_RULES[nextIndex];

  const progress = computeProgress(input, nextTarget);

  return { tier: achieved, progress, nextTarget };
}

function meetsRule(input: TierEvaluationInput, rule: TierRule): boolean {
  if (input.windowDays < rule.windowDays) return false;
  if (input.avgFormQualityPct < rule.minFormQualityPct) return false;
  if (input.totalPoints < rule.minPoints) return false;

  // Verified wins or placements can satisfy the competitive requirement
  const hasWins = (input.verifiedWins ?? 0) >= (rule.minVerifiedWins ?? 0);
  const hasPlacements =
    (input.top3Placements ?? 0) >= (rule.minTop3Placements ?? 0);
  if ((rule.minVerifiedWins || rule.minTop3Placements) && !(hasWins || hasPlacements)) {
    return false;
  }

  if (
    rule.minSportsmanshipPct !== undefined &&
    (input.sportsmanshipPct ?? 0) < rule.minSportsmanshipPct
  ) {
    return false;
  }

  return true;
}

function computeProgress(
  input: TierEvaluationInput,
  nextTarget?: TierRule
): TierEvaluationResult['progress'] {
  if (!nextTarget) {
    return {
      form: 1,
      points: 1,
      verified: 1,
      placements: 1,
      sportsmanship: 1,
      overall: 1,
    };
  }

  const form = clamp01(input.avgFormQualityPct / nextTarget.minFormQualityPct);
  const points = clamp01(input.totalPoints / nextTarget.minPoints);
  const verified = clamp01(
    nextTarget.minVerifiedWins ? (input.verifiedWins ?? 0) / nextTarget.minVerifiedWins : 1
  );
  const placements = clamp01(
    nextTarget.minTop3Placements ? (input.top3Placements ?? 0) / nextTarget.minTop3Placements : 1
  );
  const sportsmanship = clamp01(
    nextTarget.minSportsmanshipPct
      ? (input.sportsmanshipPct ?? 0) / nextTarget.minSportsmanshipPct
      : 1
  );

  const overall = harmonicMean([form, points, verified, placements, sportsmanship]);

  return { form, points, verified, placements, sportsmanship, overall };
}

export function tierLabel(tier: SponsorTier): string {
  switch (tier) {
    case SponsorTier.T3:
      return 'Tier 3';
    case SponsorTier.T2:
      return 'Tier 2';
    case SponsorTier.T1:
      return 'Tier 1';
    default:
      return 'Tier 0';
  }
}


