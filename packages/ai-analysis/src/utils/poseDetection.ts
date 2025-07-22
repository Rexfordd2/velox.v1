import { Pose as MediaPipePose, Results } from '@mediapipe/pose';
import { Pose, Landmarks } from '../types/pose';

// MediaPipe Pose landmark indices
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
} as const;

export class PoseDetector {
  private pose: MediaPipePose;
  private videoElement: HTMLVideoElement;
  private isProcessing: boolean = false;

  constructor() {
    this.pose = new MediaPipePose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 2,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.videoElement = document.createElement('video');
    this.videoElement.setAttribute('playsinline', '');
  }

  /**
   * Process a video buffer and detect poses
   * @param videoBuffer Video buffer
   * @param fps Frames per second
   * @returns Promise resolving to array of poses
   */
  async detectPoses(videoBuffer: Buffer, fps: number): Promise<Pose[]> {
    if (this.isProcessing) {
      throw new Error('Pose detection already in progress');
    }

    this.isProcessing = true;
    const poses: Pose[] = [];

    try {
      // Create blob URL from buffer
      const blob = new Blob([videoBuffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // Set up video element
      this.videoElement.src = url;
      await new Promise<void>((resolve) => {
        this.videoElement.onloadedmetadata = () => resolve();
      });

      // Set up pose detection callback
      this.pose.onResults((results: Results) => {
        if (!results.poseLandmarks) return;

        const landmarks = this.mapLandmarks(results.poseLandmarks);
        poses.push({
          frameNumber: Math.floor(this.videoElement.currentTime * fps),
          timestamp: this.videoElement.currentTime * 1000,
          landmarks
        });
      });

      // Process video frame by frame
      while (this.videoElement.currentTime < this.videoElement.duration) {
        await this.pose.send({ image: this.videoElement });
        this.videoElement.currentTime += 1 / fps;
      }

      URL.revokeObjectURL(url);
      return poses;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Map MediaPipe landmarks to our format
   */
  private mapLandmarks(landmarks: Results['poseLandmarks']): Landmarks {
    if (!landmarks) return {};

    return {
      nose: landmarks[POSE_LANDMARKS.NOSE],
      leftEye: landmarks[POSE_LANDMARKS.LEFT_EYE],
      rightEye: landmarks[POSE_LANDMARKS.RIGHT_EYE],
      leftShoulder: landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      rightShoulder: landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
      leftElbow: landmarks[POSE_LANDMARKS.LEFT_ELBOW],
      rightElbow: landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
      leftWrist: landmarks[POSE_LANDMARKS.LEFT_WRIST],
      rightWrist: landmarks[POSE_LANDMARKS.RIGHT_WRIST],
      leftHip: landmarks[POSE_LANDMARKS.LEFT_HIP],
      rightHip: landmarks[POSE_LANDMARKS.RIGHT_HIP],
      leftKnee: landmarks[POSE_LANDMARKS.LEFT_KNEE],
      rightKnee: landmarks[POSE_LANDMARKS.RIGHT_KNEE],
      leftAnkle: landmarks[POSE_LANDMARKS.LEFT_ANKLE],
      rightAnkle: landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
    };
  }
} 