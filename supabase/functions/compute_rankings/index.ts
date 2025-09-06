// Deno Deploy / Supabase Edge Function
// Name: compute_rankings
// Description: Selects best eligible rep per user per exercise in rolling windows and upserts into leaderboards.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Json = Record<string, unknown> | null;

type RepRow = {
  id: string;
  set_id: string;
  start_ts: string | null;
  power_w: number | null;
  flow_score: number | null;
  integrity_score: number | null;
  eligible: boolean | null;
};

type SetRow = {
  id: string;
  workout_id: string;
  exercise: string;
  strictness: string | null;
  verified: boolean | null;
};

type WorkoutRow = {
  id: string;
  user_id: string;
  started_at: string | null;
};

type ProfileRow = {
  id: string;
  body_weight_kg: number | null;
  experience: string | null;
  dob: string | null;
  region: string | null;
};

type LeaderboardRow = {
  exercise: string;
  bucket: Json;
  score: number;
  user_id: string;
  rep_id: string | null;
  verified: boolean;
};

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ageFromDob(dob: string | null): number | null {
  const d = toDate(dob);
  if (!d) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

function assignBuckets(profile: ProfileRow) {
  // Mirror canonical buckets in code to assign on server
  const ageYears = ageFromDob(profile.dob);
  const age = (() => {
    if (ageYears == null) return undefined;
    if (ageYears < 18) return '13-17';
    if (ageYears <= 24) return '18-24';
    if (ageYears <= 34) return '25-34';
    if (ageYears <= 44) return '35-44';
    if (ageYears <= 54) return '45-54';
    if (ageYears <= 64) return '55-64';
    return '65+';
  })();

  const body = (() => {
    const kg = profile.body_weight_kg ?? NaN;
    if (!Number.isFinite(kg)) return undefined;
    if (kg < 60) return 'Under 60';
    if (kg < 70) return '60-69.9';
    if (kg < 80) return '70-79.9';
    if (kg < 90) return '80-89.9';
    if (kg < 100) return '90-99.9';
    if (kg < 110) return '100-109.9';
    if (kg < 125) return '110-124.9';
    return '125+';
  })();

  const experience = (profile.experience ?? 'novice').toLowerCase();

  return { age, bodyWeightKg: body, experience };
}

function withinWindow(startedAt: string | null, days: number): boolean {
  const d = toDate(startedAt);
  if (!d) return false;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

// Choose score metric: prioritize flow_score, else power_w
function computeRepScore(rep: RepRow): number {
  if (rep.flow_score != null && Number.isFinite(rep.flow_score)) return rep.flow_score as number;
  if (rep.power_w != null && Number.isFinite(rep.power_w)) return rep.power_w as number;
  return -Infinity;
}

export async function handleComputeRankings(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const qWindow = url.searchParams.get('window');
  const windows = qWindow ? [qWindow] : ['7d', '30d', '365d'];

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Fetch eligible reps with joins needed to assign user, exercise and verification
  const { data: repsData, error: repsError } = await supabase
    .from('reps')
    .select(`
      id, set_id, start_ts, power_w, flow_score, integrity_score, eligible,
      sets!inner(id, workout_id, exercise, strictness, verified),
      sets:sets!inner(workouts!inner(id, user_id, started_at))
    ` as any)
    .is('eligible', true);

  if (repsError) {
    return new Response(JSON.stringify({ error: repsError.message }), { status: 500 });
  }

  // Build a map user->exercise->best rep per window
  type Joined = {
    rep: RepRow;
    set: SetRow;
    workout: WorkoutRow;
  };

  const joined: Joined[] = (repsData as any[]).map((r: any) => ({
    rep: {
      id: r.id,
      set_id: r.set_id,
      start_ts: r.start_ts,
      power_w: r.power_w,
      flow_score: r.flow_score,
      integrity_score: r.integrity_score,
      eligible: r.eligible,
    },
    set: {
      id: r.sets.id,
      workout_id: r.sets.workout_id,
      exercise: r.sets.exercise,
      strictness: r.sets.strictness,
      verified: r.sets.verified,
    },
    workout: {
      id: r.sets.workouts.id,
      user_id: r.sets.workouts.user_id,
      started_at: r.sets.workouts.started_at,
    },
  }));

  // Group selections by window
  for (const win of windows) {
    const days = win === '7d' ? 7 : win === '30d' ? 30 : 365;
    const best: Map<string, Joined> = new Map(); // key: `${user_id}|${exercise}`

    for (const j of joined) {
      if (!withinWindow(j.workout.started_at, days)) continue;
      const key = `${j.workout.user_id}|${j.set.exercise}`;
      const current = best.get(key);
      if (!current || computeRepScore(j.rep) > computeRepScore(current.rep)) {
        best.set(key, j);
      }
    }

    // Fetch profiles for involved users
    const userIds = Array.from(new Set(Array.from(best.values()).map(v => v.workout.user_id)));
    if (userIds.length === 0) continue;

    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, body_weight_kg, experience, dob, region')
      .in('id', userIds);

    if (profErr) {
      return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
    }

    const profById = new Map((profiles ?? []).map(p => [p.id, p as ProfileRow]));

    // Upsert leaderboards
    for (const [key, j] of best.entries()) {
      const profile = profById.get(j.workout.user_id) as ProfileRow | undefined;
      const bucket = profile ? assignBuckets(profile) : {};

      const verified = Boolean(j.set.verified) && Boolean(j.rep.eligible);
      const score = computeRepScore(j.rep);
      if (!Number.isFinite(score)) continue;

      const lb: LeaderboardRow = {
        exercise: j.set.exercise,
        bucket: { ...bucket, window: win } as Json,
        score,
        user_id: j.workout.user_id,
        rep_id: j.rep.id,
        verified,
      };

      const { error: upsertErr } = await supabase.from('leaderboards').upsert(
        {
          exercise: lb.exercise,
          bucket: lb.bucket,
          score: lb.score,
          user_id: lb.user_id,
          rep_id: lb.rep_id,
          verified: lb.verified,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'exercise, user_id, rep_id, created_at' } as any
      );

      if (upsertErr) {
        // Log and continue
        console.warn('Upsert error', upsertErr.message);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}

// Standard Edge Function export
export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    return await handleComputeRankings(req);
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
}


