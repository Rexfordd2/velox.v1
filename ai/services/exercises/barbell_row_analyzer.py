from typing import List, Dict, Tuple, Optional
import numpy as np
from ..pose_utils import (
    NormalizedPose, PoseConfidence, calculate_angle,
    smooth_angles, calculate_stability
)
from .base_form_analyzer import BaseFormAnalyzer

class BarbellRowAnalyzer(BaseFormAnalyzer):
    def __init__(self):
        super().__init__()
        self.required_joints = [11, 12, 13, 14, 15, 16, 23, 24]  # Shoulders, elbows, wrists, hips
        self.joint_triplets = [
            ('left_shoulder', 'left_hip', 'left_knee'),  # Back angle
            ('left_shoulder', 'left_elbow', 'left_wrist'),  # Elbow angle
            ('right_shoulder', 'right_elbow', 'right_wrist')  # Symmetry check
        ]
        
    @property
    def exercise_name(self) -> str:
        return "barbell_row"
        
    def isValidStart(self, landmarks: Dict) -> bool:
        """Check if pose is valid starting position for barbell row."""
        if not self.validate_landmarks(landmarks):
            return False
            
        # Normalize pose
        normalized = self.pose_normalizer.normalize_pose(landmarks, (1920, 1080))  # Default size
        
        # Calculate key angles
        angles = self.calculate_joint_angles(normalized, self.joint_triplets)
        
        # Check back angle (should be ~45 degrees)
        back_angle = angles.get('left_hip_angle')
        if back_angle is None or abs(back_angle - self.thresholds["back_angle_deg"]) > 15:
            return False
            
        # Check elbow extension
        elbow_angle = angles.get('left_elbow_angle')
        if elbow_angle is None or elbow_angle < self.thresholds["elbow_extension_deg"]:
            return False
            
        return True
        
    def scoreRep(self, landmarks: List[Dict]) -> Tuple[float, List[str]]:
        """Score a barbell row rep and provide feedback."""
        if not landmarks or not all(self.validate_landmarks(lm) for lm in landmarks):
            return 0.0, ["Invalid landmarks detected"]
            
        # Normalize pose sequence
        normalized_frames = self.normalize_pose_sequence(landmarks, (1920, 1080))
        if not normalized_frames:
            return 0.0, ["Failed to normalize pose sequence"]
            
        # Calculate metrics for each frame
        back_angles = []
        elbow_angles = []
        bar_positions = []
        feedback = []
        deductions = 0
        
        for frame in normalized_frames:
            # Calculate joint angles
            angles = self.calculate_joint_angles(frame, self.joint_triplets)
            
            # Track back angle
            if 'left_hip_angle' in angles:
                back_angles.append(angles['left_hip_angle'])
                
            # Track elbow angle
            if 'left_elbow_angle' in angles:
                elbow_angles.append(angles['left_elbow_angle'])
                
            # Track bar position (using wrists)
            if 'left_wrist' in frame.landmarks and 'right_wrist' in frame.landmarks:
                left_wrist = frame.landmarks['left_wrist'][:2]
                right_wrist = frame.landmarks['right_wrist'][:2]
                bar_pos = (left_wrist + right_wrist) / 2
                bar_positions.append(bar_pos)
                
        # Smooth angles
        if back_angles:
            back_angles = smooth_angles(back_angles)
        if elbow_angles:
            elbow_angles = smooth_angles(elbow_angles)
            
        # Calculate movement metrics
        metrics = self.calculate_movement_metrics(normalized_frames)
        
        # Check back angle consistency
        if back_angles:
            back_stability = calculate_stability(back_angles)
            if back_stability < self.thresholds["stability_threshold"]:
                feedback.append("Keep your back angle steady")
                deductions += 20
            
            avg_back_angle = np.mean(back_angles)
            if abs(avg_back_angle - self.thresholds["back_angle_deg"]) > 15:
                feedback.append("Maintain torso at 45 degrees")
                deductions += 15
                
        # Check elbow range of motion
        if elbow_angles:
            min_elbow = min(elbow_angles)
            if min_elbow > self.thresholds["elbow_angle_deg"]:
                feedback.append("Pull bar higher - touch lower chest")
                deductions += 15
                
        # Check bar path straightness
        if bar_positions:
            bar_positions = np.array(bar_positions)
            path_deviation = np.std(bar_positions[:, 0])  # X-axis deviation
            if path_deviation > self.thresholds["bar_path_deviation_cm"]:
                feedback.append("Keep bar path vertical")
                deductions += 15
                
        # Check symmetry
        if 'left_elbow_stability' in metrics and 'right_elbow_stability' in metrics:
            symmetry = abs(metrics['left_elbow_stability'] - metrics['right_elbow_stability'])
            if symmetry > 0.2:
                feedback.append("Pull evenly with both arms")
                deductions += 10
                
        # Check overall stability
        if 'overall_stability' in metrics:
            if metrics['overall_stability'] < self.thresholds["stability_threshold"]:
                feedback.append("Control the movement - minimize body swing")
                deductions += 15
                
        score = max(0, 100 - deductions)
        if not feedback:
            feedback.append("Good form!")
            
        return score, feedback
        
    def phase(self, landmarks: Dict) -> str:
        """Determine the current movement phase."""
        if not self.validate_landmarks(landmarks):
            return "unknown"
            
        # Normalize pose
        normalized = self.pose_normalizer.normalize_pose(landmarks, (1920, 1080))
        
        # Calculate elbow angle
        angles = self.calculate_joint_angles(normalized, [
            ('left_shoulder', 'left_elbow', 'left_wrist')
        ])
        
        elbow_angle = angles.get('left_elbow_angle')
        if elbow_angle is None:
            return "unknown"
            
        # Determine phase based on elbow angle
        if elbow_angle < self.thresholds["elbow_angle_deg"]:
            return "concentric"  # Pulling up
        else:
            return "eccentric"  # Lowering 