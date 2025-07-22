from typing import List, Dict, Tuple
from .base_form_analyzer import BaseFormAnalyzer
import numpy as np

class PullUpAnalyzer(BaseFormAnalyzer):
    def __init__(self):
        self.required_joints = [11, 12, 13, 14, 15, 16]  # shoulders, elbows, wrists
        super().__init__()
        
    @property
    def exercise_name(self) -> str:
        return "pullup"
        
    def isValidStart(self, landmarks: Dict) -> bool:
        """Check if pose is a valid pull-up starting position."""
        if not self.validate_landmarks(landmarks):
            return False
            
        # Get key joint positions
        left_shoulder = self.get_joint_position(landmarks, 11)
        left_elbow = self.get_joint_position(landmarks, 13)
        left_wrist = self.get_joint_position(landmarks, 15)
        
        # Calculate elbow angle
        elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
        
        # Valid start position has arms nearly straight
        return 160 <= elbow_angle <= 180
        
    def scoreRep(self, landmarks: List[Dict]) -> Tuple[float, List[str]]:
        """Score a pull-up rep and provide feedback."""
        if not landmarks or not all(self.validate_landmarks(lm) for lm in landmarks):
            return 0.0, ["Invalid landmarks detected"]
            
        feedback = []
        deductions = 0
        
        # Get key positions from top position (middle of sequence)
        mid_frame = landmarks[len(landmarks)//2]
        left_shoulder = self.get_joint_position(mid_frame, 11)
        left_elbow = self.get_joint_position(mid_frame, 13)
        left_wrist = self.get_joint_position(mid_frame, 15)
        
        # Check elbow angle at top
        elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
        if elbow_angle > self.thresholds["elbow_angle_deg"]:
            feedback.append("Pull higher - chin over bar")
            deductions += 20
            
        # Check shoulder angle
        shoulder_angle = self.calculate_angle(left_elbow, left_shoulder, (left_shoulder[0], left_shoulder[1] - 1))  # vertical reference
        if abs(shoulder_angle - self.thresholds["shoulder_angle_deg"]) > 15:
            feedback.append("Keep shoulders down and back")
            deductions += 15
            
        # Check height achieved
        start_height = self.get_joint_position(landmarks[0], 11)[1]  # shoulder height at start
        peak_height = min(self.get_joint_position(lm, 11)[1] for lm in landmarks)  # highest shoulder position
        height_ratio = (start_height - peak_height) / start_height  # normalized height achieved
        
        if height_ratio < self.thresholds["min_height_ratio"]:
            feedback.append("Pull all the way up")
            deductions += 20
            
        # Check stability
        shoulder_positions = [self.get_joint_position(lm, 11) for lm in landmarks]
        shoulder_x_coords = [pos[0] for pos in shoulder_positions]
        stability = np.std(shoulder_x_coords)
        if stability > self.thresholds["stability_threshold"]:
            feedback.append("Minimize swinging")
            deductions += 10
            
        score = max(0, 100 - deductions)
        if not feedback:
            feedback.append("Good form!")
            
        return score, feedback
        
    def phase(self, landmarks: Dict) -> str:
        """Determine the current phase of the pull-up."""
        if not self.validate_landmarks(landmarks):
            return "unknown"
            
        # Get key positions
        shoulder = self.get_joint_position(landmarks, 11)
        elbow = self.get_joint_position(landmarks, 13)
        wrist = self.get_joint_position(landmarks, 15)
        
        # Calculate elbow angle
        elbow_angle = self.calculate_angle(shoulder, elbow, wrist)
        
        # Use vertical shoulder position to determine direction
        if elbow_angle > 160:
            return "isometric"  # Dead hang position
        elif shoulder[1] > 0:  # y increases downward
            return "eccentric"  # Lowering
        else:
            return "concentric"  # Pulling up 