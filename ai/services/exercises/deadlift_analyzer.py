from typing import List, Dict, Tuple
from .base_form_analyzer import BaseFormAnalyzer
import numpy as np

class DeadliftAnalyzer(BaseFormAnalyzer):
    def __init__(self):
        self.required_joints = [11, 12, 13, 14, 23, 24, 25, 26]  # shoulders, elbows, hips, knees
        super().__init__()
        
    @property
    def exercise_name(self) -> str:
        return "deadlift"
        
    def isValidStart(self, landmarks: Dict) -> bool:
        """Check if pose is a valid deadlift starting position."""
        if not self.validate_landmarks(landmarks):
            return False
            
        # Get key joint positions
        left_hip = self.get_joint_position(landmarks, 23)
        left_knee = self.get_joint_position(landmarks, 25)
        left_shoulder = self.get_joint_position(landmarks, 11)
        
        # Calculate hip and back angles
        hip_angle = self.calculate_angle(left_shoulder, left_hip, left_knee)
        back_angle = self.calculate_angle(left_shoulder, left_hip, (left_hip[0], left_hip[1] - 1))  # vertical reference
        
        # Valid start position has hips at proper height and back angle
        return (self.thresholds["min_hip_angle"] <= hip_angle <= self.thresholds["max_hip_angle"] and
                abs(back_angle - self.thresholds["back_angle"]) <= 15)
        
    def scoreRep(self, landmarks: List[Dict]) -> Tuple[float, List[str]]:
        """Score a deadlift rep and provide feedback."""
        if not landmarks or not all(self.validate_landmarks(lm) for lm in landmarks):
            return 0.0, ["Invalid landmarks detected"]
            
        feedback = []
        deductions = 0
        
        # Get key positions from start position (first frame)
        start_frame = landmarks[0]
        left_hip = self.get_joint_position(start_frame, 23)
        left_knee = self.get_joint_position(start_frame, 25)
        left_shoulder = self.get_joint_position(start_frame, 11)
        
        # Check hip angle
        hip_angle = self.calculate_angle(left_shoulder, left_hip, left_knee)
        if hip_angle < self.thresholds["min_hip_angle"]:
            feedback.append("Start with hips higher")
            deductions += 20
        elif hip_angle > self.thresholds["max_hip_angle"]:
            feedback.append("Start with hips lower")
            deductions += 20
            
        # Check back angle
        back_angle = self.calculate_angle(left_shoulder, left_hip, (left_hip[0], left_hip[1] - 1))
        if abs(back_angle - self.thresholds["back_angle"]) > 15:
            feedback.append("Keep back angle at 45 degrees")
            deductions += 20
            
        # Check knee angle
        knee_angle = self.calculate_angle(left_hip, left_knee, (left_knee[0], left_knee[1] + 1))
        if abs(knee_angle - self.thresholds["knee_angle"]) > 15:
            feedback.append("Adjust knee bend")
            deductions += 15
            
        # Check bar path (using hands/wrists)
        wrist_positions = [self.get_joint_position(lm, 15) for lm in landmarks]
        wrist_x_coords = [pos[0] for pos in wrist_positions]
        path_deviation = np.std(wrist_x_coords)
        if path_deviation > 5:  # 5cm threshold for bar path
            feedback.append("Keep bar close to body")
            deductions += 15
            
        # Check stability
        hip_positions = [self.get_joint_position(lm, 23) for lm in landmarks]
        hip_x_coords = [pos[0] for pos in hip_positions]
        stability = np.std(hip_x_coords)
        if stability > self.thresholds["stability_threshold"]:
            feedback.append("Maintain stability throughout the lift")
            deductions += 10
            
        score = max(0, 100 - deductions)
        if not feedback:
            feedback.append("Good form!")
            
        return score, feedback
        
    def phase(self, landmarks: Dict) -> str:
        """Determine the current phase of the deadlift."""
        if not self.validate_landmarks(landmarks):
            return "unknown"
            
        # Get key positions
        hip = self.get_joint_position(landmarks, 23)
        knee = self.get_joint_position(landmarks, 25)
        shoulder = self.get_joint_position(landmarks, 11)
        
        # Calculate hip angle
        hip_angle = self.calculate_angle(shoulder, hip, knee)
        
        # Use hip angle to determine phase
        if hip_angle > 160:
            return "isometric"  # Standing position
        elif hip[1] > knee[1]:  # y increases downward
            return "eccentric"  # Lowering
        else:
            return "concentric"  # Lifting 