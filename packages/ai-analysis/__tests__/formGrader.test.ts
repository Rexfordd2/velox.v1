import { describe, test, expect } from 'vitest';
import { gradeFrame } from '../src/utils/formGrader';
import { Pose } from '../src/types/pose';

// Mock perfect squat pose
const goodSquat: Pose = {
  frameNumber: 0,
  timestamp: 0,
  landmarks: {
    leftHip: { x: 0.5, y: 0.8, z: 0, visibility: 1 },
    rightHip: { x: 0.5, y: 0.8, z: 0, visibility: 1 },
    leftKnee: { x: 0.49, y: 0.9, z: 0, visibility: 1 },
    rightKnee: { x: 0.51, y: 0.9, z: 0, visibility: 1 },
    leftAnkle: { x: 0.5, y: 1.0, z: 0, visibility: 1 },
    rightAnkle: { x: 0.5, y: 1.0, z: 0, visibility: 1 },
    leftShoulder: { x: 0.5, y: 0.4, z: 0, visibility: 1 },
    rightShoulder: { x: 0.5, y: 0.4, z: 0, visibility: 1 }
  }
};

// Mock squat with knee valgus
const valgusSquat: Pose = {
  frameNumber: 0,
  timestamp: 0,
  landmarks: {
    leftHip: { x: 0.5, y: 0.8, z: 0, visibility: 1 },
    rightHip: { x: 0.5, y: 0.8, z: 0, visibility: 1 },
    leftKnee: { x: 0.3, y: 0.9, z: 0, visibility: 1 },
    rightKnee: { x: 0.7, y: 0.9, z: 0, visibility: 1 },
    leftAnkle: { x: 0.5, y: 1.0, z: 0, visibility: 1 },
    rightAnkle: { x: 0.5, y: 1.0, z: 0, visibility: 1 },
    leftShoulder: { x: 0.5, y: 0.4, z: 0, visibility: 1 },
    rightShoulder: { x: 0.5, y: 0.4, z: 0, visibility: 1 }
  }
};

// Mock squat with shallow depth
const shallowSquat: Pose = {
  frameNumber: 0,
  timestamp: 0,
  landmarks: {
    leftHip: { x: 0.5, y: 0.7, z: 0, visibility: 1 },
    rightHip: { x: 0.5, y: 0.7, z: 0, visibility: 1 },
    leftKnee: { x: 0.5, y: 0.75, z: 0, visibility: 1 },
    rightKnee: { x: 0.5, y: 0.75, z: 0, visibility: 1 },
    leftAnkle: { x: 0.5, y: 1.0, z: 0, visibility: 1 },
    rightAnkle: { x: 0.5, y: 1.0, z: 0, visibility: 1 },
    leftShoulder: { x: 0.5, y: 0.4, z: 0, visibility: 1 },
    rightShoulder: { x: 0.5, y: 0.4, z: 0, visibility: 1 }
  }
};

describe('Form grading', () => {
  test('perfect squat passes all checks', () => {
    const feedback = gradeFrame(goodSquat, 'squat');
    expect(feedback.score).toBeGreaterThanOrEqual(80);
    expect(feedback.majorErrors).toHaveLength(0);
    expect(feedback.minorErrors).toHaveLength(0);
  });

  test('valgus squat fails knee-valgus check', () => {
    const feedback = gradeFrame(valgusSquat, 'squat');
    expect(feedback.score).toBeLessThan(100);
    expect(feedback.majorErrors).toContain('Excessive knee valgus');
  });

  test('shallow squat fails depth check', () => {
    const feedback = gradeFrame(shallowSquat, 'squat');
    expect(feedback.score).toBeLessThan(100);
    expect(feedback.majorErrors).toContain('Hip depth too shallow');
  });

  test('missing landmarks returns error feedback', () => {
    const incompletePose: Pose = {
      frameNumber: 0,
      timestamp: 0,
      landmarks: {
        leftHip: { x: 0.5, y: 0.6, z: 0, visibility: 1 }
        // Missing other landmarks
      }
    };
    const feedback = gradeFrame(incompletePose, 'squat');
    expect(feedback.score).toBe(0);
    expect(feedback.majorErrors).toContain('Missing key landmarks');
  });

  test('unsupported exercise returns default feedback', () => {
    const feedback = gradeFrame(goodSquat, 'unsupported');
    expect(feedback.score).toBe(0);
    expect(feedback.majorErrors).toContain('Exercise type not supported');
  });
}); 