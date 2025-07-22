import numpy as np
from typing import List, Dict, Tuple, Optional
from enum import Enum
from dataclasses import dataclass
from scipy.signal import savgol_filter
from filterpy.kalman import KalmanFilter

class JointAngle(Enum):
    HIP = "hip"
    KNEE = "knee"
    ANKLE = "ankle"
    SHOULDER = "shoulder"
    ELBOW = "elbow"
    WRIST = "wrist"

@dataclass
class PoseConfidence:
    overall_score: float
    joint_scores: Dict[str, float]
    visibility_scores: Dict[str, float]

@dataclass
class NormalizedPose:
    landmarks: Dict[str, np.ndarray]
    confidence: PoseConfidence
    scale_factor: float
    rotation_matrix: np.ndarray

class PoseNormalizer:
    def __init__(self):
        # Initialize Kalman filters for each joint
        self.joint_filters = {}
        self.init_kalman_filters()
        
        # Reference points for coordinate system
        self.reference_points = {
            'hip_center': ['left_hip', 'right_hip'],
            'shoulder_center': ['left_shoulder', 'right_shoulder'],
            'spine': ['hip_center', 'shoulder_center']
        }
        
        # Joint visibility thresholds
        self.visibility_thresholds = {
            'critical': 0.7,  # Joints critical for exercise
            'secondary': 0.5,  # Supporting joints
            'optional': 0.3   # Non-essential joints
        }

    def init_kalman_filters(self):
        """Initialize Kalman filters for joint tracking"""
        for joint in ['hip', 'knee', 'ankle', 'shoulder', 'elbow', 'wrist']:
            kf = KalmanFilter(dim_x=4, dim_z=2)  # State: [x, y, dx, dy], Measurement: [x, y]
            kf.F = np.array([[1, 0, 1, 0],
                           [0, 1, 0, 1],
                           [0, 0, 1, 0],
                           [0, 0, 0, 1]])  # State transition matrix
            kf.H = np.array([[1, 0, 0, 0],
                           [0, 1, 0, 0]])  # Measurement function
            kf.R *= 0.1  # Measurement noise
            kf.Q *= 0.1  # Process noise
            self.joint_filters[joint] = kf

    def normalize_pose(self, landmarks: Dict[str, np.ndarray], image_size: Tuple[int, int]) -> NormalizedPose:
        """
        Normalize pose landmarks to be camera angle and distance invariant.
        
        Args:
            landmarks: Dictionary of joint positions
            image_size: (width, height) of input image
            
        Returns:
            NormalizedPose with transformed landmarks and confidence scores
        """
        # Calculate confidence scores
        confidence = self._calculate_confidence(landmarks)
        
        # Skip normalization if confidence too low
        if confidence.overall_score < 0.3:
            return NormalizedPose(landmarks, confidence, 1.0, np.eye(3))
            
        # Center pose around hip center
        centered_pose = self._center_pose(landmarks)
        
        # Calculate rotation to align spine with vertical
        rotation_matrix = self._calculate_rotation_matrix(centered_pose)
        
        # Apply rotation
        rotated_pose = self._rotate_pose(centered_pose, rotation_matrix)
        
        # Scale pose to normalized size
        scale_factor = self._calculate_scale_factor(rotated_pose, image_size)
        normalized_pose = self._scale_pose(rotated_pose, scale_factor)
        
        # Apply Kalman filtering
        filtered_pose = self._apply_kalman_filtering(normalized_pose)
        
        return NormalizedPose(
            landmarks=filtered_pose,
            confidence=confidence,
            scale_factor=scale_factor,
            rotation_matrix=rotation_matrix
        )

    def _calculate_confidence(self, landmarks: Dict[str, np.ndarray]) -> PoseConfidence:
        """Calculate confidence scores for pose estimation"""
        joint_scores = {}
        visibility_scores = {}
        
        # Calculate per-joint confidence
        for joint, pos in landmarks.items():
            if len(pos) > 2:  # If confidence value available
                joint_scores[joint] = float(pos[2])
                visibility_scores[joint] = 1.0 if pos[2] > self.visibility_thresholds['critical'] else 0.0
            else:
                joint_scores[joint] = 0.0
                visibility_scores[joint] = 0.0
        
        # Calculate overall confidence
        critical_joints = ['left_hip', 'right_hip', 'left_shoulder', 'right_shoulder']
        critical_score = np.mean([joint_scores[j] for j in critical_joints if j in joint_scores])
        
        return PoseConfidence(
            overall_score=critical_score,
            joint_scores=joint_scores,
            visibility_scores=visibility_scores
        )

    def _center_pose(self, landmarks: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Center pose around hip center"""
        hip_center = self._get_reference_point(landmarks, 'hip_center')
        if hip_center is None:
            return landmarks
            
        centered = {}
        for joint, pos in landmarks.items():
            centered[joint] = pos - np.append(hip_center, [0] if len(pos) > 2 else [])
        return centered

    def _calculate_rotation_matrix(self, landmarks: Dict[str, np.ndarray]) -> np.ndarray:
        """Calculate rotation matrix to align spine with vertical"""
        spine_vector = self._get_spine_vector(landmarks)
        if spine_vector is None:
            return np.eye(3)
            
        # Calculate angle between spine and vertical
        vertical = np.array([0, -1])
        angle = np.arctan2(spine_vector[0], spine_vector[1])
        
        # Create rotation matrix
        cos_theta = np.cos(angle)
        sin_theta = np.sin(angle)
        rotation_matrix = np.array([[cos_theta, -sin_theta, 0],
                                  [sin_theta, cos_theta, 0],
                                  [0, 0, 1]])
        return rotation_matrix

    def _rotate_pose(self, landmarks: Dict[str, np.ndarray], rotation_matrix: np.ndarray) -> Dict[str, np.ndarray]:
        """Apply rotation to pose landmarks"""
        rotated = {}
        for joint, pos in landmarks.items():
            homogeneous_pos = np.append(pos[:2], 1)
            rotated_pos = rotation_matrix @ homogeneous_pos
            rotated[joint] = np.append(rotated_pos[:2], pos[2:] if len(pos) > 2 else [])
        return rotated

    def _calculate_scale_factor(self, landmarks: Dict[str, np.ndarray], image_size: Tuple[int, int]) -> float:
        """Calculate scale factor based on body size"""
        hip_to_shoulder = self._get_spine_length(landmarks)
        if hip_to_shoulder is None:
            return 1.0
            
        target_height = min(image_size) * 0.4  # Target 40% of image height
        return target_height / hip_to_shoulder

    def _scale_pose(self, landmarks: Dict[str, np.ndarray], scale_factor: float) -> Dict[str, np.ndarray]:
        """Scale pose landmarks"""
        scaled = {}
        for joint, pos in landmarks.items():
            scaled_pos = pos.copy()
            scaled_pos[:2] *= scale_factor
            scaled[joint] = scaled_pos
        return scaled

    def _apply_kalman_filtering(self, landmarks: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """Apply Kalman filtering to joint positions"""
        filtered = {}
        for joint, pos in landmarks.items():
            if joint in self.joint_filters:
                kf = self.joint_filters[joint]
                measurement = pos[:2]
                kf.predict()
                kf.update(measurement)
                filtered_pos = np.append(kf.x[:2], pos[2:] if len(pos) > 2 else [])
                filtered[joint] = filtered_pos
            else:
                filtered[joint] = pos
        return filtered

    def _get_reference_point(self, landmarks: Dict[str, np.ndarray], point_name: str) -> Optional[np.ndarray]:
        """Get reference point coordinates (e.g. hip center, shoulder center)"""
        if point_name not in self.reference_points:
            return None
            
        points = self.reference_points[point_name]
        coords = []
        
        for point in points:
            if point in landmarks:
                coords.append(landmarks[point][:2])
            elif point in self.reference_points:  # Handle composite points
                ref_point = self._get_reference_point(landmarks, point)
                if ref_point is not None:
                    coords.append(ref_point)
                    
        if not coords:
            return None
            
        return np.mean(coords, axis=0)

    def _get_spine_vector(self, landmarks: Dict[str, np.ndarray]) -> Optional[np.ndarray]:
        """Get spine vector from hip center to shoulder center"""
        hip_center = self._get_reference_point(landmarks, 'hip_center')
        shoulder_center = self._get_reference_point(landmarks, 'shoulder_center')
        
        if hip_center is None or shoulder_center is None:
            return None
            
        return shoulder_center - hip_center

    def _get_spine_length(self, landmarks: Dict[str, np.ndarray]) -> Optional[float]:
        """Get spine length (hip center to shoulder center)"""
        spine_vector = self._get_spine_vector(landmarks)
        if spine_vector is None:
            return None
            
        return np.linalg.norm(spine_vector)

def calculate_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """Calculate angle between three points"""
    ba = a - b
    bc = c - b
    
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    
    return np.degrees(angle)

def smooth_angles(angles: List[float], window_size: int = 5) -> List[float]:
    """Apply Savitzky-Golay filter to angle sequence"""
    if len(angles) < window_size:
        return angles
        
    return savgol_filter(angles, window_size, 2).tolist()

def calculate_stability(angles: List[float]) -> float:
    """Calculate movement stability score"""
    if not angles:
        return 0.0
        
    std_dev = np.std(angles)
    stability = 1.0 / (1.0 + std_dev)
    
    return float(stability)

def validate_landmarks(landmarks: Dict[str, np.ndarray], required_joints: List[int]) -> bool:
    """Validate presence and visibility of required landmarks"""
    if not landmarks or not required_joints:
        return False
        
    for joint_id in required_joints:
        if str(joint_id) not in landmarks:
            return False
            
        pos = landmarks[str(joint_id)]
        if len(pos) > 2 and pos[2] < 0.5:  # Check confidence if available
            return False
            
    return True 