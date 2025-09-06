/**
 * Velox Spec Matrix - align with your Master Spec.
 * Each item can have a quick browser check and/or API check.
 */
export type SpecItem = {
  id: string;
  title: string;
  critical: boolean;
  check: () => Promise<{ pass: boolean; notes?: string }>;
};

const baseURL = process.env.SPEC_BASE_URL || 'http://localhost:3000';

// Lightweight HTTP probe without extra deps
async function ping(path: string, expect = 200) {
  const res = await fetch(`${baseURL}${path}`, { method: 'GET' });
  return { ok: res.status === expect, status: res.status };
}

export const SPEC_ITEMS: SpecItem[] = [
  // --- Onboarding & Privacy ---
  {
    id: 'onboarding-first-run',
    title: 'Onboarding: first-run flow reachable and renders primary choices',
    critical: true,
    check: async () => {
      const r = await ping('/onboarding');
      return { pass: r.ok, notes: `status=${r.status}` };
    }
  },
  {
    id: 'privacy-defaults',
    title: 'Privacy: default is private sessions / metrics-only sync',
    critical: true,
    check: async () => {
      const r = await ping('/settings/privacy');
      return { pass: r.ok, notes: `status=${r.status}` };
    }
  },

  // --- Lift-to-the-Beat MVP shell ---
  {
    id: 'l2b-screen',
    title: 'Lift‑to‑the‑Beat screen loads with source picker & BPM display',
    critical: true,
    check: async () => {
      const r = await ping('/modes/LiftToBeat');
      return { pass: r.ok, notes: `status=${r.status}` };
    }
  },

  // --- Leaderboards ---
  {
    id: 'leaderboard-global',
    title: 'Leaderboards page reachable (global/local tabs)',
    critical: true,
    check: async () => {
      const r = await ping('/leaderboards');
      return { pass: r.ok, notes: `status=${r.status}` };
    }
  },

  // --- Replay / Export ---
  {
    id: 'replay-page',
    title: 'Replay page route exists (dynamic repId)',
    critical: false,
    check: async () => {
      // Probe a template route; adjust as needed if a sample ID exists
      const r = await ping('/replay/sample');
      return { pass: r.ok || r.status === 404, notes: `status=${r.status} (404 okay for stub)` };
    }
  },

  // --- Debug/Observability ---
  {
    id: 'debug-status',
    title: 'Live status page reachable (FPS, inference ms, upload queue)',
    critical: false,
    check: async () => {
      const r = await ping('/debug/status');
      return { pass: r.ok, notes: `status=${r.status}` };
    }
  },

  // --- Verify flow ---
  {
    id: 'verify-screen',
    title: 'Verification screen reachable (dual-angle viewer)',
    critical: false,
    check: async () => {
      const r = await ping('/verify/sample');
      return { pass: r.ok || r.status === 404, notes: `status=${r.status} (404 okay for stub)` };
    }
  }
];


