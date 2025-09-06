// Local Savitzky–Golay smoothing implementation (symmetric window)
// Fits a local polynomial of given order within a moving window and evaluates at the center
function savitzkyGolaySmooth(values: number[], windowSize: number, polyOrder: number): number[] {
  const n = values.length;
  if (n === 0) return [];
  const half = Math.floor(windowSize / 2);
  const order = Math.min(polyOrder, windowSize - 1);
  const smoothed = new Array<number>(n);

  // Helper: solve linear system A x = b via Gaussian elimination (small systems only)
  function solveLinearSystem(A: number[][], b: number[]): number[] {
    const m = A.length;
    const ncols = A[0].length;
    // Augment
    const M = A.map((row, i) => [...row, b[i]]);
    // Forward elimination
    for (let col = 0, row = 0; col < ncols && row < m; col++, row++) {
      // Find pivot
      let pivot = row;
      for (let r = row + 1; r < m; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
      }
      if (Math.abs(M[pivot][col]) < 1e-12) continue;
      // Swap
      if (pivot !== row) {
        const tmp = M[row];
        M[row] = M[pivot];
        M[pivot] = tmp;
      }
      // Normalize
      const div = M[row][col];
      for (let c = col; c <= ncols; c++) M[row][c] /= div;
      // Eliminate below
      for (let r = row + 1; r < m; r++) {
        const factor = M[r][col];
        if (factor === 0) continue;
        for (let c = col; c <= ncols; c++) M[r][c] -= factor * M[row][c];
      }
    }
    // Back substitution
    const x = new Array<number>(ncols).fill(0);
    for (let r = m - 1; r >= 0; r--) {
      // Find first non-zero column
      let lead = -1;
      for (let c = 0; c < ncols; c++) {
        if (Math.abs(M[r][c]) > 1e-12) { lead = c; break; }
      }
      if (lead === -1) continue;
      let sum = M[r][ncols];
      for (let c = lead + 1; c < ncols; c++) sum -= M[r][c] * x[c];
      x[lead] = sum / M[r][lead];
    }
    return x;
  }

  for (let i = 0; i < n; i++) {
    const left = Math.max(0, i - half);
    const right = Math.min(n - 1, i + half);
    const xs: number[] = [];
    const ys: number[] = [];
    for (let j = left; j <= right; j++) {
      xs.push(j - i); // center at 0
      ys.push(values[j]);
    }
    const m = xs.length;
    const p = order + 1; // number of coefficients
    // Build Vandermonde and normal equations
    const V: number[][] = new Array(m);
    for (let r = 0; r < m; r++) {
      V[r] = new Array(p);
      let xpow = 1;
      for (let c = 0; c < p; c++) { V[r][c] = xpow; xpow *= xs[r]; }
    }
    // Compute A = V^T V, b = V^T y
    const A: number[][] = Array.from({ length: p }, () => new Array<number>(p).fill(0));
    const b: number[] = new Array(p).fill(0);
    for (let r = 0; r < m; r++) {
      for (let c1 = 0; c1 < p; c1++) {
        b[c1] += V[r][c1] * ys[r];
        for (let c2 = 0; c2 < p; c2++) A[c1][c2] += V[r][c1] * V[r][c2];
      }
    }
    const coeffs = solveLinearSystem(A, b);
    smoothed[i] = coeffs[0]; // value at x=0
  }
  return smoothed;
}

// Calibration state for pixel -> meter conversion
let pixelsPerMeterGlobal: number | null = null;
let homographyGlobal: number[] | null = null; // 3x3 row-major
let tiltDegGlobal: number | null = null;

/**
 * Configure pixel-to-meter calibration for velocity conversion.
 * If both scale and homography are provided, homography takes precedence
 * for planar distance computations, while scale is used as fallback.
 */
export function setPixelScale(scalePixelsPerMeter: number, homography?: number[], tiltDeg?: number): void {
  pixelsPerMeterGlobal = Number.isFinite(scalePixelsPerMeter) && scalePixelsPerMeter > 0
    ? scalePixelsPerMeter
    : null;
  homographyGlobal = Array.isArray(homography) && homography.length === 9 ? [...homography] : null;
  tiltDegGlobal = typeof tiltDeg === 'number' ? tiltDeg : null;
}

