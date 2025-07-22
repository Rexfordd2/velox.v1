from typing import List, Dict, Optional
import numpy as np
from ..pose_utils import (
    Pose, FormScore, RepBoundary, calculate_angle,
    get_joint_position, smooth_angles, validate_landmarks
)
from .form_quality import get_pushup_confidence
import json
import os

class PushUpAnalyzer:
    def __init__(self):
        self.thresholds = self._load_thresholds()
        self.required_joints = [11, 12, 13, 14, 23, 24]  # Shoulders, elbows, hips
        
    def _load_thresholds(self) -> Dict:
        """Load exercise-specific thresholds from config."""
        config_path = os.path.join(os.path.dirname(__file__), '../../config/form_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config['pushup']
        
    def analyze_pose(self, pose_frames: List[Pose]) -> FormScore:
        """
        Analyze push-up form and provide feedback.
        
        Args:
            pose_frames: List of pose frames
            
        Returns:
            FormScore with metrics and feedback
        """
        if not pose_frames:
            return FormScore(0.0, {}, ["No pose data available"])
            
        # Extract metrics
        elbow_angles = []
        hip_angles = []
        neck_angles = []
        
        for pose in pose_frames:
            if not validate_landmarks(pose.landmarks, self.required_joints):
                continue
                
            # Calculate elbow angles
            left_elbow = self._get_elbow_angle(pose.landmarks, 'left')
            right_elbow = self._get_elbow_angle(pose.landmarks, 'right')
            if left_elbow and right_elbow:
                elbow_angles.append((left_elbow + right_elbow) / 2)
                
            # Calculate hip angle
            hip = self._get_hip_angle(pose.landmarks)
            if hip:
                hip_angles.append(hip)
                
            # Calculate neck angle
            neck = self._get_neck_angle(pose.landmarks)
            if neck:
                neck_angles.append(neck)
                
        # Calculate scores
        elbow_score = self._score_elbow_angles(elbow_angles)
        hip_score = self._score_hip_angles(hip_angles)
        neck_score = self._score_neck_angles(neck_angles)
        
        # Calculate overall score
        overall_score = (elbow_score + hip_score + neck_score) / 3
        
        # Generate feedback
        feedback = []
        if elbow_score < 0.7:
            feedback.append("Maintain proper elbow angle at bottom position")
        if hip_score < 0.7:
            feedback.append("Keep your body straight - don't sag at the hips")
        if neck_score < 0.7:
            feedback.append("Keep your neck neutral - don't look up or down")
            
        return FormScore(
            overall_score=overall_score,
            metrics={
                "elbow_score": elbow_score,
                "hip_score": hip_score,
                "neck_score": neck_score,
                "min_elbow_angle": min(elbow_angles) if elbow_angles else 0,
                "max_hip_angle": max(hip_angles) if hip_angles else 0,
                "max_neck_angle": max(neck_angles) if neck_angles else 0
            },
            feedback=feedback
        )
        
    def get_rep_boundaries(self, pose_frames: List[Pose]) -> List[RepBoundary]:
        """
        Detect push-up repetitions based on elbow angles.
        
        Args:
            pose_frames: List of pose frames
            
        Returns:
            List of rep boundaries
        """
        if not pose_frames:
            return []
            
        # Calculate elbow angles for each frame
        elbow_angles = []
        for pose in pose_frames:
            if validate_landmarks(pose.landmarks, self.required_joints):
                left_elbow = self._get_elbow_angle(pose.landmarks, 'left')
                right_elbow = self._get_elbow_angle(pose.landmarks, 'right')
                if left_elbow and right_elbow:
                    elbow_angles.append((left_elbow + right_elbow) / 2)
                    
        if not elbow_angles:
            return []
            
        # Smooth elbow angles
        smoothed_angles = smooth_angles(elbow_angles)
        
        # Detect reps based on elbow angle
        boundaries = []
        in_rep = False
        start_frame = 0
        min_angle = 90  # degrees
        
        for i, angle in enumerate(smoothed_angles):
            if not in_rep and angle < self.thresholds['elbow_angle_deg']:
                in_rep = True
                start_frame = i
            elif in_rep and angle > min_angle:
                confidence = get_pushup_confidence(
                    [frame.landmarks for frame in pose_frames],
                    start_frame,
                    i,
                    self.thresholds
                )
                boundaries.append(RepBoundary(
                    start_frame=start_frame,
                    end_frame=i,
                    rep_type="pushup",
                    confidence=confidence
                ))
                in_rep = False
                
        return boundaries
        
    def _get_elbow_angle(self, landmarks: Dict, side: str) -> Optional[float]:
        """Calculate elbow angle for given side."""
        if side == 'left':
            shoulder = get_joint_position(landmarks, 11)
            elbow = get_joint_position(landmarks, 13)
            wrist = get_joint_position(landmarks, 15)
        else:
            shoulder = get_joint_position(landmarks, 12)
            elbow = get_joint_position(landmarks, 14)
            wrist = get_joint_position(landmarks, 16)
            
        if all([shoulder, elbow, wrist]):
            return calculate_angle(shoulder, elbow, wrist)
        return None
        
    def _get_hip_angle(self, landmarks: Dict) -> Optional[float]:
        """Calculate hip angle (deviation from straight line)."""
        shoulder = get_joint_position(landmarks, 11)  # Use left shoulder
        hip = get_joint_position(landmarks, 23)  # Use left hip
        ankle = get_joint_position(landmarks, 27)  # Use left ankle
        
        if all([shoulder, hip, ankle]):
            return calculate_angle(shoulder, hip, ankle)
        return None
        
    def _get_neck_angle(self, landmarks: Dict) -> Optional[float]:
        """Calculate neck angle (deviation from neutral)."""
        ear = get_joint_position(landmarks, 7)  # Use left ear
        shoulder = get_joint_position(landmarks, 11)  # Use left shoulder
        hip = get_joint_position(landmarks, 23)  # Use left hip
        
        if all([ear, shoulder, hip]):
            return calculate_angle(ear, shoulder, hip)
        return None
        
    def _score_elbow_angles(self, angles: List[float]) -> float:
        """Score elbow angles based on threshold."""
        if not angles:
            return 0.0
            
        min_angle = min(angles)
        target = self.thresholds['elbow_angle_deg']
        tolerance = 10  # degrees
        
        # Score based on how close to target angle
        score = 1.0 - min(1.0, abs(min_angle - target) / tolerance)
        return float(score)
        
    def _score_hip_angles(self, angles: List[float]) -> float:
        """Score hip angles based on straightness."""
        if not angles:
            return 0.0
            
        max_angle = max(angles)
        threshold = self.thresholds['hip_angle_deg']
        
        # Score based on hip angle (closer to 180° is better)
        score = 1.0 - min(1.0, abs(180 - max_angle) / threshold)
        return float(score)
        
    def _score_neck_angles(self, angles: List[float]) -> float:
        """Score neck angles based on neutrality."""
        if not angles:
            return 0.0
            
        max_deviation = max(abs(angle - 180) for angle in angles)
        threshold = self.thresholds['neck_angle_deg']
        
        # Score based on neck angle deviation from neutral
        score = 1.0 - min(1.0, max_deviation / threshold)
        return float(score) 