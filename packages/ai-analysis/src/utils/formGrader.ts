import { Pose } from '../types/pose';
import formThresholds from '../config/formThresholds.json';

type ExerciseId = keyof typeof formThresholds;
type SquatThresholds = typeof formThresholds.squat;

interface FormFeedback {
  score: number;
  majorErrors: string[];
  minorErrors: string[];
  suggestions: string[];
}

function getThreshold<T extends ExerciseId>(id: T) {
  return formThresholds[id];
}

const defaultFeedback: FormFeedback = {
  score: 0,
  majorErrors: ['Exercise type not supported'],
  minorErrors: [],
  suggestions: ['Please select a supported exercise type']
};

function calculateBackAngle(
  leftHip: { x: number; y: number },
  rightHip: { x: number; y: number },
  leftShoulder: { x: number; y: number },
  rightShoulder: { x: number; y: number }
): number {
  const hipX = (leftHip.x + rightHip.x) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

  const dx = shoulderX - hipX;
  const dy = shoulderY - hipY;
  return Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
}

function calculateSquatMetrics(pose: Pose) {
  const leftHip = pose.landmarks.leftHip;
  const rightHip = pose.landmarks.rightHip;
  const leftKnee = pose.landmarks.leftKnee;
  const rightKnee = pose.landmarks.rightKnee;
  const leftAnkle = pose.landmarks.leftAnkle;
  const rightAnkle = pose.landmarks.rightAnkle;
  const leftShoulder = pose.landmarks.leftShoulder;
  const rightShoulder = pose.landmarks.rightShoulder;

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) {
    return null;
  }

  // Calculate average positions for bilateral movements
  const hipY = (leftHip.y + rightHip.y) / 2;
  const kneeY = (leftKnee.y + rightKnee.y) / 2;
  const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

  // Calculate metrics
  const legLength = Math.abs(hipY - ankleY);
  const hipToKneeLength = Math.abs(hipY - kneeY);
  const hipDepth = hipToKneeLength / legLength; // Ratio of hip-to-knee distance to total leg length

  // Convert knee valgus to degrees (assuming normalized coordinates are in 0-1 range)
  const kneeValgus = Math.abs(leftKnee.x - rightKnee.x) * 100; // Convert to percentage of frame width

  // Calculate back angle (already in degrees)
  const backAngle = calculateBackAngle(leftHip, rightHip, leftShoulder, rightShoulder);

  return {
    hipDepth,
    kneeValgus,
    backAngle
  };
}

export function gradeFrame(pose: Pose, exerciseId: string): FormFeedback {
  const th = getThreshold(exerciseId as ExerciseId);
  if (!th) return defaultFeedback;

  // Log metrics in test mode
  if (process.env.NODE_ENV === 'test') {
    const metrics = calculateSquatMetrics(pose);
    if (metrics) {
      console.log('Squat metrics:', {
        hipDepth: metrics.hipDepth.toFixed(2),
        kneeValgus: metrics.kneeValgus.toFixed(2),
        backAngle: metrics.backAngle.toFixed(2)
      });
    }
  }

  const feedback: FormFeedback = {
    score: 100,
    majorErrors: [],
    minorErrors: [],
    suggestions: []
  };

  // Get landmark positions
  const leftHip = pose.landmarks.leftHip;
  const rightHip = pose.landmarks.rightHip;
  const leftKnee = pose.landmarks.leftKnee;
  const rightKnee = pose.landmarks.rightKnee;
  const leftAnkle = pose.landmarks.leftAnkle;
  const rightAnkle = pose.landmarks.rightAnkle;
  const leftShoulder = pose.landmarks.leftShoulder;
  const rightShoulder = pose.landmarks.rightShoulder;

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) {
    return {
      score: 0,
      majorErrors: ['Missing key landmarks'],
      minorErrors: [],
      suggestions: ['Ensure all body parts are visible in the frame']
    };
  }

  // Exercise-specific grading
  switch (exerciseId) {
    case 'squat': {
      const squatTh = th as SquatThresholds;
      const metrics = calculateSquatMetrics(pose)!;

      // Check hip depth
      if (metrics.hipDepth < squatTh.hipDepth.min) {
        feedback.majorErrors.push('Hip depth too shallow');
        feedback.score -= 20;
      } else if (metrics.hipDepth > squatTh.hipDepth.max) {
        feedback.majorErrors.push('Hip depth too deep');
        feedback.score -= 20;
      }

      // Check knee valgus
      if (metrics.kneeValgus > squatTh.kneeValgus.max) {
        feedback.majorErrors.push('Excessive knee valgus');
        feedback.score -= 15;
      }

      // Check back angle
      if (metrics.backAngle < squatTh.backAngle.min) {
        feedback.minorErrors.push('Back too vertical');
        feedback.score -= 5;
      } else if (metrics.backAngle > squatTh.backAngle.max) {
        feedback.majorErrors.push('Back too horizontal');
        feedback.score -= 15;
      }
      break;
    }
    // Add cases for other exercises...
  }

  // Add suggestions based on errors
  if (feedback.majorErrors.length > 0) {
    feedback.suggestions.push('Focus on fixing major form issues first');
  }
  if (feedback.minorErrors.length > 0) {
    feedback.suggestions.push('Work on refining technique');
  }

  return feedback;
} 