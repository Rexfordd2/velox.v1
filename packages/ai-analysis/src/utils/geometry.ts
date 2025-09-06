/**
 * Compute a homography H (3x3 row-major) that maps ptsSrc -> ptsDst.
 * Uses a minimal DLT approach solving an 8x8 linear system with h[8]=1.
 */
export function computeHomography(
  ptsSrc: [number, number][],
  ptsDst: [number, number][]
): number[] {
  if (ptsSrc.length !== 4 || ptsDst.length !== 4) {
    throw new Error('computeHomography requires exactly 4 point correspondences');
  }

  // Build linear system A * h = b for 8 unknowns (h0..h7), with h8 fixed to 1
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [x, y] = ptsSrc[i];
    const [X, Y] = ptsDst[i];
    // From x' = (h0 x + h1 y + h2) / (h6 x + h7 y + 1)
    // and y' = (h3 x + h4 y + h5) / (h6 x + h7 y + 1)
    // Rearranged:
    // x'*(h6 x + h7 y + 1) = h0 x + h1 y + h2
    // y'*(h6 x + h7 y + 1) = h3 x + h4 y + h5
    // Put unknowns [h0,h1,h2,h3,h4,h5,h6,h7]
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    b.push(Y);
  }

  const h = solveLinearSystem(A, b); // length 8
  const H = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  return H;
}

/** Project a pixel point (x,y) using homography H (row-major) */
export function projectPoint(H: number[], x: number, y: number): { x: number; y: number } {
  if (!Array.isArray(H) || H.length !== 9) throw new Error('Invalid homography');
  const X = H[0] * x + H[1] * y + H[2];
  const Y = H[3] * x + H[4] * y + H[5];
  const W = H[6] * x + H[7] * y + H[8];
  if (W === 0) return { x: 0, y: 0 };
  return { x: X / W, y: Y / W };
}

// Simple Gaussian elimination solver for A (n x n) and b (n)
function solveLinearSystem(Ain: number[][], bin: number[]): number[] {
  const n = bin.length;
  // Build augmented matrix
  const A = Ain.map((row, i) => [...row, bin[i]]);

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Pivot
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivotRow][col])) pivotRow = r;
    }
    if (Math.abs(A[pivotRow][col]) < 1e-12) throw new Error('Singular matrix');
    if (pivotRow !== col) {
      const tmp = A[col];
      A[col] = A[pivotRow];
      A[pivotRow] = tmp;
    }

    // Eliminate
    for (let r = col + 1; r < n; r++) {
      const factor = A[r][col] / A[col][col];
      for (let c = col; c <= n; c++) {
        A[r][c] -= factor * A[col][c];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = A[i][n];
    for (let j = i + 1; j < n; j++) sum -= A[i][j] * x[j];
    x[i] = sum / A[i][i];
  }
  return x;
}


