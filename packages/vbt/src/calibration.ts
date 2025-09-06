/**
 * Compute pixels per meter from a known object height.
 * @param heightMm Known height in millimeters
 * @param pixels Measured pixels for that height
 * @returns pixels per meter
 */
export function pixelsPerMeterFromKnown(heightMm: number, pixels: number): number {
  if (!isFinite(heightMm) || heightMm <= 0 || !isFinite(pixels) || pixels <= 0) {
    return NaN;
  }
  const meters = heightMm / 1000;
  return pixels / meters;
}

/**
 * Compute pixels per meter using a standard plate diameter.
 * @param diameterMm Plate diameter in millimeters
 * @param pixels Measured pixels across the plate
 * @returns pixels per meter
 */
export function pixelsPerMeterFromPlate(diameterMm: number, pixels: number): number {
  return pixelsPerMeterFromKnown(diameterMm, pixels);
}

/**
 * Choose the best available calibration scale (pixels per meter).
 * Preference order: prefA (if valid) then prefB.
 */
export function composeScale(prefA: number, prefB?: number): number {
  const isValid = (v: unknown): v is number => typeof v === 'number' && isFinite(v) && v > 0;
  if (isValid(prefA)) return prefA;
  if (isValid(prefB)) return prefB as number;
  return NaN;
}


