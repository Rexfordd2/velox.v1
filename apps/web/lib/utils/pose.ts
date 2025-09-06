import { Pose } from '@velox/ai-analysis/src/types/pose';
import { PoseDetector } from '@velox/ai-analysis/src/utils/poseDetection';
export { normalizePose } from '@velox/ai-analysis/src/utils/poseNormalize';

/**
 * Detect poses in video frames
 * @param videoBuffer Video buffer
 * @param fps Frames per second
 * @returns Array of poses
 */
export async function detectPose(
  videoBuffer: Buffer,
  fps: number
): Promise<Pose[]> {
  const detector = new PoseDetector();
  return detector.detectPoses(videoBuffer, fps);
} 