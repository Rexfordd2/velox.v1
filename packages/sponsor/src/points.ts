export interface PlacementResult {
  position: number; // 1 = win, 2-3 podium, >3 others
  fieldSize?: number;
  verificationLevel?: 'none' | 'community' | 'ai' | 'judge';
}

export interface EngagementMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  watchTimeSec?: number;
}

export interface EventCredit {
  type: 'clinic' | 'meet' | 'livestream' | 'challenge_host' | 'mentorship';
  hours?: number; // optional weighting
}

export interface Sportsmanship {
  reports?: number; // negative events
  commendations?: number; // positive events
}

export interface PointsInput {
  placements?: PlacementResult[];
  verifiedWins?: number; // additional verified wins beyond placements array
  engagement?: EngagementMetrics;
  events?: EventCredit[];
  sportsmanship?: Sportsmanship;
}

export interface PointsBreakdown {
  placementPts: number;
  verifiedBonusPts: number;
  engagementPts: number;
  eventsPts: number;
  sportsmanshipPts: number;
  total: number;
}

// Tunable constants
const BASE_WIN_PTS = 150;
const PODIUM_PTS = [0, 150, 60, 30]; // 1st, 2nd, 3rd
const VERIFIED_MULTIPLIER: Record<NonNullable<PlacementResult['verificationLevel']>, number> = {
  none: 1,
  community: 1.1,
  ai: 1.2,
  judge: 1.4,
};

const ENGAGEMENT_WEIGHTS = {
  view: 0.01,
  like: 0.2,
  comment: 0.6,
  share: 1.0,
  watchTimeSec: 0.02,
};

const EVENT_WEIGHTS: Record<EventCredit['type'], number> = {
  clinic: 20,
  meet: 40,
  livestream: 15,
  challenge_host: 50,
  mentorship: 30,
};

const SPORTSMANSHIP_COMMENDATION = 10;
const SPORTSMANSHIP_REPORT = -25;
const SPORTSMANSHIP_FLOOR = 0; // cannot go negative below floor after clamp

export function computePoints(input: PointsInput): PointsBreakdown {
  const placementPts = (input.placements ?? []).reduce((sum, p) => {
    const pos = Math.max(1, Math.floor(p.position));
    const base = pos <= 3 ? PODIUM_PTS[pos] : Math.max(0, 10 - Math.min(9, pos));
    const ver = VERIFIED_MULTIPLIER[p.verificationLevel ?? 'none'];
    return sum + base * ver;
  }, 0);

  const verifiedBonusPts = Math.max(0, input.verifiedWins ?? 0) * 50;

  const e = input.engagement ?? {};
  const engagementPts =
    (e.views ?? 0) * ENGAGEMENT_WEIGHTS.view +
    (e.likes ?? 0) * ENGAGEMENT_WEIGHTS.like +
    (e.comments ?? 0) * ENGAGEMENT_WEIGHTS.comment +
    (e.shares ?? 0) * ENGAGEMENT_WEIGHTS.share +
    (e.watchTimeSec ?? 0) * ENGAGEMENT_WEIGHTS.watchTimeSec;

  const eventsPts = (input.events ?? []).reduce((sum, ev) => {
    const w = EVENT_WEIGHTS[ev.type];
    const hours = ev.hours ?? 1;
    return sum + w * Math.max(0.25, Math.min(hours, 8));
  }, 0);

  const s = input.sportsmanship ?? {};
  const sportsmanshipRaw =
    (s.commendations ?? 0) * SPORTSMANSHIP_COMMENDATION +
    (s.reports ?? 0) * SPORTSMANSHIP_REPORT;
  const sportsmanshipPts = Math.max(SPORTSMANSHIP_FLOOR, sportsmanshipRaw);

  const total = Math.round(
    placementPts + verifiedBonusPts + engagementPts + eventsPts + sportsmanshipPts
  );

  return {
    placementPts: Math.round(placementPts),
    verifiedBonusPts,
    engagementPts: Math.round(engagementPts),
    eventsPts: Math.round(eventsPts),
    sportsmanshipPts,
    total,
  };
}

export interface RevenueSplitConfig {
  baseCreatorPct?: number; // default 70%
  basePlatformPct?: number; // default 30%
  loyaltyBumpPct?: number; // extra 5% to creator at T3
}

export function computeRevenueSplit(
  monthlyRevenueUsd: number,
  tier: number,
  cfg: RevenueSplitConfig = {}
): { creatorUsd: number; platformUsd: number; creatorPct: number; platformPct: number } {
  const baseCreatorPct = cfg.baseCreatorPct ?? 0.7;
  const basePlatformPct = cfg.basePlatformPct ?? 0.3;
  const loyaltyBumpPct = cfg.loyaltyBumpPct ?? 0.05;

  const creatorPct = tier >= 3 ? baseCreatorPct + loyaltyBumpPct : baseCreatorPct;
  const platformPct = Math.max(0, 1 - creatorPct);

  const creatorUsd = Math.round(monthlyRevenueUsd * creatorPct * 100) / 100;
  const platformUsd = Math.round(monthlyRevenueUsd * platformPct * 100) / 100;

  return { creatorUsd, platformUsd, creatorPct, platformPct };
}


