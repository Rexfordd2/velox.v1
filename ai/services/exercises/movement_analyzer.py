from typing import List, Dict, Tuple, Optional
import numpy as np
from scipy.signal import find_peaks, savgol_filter
from dataclasses import dataclass
from ..pose_utils import (
    NormalizedPose, PoseConfidence, calculate_angle,
    smooth_angles, calculate_stability
)

@dataclass
class MovementPhase:
    name: str  # 'eccentric', 'concentric', 'isometric'
    confidence: float
    start_frame: int
    end_frame: int
    peak_velocity: float
    avg_velocity: float

@dataclass
class RepCount:
    count: int
    confidence: float
    phases: List[MovementPhase]
    rhythm_score: Optional[float] = None

class MovementAnalyzer:
    def __init__(self, window_size: int = 5, peak_prominence: float = 0.3):
        self.window_size = window_size
        self.peak_prominence = peak_prominence
        self.velocity_threshold = 0.1
        self.min_phase_frames = 3
        
    def analyze_movement(
        self,
        normalized_frames: List[NormalizedPose],
        joint_triplets: List[Tuple[str, str, str]],
        target_angles: Dict[str, Tuple[float, float]] = None,  # (min, max) angles
        beat_timestamps: List[float] = None
    ) -> RepCount:
        """
        Analyze movement patterns to count reps and detect phases.
        
        Args:
            normalized_frames: List of normalized pose frames
            joint_triplets: List of (start, mid, end) joint names for angle calculation
            target_angles: Dict of joint names to target angle ranges
            beat_timestamps: Optional list of music beat timestamps
            
        Returns:
            RepCount with count, confidence and phase information
        """
        if not normalized_frames or len(normalized_frames) < self.min_phase_frames:
            return RepCount(count=0, confidence=0.0, phases=[])
            
        # Calculate joint angles for each frame
        angles_by_joint = self._calculate_angle_sequences(normalized_frames, joint_triplets)
        
        # Apply Savitzky-Golay filter for smooth derivatives
        filtered_angles = {}
        velocities = {}
        accelerations = {}
        
        for joint, angles in angles_by_joint.items():
            if len(angles) >= self.window_size:
                # Smooth angles
                filtered = savgol_filter(angles, self.window_size, 2)
                filtered_angles[joint] = filtered
                
                # Calculate velocities (1st derivative)
                velocity = savgol_filter(angles, self.window_size, 2, deriv=1)
                velocities[joint] = velocity
                
                # Calculate accelerations (2nd derivative)
                acceleration = savgol_filter(angles, self.window_size, 2, deriv=2)
                accelerations[joint] = acceleration
                
        # Detect movement phases
        phases = []
        for joint, velocity in velocities.items():
            if joint not in filtered_angles:
                continue
                
            # Find velocity peaks for phase detection
            pos_peaks, _ = find_peaks(velocity, prominence=self.peak_prominence)
            neg_peaks, _ = find_peaks(-velocity, prominence=self.peak_prominence)
            
            # Combine and sort all peaks
            all_peaks = np.sort(np.concatenate([pos_peaks, neg_peaks]))
            
            # Detect phases between peaks
            for i in range(len(all_peaks) - 1):
                start_idx = all_peaks[i]
                end_idx = all_peaks[i + 1]
                
                if end_idx - start_idx < self.min_phase_frames:
                    continue
                    
                # Calculate phase metrics
                phase_velocity = velocity[start_idx:end_idx]
                phase_angles = filtered_angles[joint][start_idx:end_idx]
                
                # Determine phase type based on velocity
                avg_velocity = np.mean(phase_velocity)
                if abs(avg_velocity) < self.velocity_threshold:
                    phase_type = "isometric"
                elif avg_velocity > 0:
                    phase_type = "concentric"
                else:
                    phase_type = "eccentric"
                    
                # Calculate phase confidence based on:
                # 1. Velocity consistency
                velocity_consistency = 1.0 / (1.0 + np.std(phase_velocity))
                
                # 2. Angle range coverage (if target angles provided)
                angle_confidence = 1.0
                if target_angles and joint in target_angles:
                    min_target, max_target = target_angles[joint]
                    min_angle, max_angle = np.min(phase_angles), np.max(phase_angles)
                    angle_coverage = (max_angle - min_angle) / (max_target - min_target)
                    angle_confidence = min(1.0, angle_coverage)
                
                # 3. Acceleration smoothness
                if joint in accelerations:
                    phase_acceleration = accelerations[joint][start_idx:end_idx]
                    smoothness = 1.0 / (1.0 + np.std(phase_acceleration))
                else:
                    smoothness = 1.0
                    
                # Combine confidence metrics
                phase_confidence = np.mean([velocity_consistency, angle_confidence, smoothness])
                
                phases.append(MovementPhase(
                    name=phase_type,
                    confidence=float(phase_confidence),
                    start_frame=int(start_idx),
                    end_frame=int(end_idx),
                    peak_velocity=float(np.max(np.abs(phase_velocity))),
                    avg_velocity=float(avg_velocity)
                ))
                
        # Count reps based on phase transitions
        rep_count = 0
        rep_confidences = []
        
        for i in range(len(phases) - 1):
            current_phase = phases[i]
            next_phase = phases[i + 1]
            
            # A rep is completed when we transition from concentric to eccentric
            if current_phase.name == "concentric" and next_phase.name == "eccentric":
                rep_count += 1
                rep_confidences.append((current_phase.confidence + next_phase.confidence) / 2)
                
        # Calculate rhythm score if beats provided
        rhythm_score = None
        if beat_timestamps and rep_count > 0:
            rhythm_score = self._calculate_rhythm_score(phases, beat_timestamps)
            
        # Calculate overall confidence
        confidence = np.mean(rep_confidences) if rep_confidences else 0.0
        
        return RepCount(
            count=rep_count,
            confidence=float(confidence),
            phases=phases,
            rhythm_score=rhythm_score
        )
        
    def _calculate_angle_sequences(
        self,
        normalized_frames: List[NormalizedPose],
        joint_triplets: List[Tuple[str, str, str]]
    ) -> Dict[str, List[float]]:
        """Calculate angle sequences for each joint triplet."""
        angles_by_joint = {}
        
        for start_joint, mid_joint, end_joint in joint_triplets:
            angles = []
            for frame in normalized_frames:
                landmarks = frame.landmarks
                if all(j in landmarks for j in [start_joint, mid_joint, end_joint]):
                    angle = calculate_angle(
                        landmarks[start_joint][:2],
                        landmarks[mid_joint][:2],
                        landmarks[end_joint][:2]
                    )
                    angles.append(angle)
            if angles:
                angles_by_joint[mid_joint] = angles
                
        return angles_by_joint
        
    def _calculate_rhythm_score(
        self,
        phases: List[MovementPhase],
        beat_timestamps: List[float]
    ) -> float:
        """Calculate how well the movement phases align with music beats."""
        if not phases or not beat_timestamps:
            return 0.0
            
        # Convert frame indices to timestamps (assuming 30fps)
        fps = 30.0
        phase_timestamps = []
        for phase in phases:
            start_time = phase.start_frame / fps
            end_time = phase.end_frame / fps
            phase_timestamps.append((start_time, end_time))
            
        # Calculate minimum time difference between phase transitions and beats
        min_time_diffs = []
        for start_time, end_time in phase_timestamps:
            # Find closest beat to phase start
            start_diffs = [abs(start_time - beat) for beat in beat_timestamps]
            min_time_diffs.append(min(start_diffs))
            
            # Find closest beat to phase end
            end_diffs = [abs(end_time - beat) for beat in beat_timestamps]
            min_time_diffs.append(min(end_diffs))
            
        # Convert time differences to scores (closer to beat = higher score)
        # Allow up to 0.2s deviation from beat
        max_deviation = 0.2
        scores = [max(0.0, 1.0 - diff/max_deviation) for diff in min_time_diffs]
        
        return float(np.mean(scores)) 