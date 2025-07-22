interface Keypoint {
  name: string;
  x: number;
  y: number;
  score: number;
}

interface PoseData {
  keypoints: Keypoint[];
}

interface AnalysisResult {
  score: number;
  feedback: string;
}

function getKeypoint(keypoints: Keypoint[], name: string): Keypoint | undefined {
  return keypoints.find(kp => kp.name === name);
}

function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

export function analyzePushup(poseData: PoseData): AnalysisResult {
  const { keypoints } = poseData;
  
  const leftShoulder = getKeypoint(keypoints, 'left_shoulder');
  const rightShoulder = getKeypoint(keypoints, 'right_shoulder');
  const leftElbow = getKeypoint(keypoints, 'left_elbow');
  const rightElbow = getKeypoint(keypoints, 'right_elbow');
  const leftWrist = getKeypoint(keypoints, 'left_wrist');
  const rightWrist = getKeypoint(keypoints, 'right_wrist');

  if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftWrist || !rightWrist) {
    return {
      score: 0,
      feedback: 'Could not detect all required body points'
    };
  }

  // Calculate elbow angles
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

  // Basic scoring based on elbow angles
  let score = 100;
  let feedback = '';

  if (leftElbowAngle < 70 || leftElbowAngle > 110) {
    score -= 20;
    feedback += 'Left elbow angle is not optimal. ';
  }
  if (rightElbowAngle < 70 || rightElbowAngle > 110) {
    score -= 20;
    feedback += 'Right elbow angle is not optimal. ';
  }

  // Check shoulder alignment
  const shoulderSlope = Math.abs((rightShoulder.y - leftShoulder.y) / (rightShoulder.x - leftShoulder.x));
  if (shoulderSlope > 0.1) {
    score -= 20;
    feedback += 'Shoulders are not level. ';
  }

  return {
    score: Math.max(0, score),
    feedback: feedback || 'Good form!'
  };
}

export function analyzeSquat(poseData: PoseData): AnalysisResult {
  const { keypoints } = poseData;
  
  const leftHip = getKeypoint(keypoints, 'left_hip');
  const rightHip = getKeypoint(keypoints, 'right_hip');
  const leftKnee = getKeypoint(keypoints, 'left_knee');
  const rightKnee = getKeypoint(keypoints, 'right_knee');
  const leftAnkle = getKeypoint(keypoints, 'left_ankle');
  const rightAnkle = getKeypoint(keypoints, 'right_ankle');

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return {
      score: 0,
      feedback: 'Could not detect all required body points'
    };
  }

  // Calculate knee angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

  // Basic scoring based on knee angles
  let score = 100;
  let feedback = '';

  if (leftKneeAngle < 80 || leftKneeAngle > 100) {
    score -= 20;
    feedback += 'Left knee angle is not optimal. ';
  }
  if (rightKneeAngle < 80 || rightKneeAngle > 100) {
    score -= 20;
    feedback += 'Right knee angle is not optimal. ';
  }

  // Check hip alignment
  const hipSlope = Math.abs((rightHip.y - leftHip.y) / (rightHip.x - leftHip.x));
  if (hipSlope > 0.1) {
    score -= 20;
    feedback += 'Hips are not level. ';
  }

  return {
    score: Math.max(0, score),
    feedback: feedback || 'Good form!'
  };
} 