/**
 * Convert a pixel displacement (in px) to meters using current calibration.
 * When homography is present, callers should prefer projecting two pixel points
 * on the plane and measuring their Euclidean distance in meters. This helper
 * handles the simple scale-only case.
 */
export function pixelsToMeters(pixelDisplacement: number): number {
  if (!pixelsPerMeterGlobal || !Number.isFinite(pixelDisplacement)) return 0;
  return pixelDisplacement / pixelsPerMeterGlobal;
}

interface VelocityMetric {
  repIdx: number;
  peak: number;
  mean: number;
  displacement: number;
  v_raw?: number[];
  v_smooth?: number[];
}

interface VelocityConfig {
  smoothing: boolean;
  alpha: number;
}

const DEFAULT_CONFIG: VelocityConfig = {
  smoothing: true,
  alpha: 0.2
};

/**
 * Apply exponential moving average smoothing to a series of values
 * @param values Array of values to smooth
 * @param alpha Smoothing factor (0-1), lower = more smoothing
 * @returns Smoothed values
 */
function applyEMA(values: number[], alpha: number): number[] {
  if (values.length === 0) return [];
  
  const smoothed = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }
  return smoothed;
}

// Enhanced validation and confidence scoring are implemented below in analyzeVelocity

/**
 * Calculate velocity metrics for a series of vertical positions
 * @param ySeries Vertical positions in meters per frame
 * @param fps Frames per second
 * @param config Optional configuration for velocity calculation
 * @returns Array of velocity metrics per rep
 */
export function calcVelocity(
  ySeries: number[],
  fps: number,
  config: Partial<VelocityConfig> = {}
): VelocityMetric[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (ySeries.length < 2) {
    return [];
  }

  // Apply Savitzky-Golay filter to smooth the position data
  const smoothedY = savitzkyGolaySmooth(ySeries, 5, 2); // 5-point window, 2nd order

  // Calculate raw velocities by differentiating position
  const rawVelocities: number[] = [];
  for (let i = 1; i < smoothedY.length; i++) {
    const dt = 1 / fps;
    const dy = smoothedY[i] - smoothedY[i - 1];
    rawVelocities.push(dy / dt);
  }

  // Apply EMA smoothing if enabled
  const velocities = finalConfig.smoothing 
    ? applyEMA(rawVelocities, finalConfig.alpha)
    : rawVelocities;

  // Detect rep boundaries via zero-crossings
  const repBoundaries: number[] = [0]; // Start with first frame
  for (let i = 1; i < velocities.length; i++) {
    if (velocities[i - 1] < 0 && velocities[i] >= 0) {
      repBoundaries.push(i);
    }
  }
  // Add last frame as final boundary if not already included
  if (repBoundaries[repBoundaries.length - 1] !== velocities.length - 1) {
    repBoundaries.push(velocities.length - 1);
  }

  // Calculate metrics for each rep
  const metrics: VelocityMetric[] = [];
  for (let i = 0; i < repBoundaries.length - 1; i++) {
    const start = repBoundaries[i];
    const end = repBoundaries[i + 1];
    const repVelocities = velocities.slice(start, end);
    const repRawVelocities = rawVelocities.slice(start, end);
    
    if (repVelocities.length === 0) continue;
    
    // Calculate peak velocity (absolute max)
    const peak = Math.max(...repVelocities.map(Math.abs));
    
    // Calculate mean velocity
    const mean = repVelocities.reduce((sum, v) => sum + Math.abs(v), 0) / repVelocities.length;
    
    // Calculate total displacement
    const displacement = Math.abs(smoothedY[end] - smoothedY[start]);

    metrics.push({
      repIdx: i,
      peak,
      mean,
      displacement,
      v_raw: repRawVelocities,
      v_smooth: repVelocities
    });
  }

  return metrics;
} 

// ------------------ Enhanced velocity analysis with validation ------------------

export type VelocitySample = { t: number; v: number; src: 'pose' | 'interp' };
export type VelocityStats = {
  series: VelocitySample[];
  mean: number; std: number; mad: number;
  outliers: { index: number; reason: 'Hampel' | 'IQR' | 'Jump' }[];
  confidence: number; // 0-1
  latencyMs: number;
  windowMs: number;
};

type RawPoint = { t: number; x: number; y: number; score?: number };
type AnalyzeOpts = { pixelsPerMeter?: number; homography?: number[]; tiltDeg?: number; dt?: number };

