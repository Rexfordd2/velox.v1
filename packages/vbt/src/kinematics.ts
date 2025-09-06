/**
 * Savitzky-Golay smoothing for 1D time series with symmetric window.
 * Simple implementation using convolution with precomputed coefficients.
 * Supports odd window sizes; falls back to no-op for too-short series.
 */
export function sGolaySmooth(series: number[], window = 9, poly = 3): number[] {
  const n = series.length;
  if (!Array.isArray(series) || n === 0) return [];
  if (window % 2 === 0) window += 1; // enforce odd window
  if (window < 3 || poly < 1) return series.slice();
  if (n < window) return series.slice();

  // Precompute coefficients via least squares for central point.
  const half = Math.floor(window / 2);
  const x: number[] = [];
  for (let i = -half; i <= half; i++) x.push(i);

  // Build Vandermonde matrix A (window x (poly+1)) and compute central filter weights w
  const m = window;
  const p = poly + 1;
  const A: number[][] = Array.from({ length: m }, () => Array(p).fill(0));
  for (let r = 0; r < m; r++) {
    let val = 1;
    for (let c = 0; c < p; c++) {
      A[r][c] = val;
      val *= x[r];
    }
  }

  // Compute weights solving normal equations for the central sample: w = e0^T (A^T A)^{-1} A^T
  // We compute w^T = e0^T (A^T A)^{-1} A^T = (A (A^T A)^{-1} e0)^T; equivalently solve (A^T A) b = e0 for b, then w = A b
  const ATA: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let r = 0; r < m; r++) sum += A[r][i] * A[r][j];
      ATA[i][j] = sum;
    }
  }
  // e0 picks the constant term for the central point
  const e0 = Array(p).fill(0);
  e0[0] = 1;

  // Solve ATA * b = e0 using Gaussian elimination
  const b = gaussianSolve(ATA, e0);
  // w = A * b, and we want the central point estimator coefficients over the window
  const w: number[] = Array(m).fill(0);
  for (let r = 0; r < m; r++) {
    let sum = 0;
    for (let c = 0; c < p; c++) sum += A[r][c] * b[c];
    w[r] = sum;
  }

  // Apply convolution with boundary handling via extension of edges
  const out = series.slice();
  for (let i = 0; i < n; i++) {
    let acc = 0;
    for (let k = -half; k <= half; k++) {
      const idx = clamp(i + k, 0, n - 1);
      acc += series[idx] * w[k + half];
    }
    out[i] = acc;
  }
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function gaussianSolve(M: number[][], b: number[]): number[] {
  const n = b.length;
  // Augmented matrix
  const A = M.map((row, i) => row.concat(b[i]));
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Pivot
    let pivot = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[pivot][i])) pivot = r;
    if (Math.abs(A[pivot][i]) < 1e-12) continue;
    if (pivot !== i) { const tmp = A[i]; A[i] = A[pivot]; A[pivot] = tmp; }
    // Normalize
    const div = A[i][i];
    for (let c = i; c <= n; c++) A[i][c] /= div;
    // Eliminate
    for (let r = 0; r < n; r++) if (r !== i) {
      const factor = A[r][i];
      if (factor === 0) continue;
      for (let c = i; c <= n; c++) A[r][c] -= factor * A[i][c];
    }
  }
  return A.map(row => row[n] ?? 0);
}

export function differentiate(series: number[], dt: number): number[] {
  const n = series.length;
  if (!Array.isArray(series) || n === 0 || !isFinite(dt) || dt <= 0) return [];
  if (n === 1) return [0];
  const out = new Array<number>(n).fill(0);
  // Central differences for interior, forward/backward for edges
  out[0] = (series[1] - series[0]) / dt;
  for (let i = 1; i < n - 1; i++) {
    out[i] = (series[i + 1] - series[i - 1]) / (2 * dt);
  }
  out[n - 1] = (series[n - 1] - series[n - 2]) / dt;
  return out;
}

export function computeKinematics(positionsM: number[], timestampsMs: number[]): { v: number[]; a: number[] } {
  const n = positionsM.length;
  if (n === 0 || timestampsMs.length !== n) return { v: [], a: [] };
  if (n === 1) return { v: [0], a: [0] };
  // Convert timestamps to seconds spacing (use average dt)
  const dts: number[] = [];
  for (let i = 1; i < n; i++) dts.push((timestampsMs[i] - timestampsMs[i - 1]) / 1000);
  const dt = dts.reduce((a, b) => a + b, 0) / dts.length;
  // Smooth positions lightly to reduce numerical noise
  const posSmooth = sGolaySmooth(positionsM, Math.min( nineOrLessOdd(n),  nineOrLessOdd(n) ), 3);
  const v = differentiate(posSmooth, dt);
  // Optional smoothing on velocity before accel
  const vSmooth = sGolaySmooth(v, Math.min( nineOrLessOdd(n), 9 ), 3);
  const a = differentiate(vSmooth, dt);
  return { v: vSmooth, a };
}

function nineOrLessOdd(n: number): number {
  const cap = Math.min(n % 2 === 0 ? n - 1 : n,  nineCap );
  return Math.max(3, cap);
}

const nineCap = 9;


