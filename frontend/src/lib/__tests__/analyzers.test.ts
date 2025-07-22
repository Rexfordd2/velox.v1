import { describe, it, expect } from 'vitest';
import { analyzePushup, analyzeSquat } from '../analyzers';

describe('Exercise Analyzers', () => {
  const mockPoseData = {
    keypoints: [
      { name: 'nose', x: 0.5, y: 0.5, score: 0.9 },
      { name: 'left_shoulder', x: 0.4, y: 0.4, score: 0.9 },
      { name: 'right_shoulder', x: 0.6, y: 0.4, score: 0.9 },
      { name: 'left_elbow', x: 0.3, y: 0.3, score: 0.9 },
      { name: 'right_elbow', x: 0.7, y: 0.3, score: 0.9 },
      { name: 'left_wrist', x: 0.2, y: 0.2, score: 0.9 },
      { name: 'right_wrist', x: 0.8, y: 0.2, score: 0.9 },
      { name: 'left_hip', x: 0.4, y: 0.6, score: 0.9 },
      { name: 'right_hip', x: 0.6, y: 0.6, score: 0.9 },
      { name: 'left_knee', x: 0.4, y: 0.7, score: 0.9 },
      { name: 'right_knee', x: 0.6, y: 0.7, score: 0.9 },
      { name: 'left_ankle', x: 0.4, y: 0.8, score: 0.9 },
      { name: 'right_ankle', x: 0.6, y: 0.8, score: 0.9 }
    ]
  };

  describe('Push-up Analyzer', () => {
    it('should return a score between 0 and 100', () => {
      const result = analyzePushup(mockPoseData);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should include feedback in the result', () => {
      const result = analyzePushup(mockPoseData);
      expect(result.feedback).toBeDefined();
      expect(typeof result.feedback).toBe('string');
    });
  });

  describe('Squat Analyzer', () => {
    it('should return a score between 0 and 100', () => {
      const result = analyzeSquat(mockPoseData);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should include feedback in the result', () => {
      const result = analyzeSquat(mockPoseData);
      expect(result.feedback).toBeDefined();
      expect(typeof result.feedback).toBe('string');
    });
  });
}); 