function quantiles(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

function computeStats(values: number[]): { mean: number; std: number; mad: number } {
  if (values.length === 0) return { mean: 0, std: 0, mad: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / Math.max(1, values.length - 1);
  const std = Math.sqrt(Math.max(0, variance));
  const med = values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const absDev = values.map(v => Math.abs(v - med)).sort((a, b) => a - b);
  const mad = absDev[Math.floor(absDev.length / 2)] || 0;
  return { mean, std, mad };
}

function resampleToGrid(points: RawPoint[], dt: number): { t: number; y: number; src: 'pose' | 'interp'; score: number | undefined; isMissing: boolean }[] {
  if (points.length === 0) return [];
  const sorted = points.slice().sort((a, b) => a.t - b.t);
  const t0 = sorted[0].t;
  const tN = sorted[sorted.length - 1].t;
  const grid: { t: number; y: number; src: 'pose' | 'interp'; score: number | undefined; isMissing: boolean }[] = [];
  let j = 0;
  const maxSnap = dt * 0.25;
  for (let t = t0; t <= tN + 1e-9; t += dt) {
    // Find surrounding raw points
    while (j < sorted.length - 1 && sorted[j + 1].t < t) j++;
    const p0 = sorted[j];
    const p1 = sorted[Math.min(sorted.length - 1, j + 1)];
    if (Math.abs(p0.t - t) <= maxSnap) {
      grid.push({ t, y: p0.y, src: 'pose', score: p0.score, isMissing: false });
      continue;
    }
    if (p1.t >= t && p0.t <= t && p1.t !== p0.t) {
      const r = (t - p0.t) / (p1.t - p0.t);
      const y = p0.y + r * (p1.y - p0.y);
      const score = p0.score !== undefined && p1.score !== undefined ? p0.score * (1 - r) + p1.score * r : (p0.score ?? p1.score);
      // Mark missing if gap is large (>1.5 dt)
      const isMissing = (p1.t - p0.t) > dt * 1.5;
      grid.push({ t, y, src: 'interp', score, isMissing });
    } else {
      // Extrapolate flatly if outside bounds
      const srcPoint = p1.t < t ? p1 : p0;
      grid.push({ t, y: srcPoint.y, src: 'interp', score: srcPoint.score, isMissing: true });
    }
  }
  return grid;
}

function differentiate(values: number[], dt: number): number[] {
  const n = values.length;
  if (n === 0) return [];
  const v = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) v[i] = (values[i] - values[i - 1]) / dt;
  v[0] = v[1] || 0;
  return v;
}

function detectOutliers(vel: number[], k: number, t: number): { hampel: Set<number>; iqr: Set<number>; jump: Set<number> } {
  const n = vel.length;
  const hampel = new Set<number>();
  const iqr = new Set<number>();
  const jump = new Set<number>();

  // Hampel filter
  for (let i = 0; i < n; i++) {
    const left = Math.max(0, i - k);
    const right = Math.min(n - 1, i + k);
    const window = vel.slice(left, right + 1);
    const sorted = window.slice().sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    const absDev = window.map(v => Math.abs(v - med)).sort((a, b) => a - b);
    const mad = absDev[Math.floor(absDev.length / 2)] || 0;
    const sigma = 1.4826 * mad;
    if (sigma > 0 && Math.abs(vel[i] - med) > t * sigma) hampel.add(i);
  }

  // IQR fence over entire segment
  const sortedAll = vel.slice().sort((a, b) => a - b);
  const q1 = quantiles(sortedAll, 0.25);
  const q3 = quantiles(sortedAll, 0.75);
  const iqrVal = q3 - q1;
  const lowFence = q1 - 1.5 * iqrVal;
  const highFence = q3 + 1.5 * iqrVal;
  for (let i = 0; i < n; i++) {
    if (vel[i] < lowFence || vel[i] > highFence) iqr.add(i);
  }

  // Sudden jump: > 4σ change in <2 frames
  const stats = computeStats(vel);
  const thresh = 4 * (stats.std || 0);
  for (let i = 1; i < n; i++) {
    if (Math.abs(vel[i] - vel[i - 1]) > thresh) { jump.add(i); jump.add(i - 1); }
  }
  return { hampel, iqr, jump };
}

function cubicRepair(values: number[], badIdx: Set<number>): number[] {
  const n = values.length;
  const repaired = values.slice();
  const goodIndices: number[] = [];
  for (let i = 0; i < n; i++) if (!badIdx.has(i)) goodIndices.push(i);
  // If insufficient good points, return as is
  if (goodIndices.length < 4) return repaired;
  // Piecewise cubic via local 4-point interpolation
  function interpAt(i: number): number {
    // choose 4 nearest good points around i
    let candidates = goodIndices.slice().sort((a, b) => Math.abs(a - i) - Math.abs(b - i)).slice(0, 4).sort((a, b) => a - b);
    const xs = candidates.map(idx => idx);
    const ys = candidates.map(idx => values[idx]);
    // Lagrange interpolation at x=i
    let yi = 0;
    for (let j = 0; j < xs.length; j++) {
      let lj = 1;
      for (let m = 0; m < xs.length; m++) {
        if (m === j) continue;
        lj *= (i - xs[m]) / (xs[j] - xs[m] + 1e-12);
      }
      yi += ys[j] * lj;
    }
    return yi;
  }
  for (let i = 0; i < n; i++) {
    if (badIdx.has(i)) repaired[i] = interpAt(i);
  }
  return repaired;
}

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

export function analyzeVelocity(
  rawPoints: RawPoint[],
  opts: AnalyzeOpts = {}
): VelocityStats {
  const dt = opts.dt && opts.dt > 0 ? opts.dt : 1 / 60;
  const window = 9; // frames
  const order = 3;
  const half = Math.floor(window / 2);

  // Calibration setup (simple scale only for now)
  if (typeof opts.pixelsPerMeter === 'number') {
    setPixelScale(opts.pixelsPerMeter, opts.homography, opts.tiltDeg);
  }

  // 1) Interpolate to fixed dt
  const grid = resampleToGrid(rawPoints, dt);
  const yMeters = grid.map(g => pixelsPerMeterGlobal ? g.y / (pixelsPerMeterGlobal || 1) : g.y);
  const poseMask = grid.map(g => g.src === 'pose');
  const missingMask = grid.map(g => g.isMissing);

  // 2) Savitzky–Golay smoothing on positions
  const ySmooth = savitzkyGolaySmooth(yMeters, window, order);

  // 3) Outlier detection on velocity
  const vRaw = differentiate(ySmooth, dt);
  const { hampel, iqr, jump } = detectOutliers(vRaw, 3, 2.0);
  const outliers: { index: number; reason: 'Hampel' | 'IQR' | 'Jump' }[] = [];
  hampel.forEach(i => outliers.push({ index: i, reason: 'Hampel' }));
  iqr.forEach(i => outliers.push({ index: i, reason: 'IQR' }));
  jump.forEach(i => outliers.push({ index: i, reason: 'Jump' }));

  // 4) Repair outliers via cubic interpolation
  const badIdx = new Set<number>([...hampel, ...iqr, ...jump]);
  const vRepaired = cubicRepair(vRaw, badIdx);

  // 5) Confidence
  const total = grid.length;
  const outlierRate = badIdx.size / Math.max(1, total);
  const missingRate = missingMask.filter(Boolean).length / Math.max(1, total);
  const meanScore = grid.reduce((acc, g) => acc + (g.score ?? 1), 0) / Math.max(1, total);
  const lowScorePenalty = clamp01(1 - meanScore); // score in [0,1]
  const calibPenalty = 0; // unknown calibration age in provided API
  let penalty = 0.5 * outlierRate + 0.8 * missingRate + 0.1 * lowScorePenalty + 0.05 * calibPenalty;
  if (missingRate > 0.25) penalty += 0.2; // stronger penalty for many gaps
  let confidence = clamp01(1 - penalty);

  // 6) Error bounds (std-based)
  const stats = computeStats(vRepaired);

  // Series assembly
  const latencyMs = half * dt * 1000;
  const windowMs = window * dt * 1000;
  const series: VelocitySample[] = vRepaired.map((v, i) => ({ t: grid[i].t, v, src: poseMask[i] && !badIdx.has(i) ? 'pose' : 'interp' }));

  return {
    series,
    mean: stats.mean,
    std: stats.std,
    mad: stats.mad,
    outliers,
    confidence,
    latencyMs,
    windowMs
  };
}