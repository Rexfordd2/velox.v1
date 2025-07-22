from typing import List, Dict, Tuple
from .base_form_analyzer import BaseFormAnalyzer
import numpy as np

class BenchPressAnalyzer(BaseFormAnalyzer):
    def __init__(self):
        self.required_joints = [11, 12, 13, 14, 15, 16, 23, 24]  # shoulders, elbows, wrists, hips
        super().__init__()
        
    @property
    def exercise_name(self) -> str:
        return "bench_press"
        
    def isValidStart(self, landmarks: Dict) -> bool:
        """Check if pose is a valid bench press starting position."""
        if not self.validate_landmarks(landmarks):
            return False
            
        # Get key joint positions
        left_shoulder = self.get_joint_position(landmarks, 11)
        left_elbow = self.get_joint_position(landmarks, 13)
        left_wrist = self.get_joint_position(landmarks, 15)
        
        # Calculate elbow angle
        elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
        
        # Valid start position has elbows nearly straight
        return 160 <= elbow_angle <= 180
        
    def scoreRep(self, landmarks: List[Dict]) -> Tuple[float, List[str]]:
        """Score a bench press rep and provide feedback."""
        if not landmarks or not all(self.validate_landmarks(lm) for lm in landmarks):
            return 0.0, ["Invalid landmarks detected"]
            
        feedback = []
        deductions = 0
        
        # Get key positions from bottom position (middle of sequence)
        mid_frame = landmarks[len(landmarks)//2]
        left_shoulder = self.get_joint_position(mid_frame, 11)
        left_elbow = self.get_joint_position(mid_frame, 13)
        left_wrist = self.get_joint_position(mid_frame, 15)
        right_wrist = self.get_joint_position(mid_frame, 16)
        
        # Check elbow angle at bottom
        elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
        if abs(elbow_angle - self.thresholds["elbow_angle_deg"]) > 15:
            feedback.append("Keep elbows at 90 degrees at bottom")
            deductions += 20
            
        # Check bar path straightness
        wrist_positions = [self.get_joint_position(lm, 15) for lm in landmarks]
        wrist_x_coords = [pos[0] for pos in wrist_positions]
        path_deviation = np.std(wrist_x_coords)
        if path_deviation > self.thresholds["bar_path_deviation_cm"]:
            feedback.append("Keep bar path vertical")
            deductions += 20
            
        # Check bar tilt
        bar_tilt = abs(left_wrist[1] - right_wrist[1])
        if bar_tilt > 5:  # 5cm threshold for bar levelness
            feedback.append("Keep the bar level")
            deductions += 15
            
        # Check stability
        if path_deviation > self.thresholds["stability_threshold"]:
            feedback.append("Maintain stability throughout the press")
            deductions += 10
            
        score = max(0, 100 - deductions)
        if not feedback:
            feedback.append("Good form!")
            
        return score, feedback
        
    def phase(self, landmarks: Dict) -> str:
        """Determine the current phase of the bench press."""
        if not self.validate_landmarks(landmarks):
            return "unknown"
            
        # Get key positions
        shoulder = self.get_joint_position(landmarks, 11)
        elbow = self.get_joint_position(landmarks, 13)
        wrist = self.get_joint_position(landmarks, 15)
        
        # Calculate elbow angle
        elbow_angle = self.calculate_angle(shoulder, elbow, wrist)
        
        # Use vertical wrist position relative to elbow to determine direction
        if elbow_angle > 160:
            return "isometric"  # Locked out position
        elif wrist[1] > elbow[1]:  # y increases downward
            return "eccentric"  # Lowering
        else:
            return "concentric"  # Pressing 