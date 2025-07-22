export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface Landmarks {
  nose?: Landmark;
  leftEye?: Landmark;
  rightEye?: Landmark;
  leftShoulder?: Landmark;
  rightShoulder?: Landmark;
  leftElbow?: Landmark;
  rightElbow?: Landmark;
  leftWrist?: Landmark;
  rightWrist?: Landmark;
  leftHip?: Landmark;
  rightHip?: Landmark;
  leftKnee?: Landmark;
  rightKnee?: Landmark;
  leftAnkle?: Landmark;
  rightAnkle?: Landmark;
  // Add more landmarks as needed
}

export interface Pose {
  frameNumber: number;
  timestamp: number;
  landmarks: Landmarks;
} 