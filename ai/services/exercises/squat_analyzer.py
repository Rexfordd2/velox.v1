from typing import List, Dict, Tuple
import numpy as np
from ..pose_utils import (
    NormalizedPose, PoseConfidence, calculate_angle,
    smooth_angles, calculate_stability
)
from .base_form_analyzer import BaseFormAnalyzer

class SquatAnalyzer(BaseFormAnalyzer):
    def __init__(self):
        self.required_joints = [11, 12, 23, 24, 25, 26, 27, 28]  # shoulders, hips, knees, ankles
        super().__init__()
        
    @property
    def exercise_name(self) -> str:
        return "squat"
        
    def get_joint_triplets(self) -> List[Tuple[str, str, str]]:
        """Return joint triplets for angle calculation."""
        return [
            ('left_hip', 'left_knee', 'left_ankle'),  # Left knee angle
            ('right_hip', 'right_knee', 'right_ankle'),  # Right knee angle
            ('left_shoulder', 'left_hip', 'left_knee'),  # Left hip angle
            ('right_shoulder', 'right_hip', 'right_knee'),  # Right hip angle
            ('left_shoulder', 'left_hip', ('left_hip_x', 'left_hip_y-1')),  # Torso angle left
            ('right_shoulder', 'right_hip', ('right_hip_x', 'right_hip_y-1'))  # Torso angle right
        ]
        
    def get_target_angles(self) -> Dict[str, Tuple[float, float]]:
        """Return target angle ranges for each joint."""
        return {
            'left_knee': (self.thresholds["min_depth"], self.thresholds["max_depth"]),
            'right_knee': (self.thresholds["min_depth"], self.thresholds["max_depth"]),
            'left_hip': (self.thresholds["min_hip_angle"], self.thresholds["max_hip_angle"]),
            'right_hip': (self.thresholds["min_hip_angle"], self.thresholds["max_hip_angle"]),
            'left_hip_vertical': (self.thresholds["min_torso_angle"], self.thresholds["max_torso_angle"]),
            'right_hip_vertical': (self.thresholds["min_torso_angle"], self.thresholds["max_torso_angle"])
        }
        
    def isValidStart(self, landmarks: Dict) -> bool:
        """Check if pose is a valid squat starting position."""
        if not self.validate_landmarks(landmarks):
            return False
            
        # Normalize pose
        normalized = self.pose_normalizer.normalize_pose(landmarks, (1920, 1080))
        
        # Calculate joint angles
        angles = self.calculate_joint_angles(normalized, self.get_joint_triplets())
        
        # Check knee angles (should be nearly straight)
        left_knee = angles.get('left_knee_angle')
        right_knee = angles.get('right_knee_angle')
        if not (left_knee and right_knee and 
                left_knee > 160 and right_knee > 160):
            return False
            
        # Check torso angle (should be upright)
        left_torso = angles.get('left_hip_vertical_angle')
        right_torso = angles.get('right_hip_vertical_angle')
        if not (left_torso and right_torso and
                abs(left_torso - 180) < 15 and abs(right_torso - 180) < 15):
            return False
            
        return True
        
    def scoreRep(self, landmarks: List[Dict]) -> Tuple[float, List[str]]:
        """Score a squat rep and provide feedback."""
        if not landmarks or not all(self.validate_landmarks(lm) for lm in landmarks):
            return 0.0, ["Invalid landmarks detected"]
            
        # Analyze movement sequence
        rep_data = self.analyze_movement_sequence(landmarks)
        if not rep_data.phases:
            return 0.0, ["No valid movement detected"]
            
        feedback = []
        deductions = 0
        
        # Check depth
        deepest_phase = min(
            rep_data.phases,
            key=lambda p: p.avg_velocity if p.name == "eccentric" else float('inf')
        )
        if deepest_phase.name == "eccentric":
            normalized = self.normalize_pose_sequence(
                landmarks[deepest_phase.start_frame:deepest_phase.end_frame],
                (1920, 1080)
            )
            if normalized:
                angles = self.calculate_joint_angles(normalized[-1], self.get_joint_triplets())
                knee_angle = min(
                    angles.get('left_knee_angle', float('inf')),
                    angles.get('right_knee_angle', float('inf'))
                )
                if knee_angle > self.thresholds["max_depth"]:
                    feedback.append("Squat deeper")
                    deductions += 20
                elif knee_angle < self.thresholds["min_depth"]:
                    feedback.append("Don't squat too deep")
                    deductions += 10
                    
        # Check movement symmetry
        for phase in rep_data.phases:
            if phase.name != "isometric":
                normalized = self.normalize_pose_sequence(
                    landmarks[phase.start_frame:phase.end_frame],
                    (1920, 1080)
                )
                if normalized:
                    # Compare left/right knee angles
                    angles = self.calculate_joint_angles(normalized[0], self.get_joint_triplets())
                    left_knee = angles.get('left_knee_angle')
                    right_knee = angles.get('right_knee_angle')
                    if left_knee and right_knee and abs(left_knee - right_knee) > 15:
                        feedback.append("Keep weight balanced between legs")
                        deductions += 15
                        break
                        
        # Check torso angle throughout movement
        for phase in rep_data.phases:
            normalized = self.normalize_pose_sequence(
                landmarks[phase.start_frame:phase.end_frame],
                (1920, 1080)
            )
            if normalized:
                for frame in normalized:
                    angles = self.calculate_joint_angles(frame, self.get_joint_triplets())
                    left_torso = angles.get('left_hip_vertical_angle')
                    right_torso = angles.get('right_hip_vertical_angle')
                    if left_torso and right_torso:
                        avg_torso = (left_torso + right_torso) / 2
                        if abs(avg_torso - 180) > 30:
                            feedback.append("Keep your back straight")
                            deductions += 20
                            break
                            
        # Check knee alignment
        metrics = self.calculate_movement_metrics(
            self.normalize_pose_sequence(landmarks, (1920, 1080))
        )
        knee_stability = min(
            metrics.get('left_knee_stability', float('inf')),
            metrics.get('right_knee_stability', float('inf'))
        )
        if knee_stability < self.thresholds["stability_threshold"]:
            feedback.append("Keep knees in line with toes")
            deductions += 15
            
        # Calculate final score
        score = max(0, 100 - deductions)
        if not feedback:
            feedback.append("Good form!")
            
        return score, feedback 