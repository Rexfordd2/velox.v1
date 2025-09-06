import { Landmarks, Landmark } from '../types/pose';

function getPoint(lm?: Landmark): { x: number; y: number; v: number } | null {
  if (!lm) return null;
  const x = typeof lm.x === 'number' ? lm.x : 0;
  const y = typeof lm.y === 'number' ? lm.y : 0;
  const v = typeof lm.visibility === 'number' ? lm.visibility : 1;
  return { x, y, v };
}

export function normalizePose(landmarks: Landmarks): Landmarks {
  const lSh = getPoint(landmarks.leftShoulder);
  const rSh = getPoint(landmarks.rightShoulder);
  const lHip = getPoint(landmarks.leftHip);
  const rHip = getPoint(landmarks.rightHip);
  if (!lSh || !rSh || !lHip || !rHip) return landmarks;

  const shoulderCenter = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
  const hipCenter = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };
  const axis = { x: hipCenter.x - shoulderCenter.x, y: hipCenter.y - shoulderCenter.y };
  const axisNorm = Math.hypot(axis.x, axis.y);
  if (axisNorm < 1e-6) return landmarks;

  // Rotate to align body axis with +Y
  const angle = Math.atan2(axis.x, axis.y);
  const cosT = Math.cos(-angle);
  const sinT = Math.sin(-angle);

  // Scale by shoulder width
  const shoulderWidth = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);
  if (shoulderWidth < 1e-6) return landmarks;
  const scale = 1 / shoulderWidth;

  const origin = { x: hipCenter.x, y: hipCenter.y };

  const transform = (p?: Landmark): Landmark | undefined => {
    if (!p) return p;
    const px = p.x - origin.x;
    const py = p.y - origin.y;
    const rx = cosT * px - sinT * py;
    const ry = sinT * px + cosT * py;
    return {
      ...p,
      x: rx * scale,
      y: ry * scale,
    };
  };

  return {
    nose: transform(landmarks.nose),
    leftEye: transform(landmarks.leftEye),
    rightEye: transform(landmarks.rightEye),
    leftShoulder: transform(landmarks.leftShoulder),
    rightShoulder: transform(landmarks.rightShoulder),
    leftElbow: transform(landmarks.leftElbow),
    rightElbow: transform(landmarks.rightElbow),
    leftWrist: transform(landmarks.leftWrist),
    rightWrist: transform(landmarks.rightWrist),
    leftHip: transform(landmarks.leftHip),
    rightHip: transform(landmarks.rightHip),
    leftKnee: transform(landmarks.leftKnee),
    rightKnee: transform(landmarks.rightKnee),
    leftAnkle: transform(landmarks.leftAnkle),
    rightAnkle: transform(landmarks.rightAnkle),
  };
}


