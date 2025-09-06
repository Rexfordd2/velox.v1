export type CoachingStyle = 'concise' | 'coaching' | 'hype' | 'clinical';

const TEMPLATES: Record<CoachingStyle, Record<string, string[]>> = {
  concise: {
    depth: [
      'Hit full depth on each rep.',
      'Go lower—reach target depth.',
    ],
    speed: [
      'Control the descent; smooth on the way up.',
      'Match the tempo for {beats} beats (~{seconds}s).',
    ],
    stability: [
      'Reduce wobble—brace harder.',
      'Keep bar path vertical and steady.',
    ],
    knee_valgus: [
      'Knees track over toes.',
      'Push knees out; avoid valgus.',
    ],
    hip_shift: [
      'Center the hips; avoid shifting.',
      'Even weight through both feet.',
    ],
  },
  coaching: {
    depth: [
      'Sit into the rep and reach full depth; pause briefly at the bottom.',
      'Aim for consistent depth every rep—own the bottom position.',
    ],
    speed: [
      'Control your eccentric; drive up with intent. Try {beats} beats (~{seconds}s).',
      'Smooth down, powerful up. Ride the beat for {beats} beats.',
    ],
    stability: [
      'Brace the core and lock lats to keep the bar path stable.',
      'Root the feet and keep your torso rigid to reduce wobble.',
    ],
    knee_valgus: [
      'Track knees over mid-foot; spread the floor beneath you.',
      'Press the knees out and keep arches strong.',
    ],
    hip_shift: [
      'Square the hips under the bar; keep the descent centered.',
      'Balance left/right—think even pressure through both legs.',
    ],
  },
  hype: {
    depth: [
      'Own that depth—get low and crush it.',
      'Chase full depth. Every rep. No shortcuts.',
    ],
    speed: [
      'Ride the rhythm: {beats} beats (~{seconds}s). Controlled down, explode up!',
      'Tempo on point—smooth drop, rocket up on beat!',
    ],
    stability: [
      'Lock it in—brace tight, keep that bar laser-straight.',
      'Stay tight, stay steady. Bar path like a ruler.',
    ],
    knee_valgus: [
      'Knees out! Track over toes and stay strong.',
      'Claim your stance—no knee cave.',
    ],
    hip_shift: [
      'Center up—hips square under the bar. Own the line.',
      'Balanced power—no drift left or right.',
    ],
  },
  clinical: {
    depth: [
      'Achieve target depth; maintain consistent bottom position.',
      'Depth below parallel recommended for stimulus consistency.',
    ],
    speed: [
      'Standardize tempo to {beats} beats (~{seconds}s) for force control.',
      'Reduce eccentric variability; maintain constant ascent velocity.',
    ],
    stability: [
      'Minimize lateral deviation; maintain vertical bar path.',
      'Increase intra-abdominal pressure to improve positional stability.',
    ],
    knee_valgus: [
      'Maintain knee abduction moment; align with foot progression angle.',
      'Avoid medial knee displacement during concentric phase.',
    ],
    hip_shift: [
      'Reduce transverse plane pelvic shift; target symmetrical loading.',
      'Monitor frontal plane drift; maintain midline control.',
    ],
  },
};

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function selectTips(style: CoachingStyle, faults: string[], limit = 2): string[] {
  const library = TEMPLATES[style] ?? TEMPLATES.concise;
  const beats = 4;
  const seconds = 4; // default mapping 1 beat ≈ 1s
  const out: string[] = [];
  for (const fault of faults.slice(0, 5)) {
    const options = library[fault];
    if (!options || options.length === 0) continue;
    const variant = options[0];
    out.push(interpolate(variant, { beats, seconds }));
    if (out.length >= limit) break;
  }
  return out;
}


