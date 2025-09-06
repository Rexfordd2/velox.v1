export type Point2D = { x: number; y: number };

// Returns the interior angle at point b (in degrees) formed by the segments ba and bc.
export function angleBetween(a: Point2D, b: Point2D, c: Point2D): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magAb = Math.hypot(abx, aby);
  const magCb = Math.hypot(cbx, cby);
  if (magAb === 0 || magCb === 0) return 0;

  const cosTheta = Math.min(1, Math.max(-1, dot / (magAb * magCb)));
  const radians = Math.acos(cosTheta);
  return (radians * 180) / Math.PI;
}

// Flexion helpers return degrees of flexion (0 = fully extended, larger = more flexed)
export function kneeFlexion(hip: Point2D, knee: Point2D, ankle: Point2D): number {
  const kneeAngle = angleBetween(hip, knee, ankle);
  return Math.max(0, 180 - kneeAngle);
}

export function hipFlexion(shoulder: Point2D, hip: Point2D, knee: Point2D): number {
  const hipAngle = angleBetween(shoulder, hip, knee);
  return Math.max(0, 180 - hipAngle);
}

export function elbowFlexion(shoulder: Point2D, elbow: Point2D, wrist: Point2D): number {
  const elbowAngle = angleBetween(shoulder, elbow, wrist);
  return Math.max(0, 180 - elbowAngle);
}


