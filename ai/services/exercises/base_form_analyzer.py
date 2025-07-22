from typing import List, Dict, Optional, Tuple
import numpy as np
from ..pose_utils import (
    PoseNormalizer, NormalizedPose, PoseConfidence,
    calculate_angle, smooth_angles, validate_landmarks
)
from .movement_analyzer import MovementAnalyzer, RepCount, MovementPhase
import json
import os
from abc import ABC, abstractmethod

class BaseFormAnalyzer(ABC):
    def __init__(self):
        self.thresholds = self._load_thresholds()
        self.required_joints = []  # To be defined by subclasses
        self.pose_normalizer = PoseNormalizer()
        self.movement_analyzer = MovementAnalyzer()
        
    def _load_thresholds(self) -> Dict:
        """Load exercise-specific thresholds from config."""
        config_path = os.path.join(os.path.dirname(__file__), '../../config/form_thresholds.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config[self.exercise_name]
    
    @property
    @abstractmethod
    def exercise_name(self) -> str:
        """Return the name of the exercise for config loading."""
        pass
        
    @abstractmethod
    def isValidStart(self, landmarks: Dict) -> bool:
        """Check if the pose is a valid starting position."""
        pass
        
    @abstractmethod
    def scoreRep(self, landmarks: List[Dict]) -> Tuple[float, List[str]]:
        """Score a single rep and provide feedback."""
        pass
        
    def phase(self, landmarks: Dict) -> str:
        """Determine the current movement phase."""
        if not self.validate_landmarks(landmarks):
            return "unknown"
            
        # Normalize pose
        normalized = self.pose_normalizer.normalize_pose(landmarks, (1920, 1080))
        
        # Get joint triplets for angle calculation
        joint_triplets = self.get_joint_triplets()
        
        # Analyze single frame movement
        rep_count = self.movement_analyzer.analyze_movement(
            [normalized],
            joint_triplets,
            self.get_target_angles()
        )
        
        if rep_count.phases:
            return rep_count.phases[0].name
        return "unknown"
        
    def analyze_movement_sequence(
        self,
        landmarks: List[Dict],
        beat_timestamps: List[float] = None
    ) -> RepCount:
        """
        Analyze a sequence of poses to count reps and detect phases.
        
        Args:
            landmarks: List of pose landmarks
            beat_timestamps: Optional list of music beat timestamps
            
        Returns:
            RepCount with count, confidence and phase information
        """
        if not landmarks or not all(self.validate_landmarks(lm) for lm in landmarks):
            return RepCount(count=0, confidence=0.0, phases=[])
            
        # Normalize pose sequence
        normalized_frames = self.normalize_pose_sequence(landmarks, (1920, 1080))
        if not normalized_frames:
            return RepCount(count=0, confidence=0.0, phases=[])
            
        # Get joint triplets and target angles
        joint_triplets = self.get_joint_triplets()
        target_angles = self.get_target_angles()
        
        # Analyze movement
        return self.movement_analyzer.analyze_movement(
            normalized_frames,
            joint_triplets,
            target_angles,
            beat_timestamps
        )
        
    def normalize_pose_sequence(self, pose_frames: List[Dict], image_size: Tuple[int, int]) -> List[NormalizedPose]:
        """Normalize a sequence of pose frames."""
        normalized_frames = []
        for frame in pose_frames:
            if validate_landmarks(frame, self.required_joints):
                normalized = self.pose_normalizer.normalize_pose(frame, image_size)
                normalized_frames.append(normalized)
        return normalized_frames
        
    def calculate_joint_angles(self, normalized_pose: NormalizedPose, joint_triplets: List[Tuple[str, str, str]]) -> Dict[str, float]:
        """Calculate angles between specified joint triplets."""
        angles = {}
        landmarks = normalized_pose.landmarks
        
        for start_joint, mid_joint, end_joint in joint_triplets:
            if all(j in landmarks for j in [start_joint, mid_joint, end_joint]):
                angle = calculate_angle(
                    landmarks[start_joint][:2],
                    landmarks[mid_joint][:2],
                    landmarks[end_joint][:2]
                )
                angles[f"{mid_joint}_angle"] = angle
                
        return angles
        
    def calculate_movement_metrics(self, normalized_frames: List[NormalizedPose]) -> Dict[str, float]:
        """Calculate movement stability and velocity metrics."""
        if not normalized_frames:
            return {}
            
        metrics = {}
        
        # Extract joint positions over time
        joint_positions = {}
        for frame in normalized_frames:
            for joint, pos in frame.landmarks.items():
                if joint not in joint_positions:
                    joint_positions[joint] = []
                joint_positions[joint].append(pos[:2])
                
        # Calculate stability for each joint
        for joint, positions in joint_positions.items():
            if len(positions) > 1:
                positions = np.array(positions)
                displacement = np.linalg.norm(np.diff(positions, axis=0), axis=1)
                stability = calculate_stability(displacement)
                metrics[f"{joint}_stability"] = stability
                
        # Calculate overall stability
        if joint_positions:
            avg_stability = np.mean([metrics[k] for k in metrics if k.endswith('_stability')])
            metrics['overall_stability'] = float(avg_stability)
            
        return metrics
        
    def validate_landmarks(self, landmarks: Dict) -> bool:
        """Validate that required landmarks are present and visible."""
        return validate_landmarks(landmarks, self.required_joints)
        
    def calculate_angle(self, p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
        """Calculate angle between three points."""
        return calculate_angle(p1, p2, p3)
        
    def smooth_angles(self, angles: List[float], window_size: int = 5) -> List[float]:
        """Apply smoothing to angle sequence."""
        return smooth_angles(angles, window_size)
        
    @abstractmethod
    def get_joint_triplets(self) -> List[Tuple[str, str, str]]:
        """Return list of joint triplets for angle calculation."""
        pass
        
    @abstractmethod
    def get_target_angles(self) -> Dict[str, Tuple[float, float]]:
        """Return dict of joint names to target angle ranges."""
        pass 