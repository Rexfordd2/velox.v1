from typing import List, Dict, Tuple
from .base_form_analyzer import BaseFormAnalyzer
import numpy as np

class LungeAnalyzer(BaseFormAnalyzer):
    def __init__(self):
        self.required_joints = [23, 24, 25, 26, 27, 28, 11, 12]  # hips, knees, ankles, shoulders
        super().__init__()
        
    @property
    def exercise_name(self) -> str:
        return "lunge"
        
    def isValidStart(self, landmarks: Dict) -> bool:
        """Check if pose is a valid lunge starting position."""
        if not self.validate_landmarks(landmarks):
            return False
            
        # Get key joint positions
        left_hip = self.get_joint_position(landmarks, 23)
        left_knee = self.get_joint_position(landmarks, 25)
        left_ankle = self.get_joint_position(landmarks, 27)
        
        # Calculate knee angle
        knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
        
        # Valid start position has knees nearly straight
        return 160 <= knee_angle <= 180
        
    def scoreRep(self, landmarks: List[Dict]) -> Tuple[float, List[str]]:
        """Score a lunge rep and provide feedback."""
        if not landmarks or not all(self.validate_landmarks(lm) for lm in landmarks):
            return 0.0, ["Invalid landmarks detected"]
            
        feedback = []
        deductions = 0
        
        # Get key positions from bottom position (middle of sequence)
        mid_frame = landmarks[len(landmarks)//2]
        left_hip = self.get_joint_position(mid_frame, 23)
        left_knee = self.get_joint_position(mid_frame, 25)
        left_ankle = self.get_joint_position(mid_frame, 27)
        left_shoulder = self.get_joint_position(mid_frame, 11)
        
        # Check front knee angle
        front_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
        if abs(front_knee_angle - self.thresholds["front_knee_angle_deg"]) > 15:
            feedback.append("Front knee should be at 90 degrees")
            deductions += 20
            
        # Check back knee angle
        right_hip = self.get_joint_position(mid_frame, 24)
        right_knee = self.get_joint_position(mid_frame, 26)
        right_ankle = self.get_joint_position(mid_frame, 28)
        back_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
        if abs(back_knee_angle - self.thresholds["back_knee_angle_deg"]) > 15:
            feedback.append("Back knee should be at 90 degrees")
            deductions += 15
            
        # Check torso angle
        torso_angle = self.calculate_angle(left_shoulder, left_hip, (left_hip[0], left_hip[1] - 1))  # vertical reference
        if abs(torso_angle - self.thresholds["torso_angle_deg"]) > 10:
            feedback.append("Keep torso upright")
            deductions += 20
            
        # Check stability
        hip_positions = [self.get_joint_position(lm, 23) for lm in landmarks]
        hip_x_coords = [pos[0] for pos in hip_positions]
        stability = np.std(hip_x_coords)
        if stability > self.thresholds["stability_threshold"]:
            feedback.append("Maintain stability throughout the movement")
            deductions += 10
            
        score = max(0, 100 - deductions)
        if not feedback:
            feedback.append("Good form!")
            
        return score, feedback
        
    def phase(self, landmarks: Dict) -> str:
        """Determine the current phase of the lunge."""
        if not self.validate_landmarks(landmarks):
            return "unknown"
            
        # Get key positions
        hip = self.get_joint_position(landmarks, 23)
        knee = self.get_joint_position(landmarks, 25)
        ankle = self.get_joint_position(landmarks, 27)
        
        # Calculate knee angle
        knee_angle = self.calculate_angle(hip, knee, ankle)
        
        # Use vertical hip position to determine direction
        if knee_angle > 160:
            return "isometric"  # Standing position
        elif hip[1] > 0:  # y increases downward
            return "eccentric"  # Descending
        else:
            return "concentric"  # Ascending 