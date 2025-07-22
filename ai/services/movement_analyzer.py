from typing import List, Dict, Tuple, Optional
import numpy as np
from dataclasses import dataclass
from enum import Enum
import logging
from .error_handling import (
    PoseDetectionError, LowConfidenceError, InvalidFrameError,
    NoLandmarksDetectedError, ProcessingTimeoutError,
    exponential_backoff, fallback_enabled, log_execution_time
)

logger = logging.getLogger(__name__)

class ExerciseType(Enum):
    SQUAT = "squat"
    DEADLIFT = "deadlift"
    PUSHUP = "pushup"

@dataclass
class ExerciseMetrics:
    depth: float
    form_score: float
    rep_count: int
    tempo: float
    stability: float
    confidence: float = 0.0
    error_message: Optional[str] = None

class MovementAnalyzer:
    def __init__(self):
        self.exercise_rules = {
            ExerciseType.SQUAT: {
                'min_depth': 90,  # degrees
                'max_depth': 120,  # degrees
                'knee_alignment': 5,  # degrees tolerance
                'back_angle': 45,  # degrees
                'required_joints': [23, 25, 27, 24, 26, 28, 11, 12]  # hips, knees, ankles, shoulders
            },
            ExerciseType.DEADLIFT: {
                'back_angle': 45,  # degrees
                'hip_angle': 90,  # degrees
                'knee_angle': 120,  # degrees
                'required_joints': [11, 12, 23, 24, 25, 26, 27, 28]  # shoulders, hips, knees, ankles
            },
            ExerciseType.PUSHUP: {
                'elbow_angle': 90,  # degrees
                'body_alignment': 5,  # degrees tolerance
                'required_joints': [11, 12, 13, 14, 23, 24]  # shoulders, elbows, hips
            }
        }
        
    def validate_exercise_type(self, exercise_type: str) -> None:
        """Validate that the exercise type is supported."""
        try:
            ExerciseType(exercise_type)
        except ValueError:
            raise ValueError(f"Unsupported exercise type: {exercise_type}. Supported types: {[e.value for e in ExerciseType]}")
            
    def validate_landmarks_sequence(self, landmarks_sequence: List[Dict], required_joints: List[int]) -> None:
        """Validate that the landmarks sequence contains required joints."""
        if not landmarks_sequence:
            raise InvalidFrameError("Empty landmarks sequence")
            
        for i, landmarks in enumerate(landmarks_sequence):
            missing_joints = [j for j in required_joints if j not in landmarks]
            if missing_joints:
                raise NoLandmarksDetectedError(
                    f"Frame {i} missing required joints: {missing_joints}"
                )
                
    @exponential_backoff(max_retries=3, base_delay=0.1, max_delay=2.0)
    @log_execution_time
    def analyze_movement(self, landmarks_sequence: List[Dict], exercise_type: str) -> Tuple[ExerciseMetrics, List[str]]:
        """
        Analyze a sequence of pose landmarks for a specific exercise.
        
        Args:
            landmarks_sequence: List of pose landmarks for each frame
            exercise_type: Type of exercise being performed
            
        Returns:
            Tuple of (metrics, feedback)
        """
        try:
            # Validate inputs
            self.validate_exercise_type(exercise_type)
            exercise = ExerciseType(exercise_type)
            rules = self.exercise_rules[exercise]
            
            # Validate landmarks
            self.validate_landmarks_sequence(landmarks_sequence, rules['required_joints'])
            
            # Calculate metrics
            metrics = self._calculate_metrics(landmarks_sequence, exercise)
            
            # Generate feedback
            feedback = self._generate_feedback(metrics, rules, exercise)
            
            return metrics, feedback
            
        except Exception as e:
            logger.error(f"Movement analysis failed: {str(e)}")
            # Return empty metrics with error message
            metrics = ExerciseMetrics(
                depth=0.0,
                form_score=0.0,
                rep_count=0,
                tempo=0.0,
                stability=0.0,
                confidence=0.0,
                error_message=str(e)
            )
            return metrics, [f"Analysis failed: {str(e)}"]
            
    def _calculate_metrics(self, landmarks_sequence: List[Dict], exercise: ExerciseType) -> ExerciseMetrics:
        """Calculate exercise-specific metrics from pose landmarks."""
        try:
            if exercise == ExerciseType.SQUAT:
                return self._calculate_squat_metrics(landmarks_sequence)
            elif exercise == ExerciseType.DEADLIFT:
                return self._calculate_deadlift_metrics(landmarks_sequence)
            elif exercise == ExerciseType.PUSHUP:
                return self._calculate_pushup_metrics(landmarks_sequence)
            else:
                raise ValueError(f"Metrics calculation not implemented for {exercise.value}")
                
        except Exception as e:
            logger.error(f"Metrics calculation failed for {exercise.value}: {str(e)}")
            raise
            
    @log_execution_time
    def _calculate_squat_metrics(self, landmarks_sequence: List[Dict]) -> ExerciseMetrics:
        """Calculate metrics specific to squat exercise."""
        try:
            depths = []
            knee_angles = []
            back_angles = []
            
            for landmarks in landmarks_sequence:
                # Calculate knee angles
                if all(k in landmarks for k in [23, 25, 27]):  # Left knee
                    hip = np.array([landmarks[23]['x'], landmarks[23]['y']])
                    knee = np.array([landmarks[25]['x'], landmarks[25]['y']])
                    ankle = np.array([landmarks[27]['x'], landmarks[27]['y']])
                    knee_angle = self._calculate_angle(hip, knee, ankle)
                    knee_angles.append(knee_angle)
                    
                # Calculate back angle
                if all(k in landmarks for k in [11, 23, 25]):  # Using left side
                    shoulder = np.array([landmarks[11]['x'], landmarks[11]['y']])
                    hip = np.array([landmarks[23]['x'], landmarks[23]['y']])
                    knee = np.array([landmarks[25]['x'], landmarks[25]['y']])
                    back_angle = self._calculate_angle(shoulder, hip, knee)
                    back_angles.append(back_angle)
                    
            # Calculate metrics
            max_depth = max(knee_angles) if knee_angles else 0
            min_depth = min(knee_angles) if knee_angles else 0
            depth = max_depth - min_depth
            
            # Calculate stability (standard deviation of back angle)
            stability = np.std(back_angles) if back_angles else 0
            
            # Estimate rep count (number of complete depth cycles)
            rep_count = self._estimate_rep_count(knee_angles)
            
            # Calculate tempo (time per rep)
            tempo = len(landmarks_sequence) / rep_count if rep_count > 0 else 0
            
            # Calculate form score (0-100)
            form_score = self._calculate_form_score(
                depth=depth,
                stability=stability,
                back_angles=back_angles,
                knee_angles=knee_angles
            )
            
            # Calculate confidence
            confidence = min(1.0, form_score / 100)
            
            return ExerciseMetrics(
                depth=depth,
                form_score=form_score,
                rep_count=rep_count,
                tempo=tempo,
                stability=stability,
                confidence=confidence
            )
            
        except Exception as e:
            logger.error(f"Squat metrics calculation failed: {str(e)}")
            raise
            
    @log_execution_time
    def _calculate_deadlift_metrics(self, landmarks_sequence: List[Dict]) -> ExerciseMetrics:
        """Calculate metrics specific to deadlift exercise."""
        try:
            # Similar structure to squat metrics, but with deadlift-specific angles
            # TODO: Implement complete deadlift metrics
            hip_angles = []
            back_angles = []
            knee_angles = []
            
            for landmarks in landmarks_sequence:
                # Calculate relevant angles for deadlift
                if all(k in landmarks for k in [11, 23, 25]):  # Back angle
                    shoulder = np.array([landmarks[11]['x'], landmarks[11]['y']])
                    hip = np.array([landmarks[23]['x'], landmarks[23]['y']])
                    knee = np.array([landmarks[25]['x'], landmarks[25]['y']])
                    back_angle = self._calculate_angle(shoulder, hip, knee)
                    back_angles.append(back_angle)
                    
            # Basic metrics for now
            stability = np.std(back_angles) if back_angles else 0
            rep_count = self._estimate_rep_count(back_angles)
            tempo = len(landmarks_sequence) / rep_count if rep_count > 0 else 0
            form_score = 70.0  # Default score until fully implemented
            
            return ExerciseMetrics(
                depth=0.0,  # Not applicable for deadlift
                form_score=form_score,
                rep_count=rep_count,
                tempo=tempo,
                stability=stability,
                confidence=0.7  # Conservative estimate
            )
            
        except Exception as e:
            logger.error(f"Deadlift metrics calculation failed: {str(e)}")
            raise
            
    @log_execution_time
    def _calculate_pushup_metrics(self, landmarks_sequence: List[Dict]) -> ExerciseMetrics:
        """Calculate metrics specific to push-up exercise."""
        try:
            elbow_angles = []
            body_angles = []
            
            for landmarks in landmarks_sequence:
                # Calculate elbow angle
                if all(k in landmarks for k in [11, 13, 15]):  # Left arm
                    shoulder = np.array([landmarks[11]['x'], landmarks[11]['y']])
                    elbow = np.array([landmarks[13]['x'], landmarks[13]['y']])
                    wrist = np.array([landmarks[15]['x'], landmarks[15]['y']])
                    elbow_angle = self._calculate_angle(shoulder, elbow, wrist)
                    elbow_angles.append(elbow_angle)
                    
                # Calculate body alignment
                if all(k in landmarks for k in [11, 23, 27]):  # Left side
                    shoulder = np.array([landmarks[11]['x'], landmarks[11]['y']])
                    hip = np.array([landmarks[23]['x'], landmarks[23]['y']])
                    ankle = np.array([landmarks[27]['x'], landmarks[27]['y']])
                    body_angle = self._calculate_angle(shoulder, hip, ankle)
                    body_angles.append(body_angle)
                    
            # Calculate metrics
            min_elbow = min(elbow_angles) if elbow_angles else 0
            stability = np.std(body_angles) if body_angles else 0
            rep_count = self._estimate_rep_count(elbow_angles)
            tempo = len(landmarks_sequence) / rep_count if rep_count > 0 else 0
            
            # Calculate form score
            form_score = self._calculate_pushup_form_score(
                elbow_angles=elbow_angles,
                body_angles=body_angles
            )
            
            return ExerciseMetrics(
                depth=min_elbow,
                form_score=form_score,
                rep_count=rep_count,
                tempo=tempo,
                stability=stability,
                confidence=min(1.0, form_score / 100)
            )
            
        except Exception as e:
            logger.error(f"Push-up metrics calculation failed: {str(e)}")
            raise
            
    def _calculate_pushup_form_score(self, elbow_angles: List[float], body_angles: List[float]) -> float:
        """Calculate form score for push-ups."""
        if not elbow_angles or not body_angles:
            return 0.0
            
        # Score elbow angle (0-40 points)
        min_elbow = min(elbow_angles)
        elbow_score = max(0, 40 - abs(min_elbow - 90) * 0.5)
        
        # Score body alignment (0-40 points)
        avg_body_angle = np.mean(body_angles)
        alignment_score = max(0, 40 - abs(avg_body_angle - 180) * 0.5)
        
        # Score stability (0-20 points)
        stability = np.std(body_angles)
        stability_score = max(0, 20 - stability)
        
        return elbow_score + alignment_score + stability_score
        
    def _generate_feedback(self, metrics: ExerciseMetrics, rules: Dict, exercise: ExerciseType) -> List[Dict]:
        """Generate feedback based on exercise metrics and rules."""
        feedback = []
        
        try:
            if exercise == ExerciseType.SQUAT:
                if metrics.depth < rules['min_depth']:
                    feedback.append({
                        "msg": "Try to squat deeper",
                        "severity": 3
                    })
                elif metrics.depth > rules['max_depth']:
                    feedback.append({
                        "msg": "Don't squat too deep",
                        "severity": 4
                    })
                    
                if metrics.stability > 5:
                    feedback.append({
                        "msg": "Work on maintaining stability throughout the movement",
                        "severity": 3
                    })
                    
            elif exercise == ExerciseType.DEADLIFT:
                if metrics.stability > 5:
                    feedback.append({
                        "msg": "Keep your back straight throughout the movement",
                        "severity": 5  # Critical for safety
                    })
                    
            elif exercise == ExerciseType.PUSHUP:
                if metrics.depth > rules['elbow_angle']:
                    feedback.append({
                        "msg": "Lower your chest closer to the ground",
                        "severity": 2
                    })
                if metrics.stability > rules['body_alignment']:
                    feedback.append({
                        "msg": "Keep your body straight - don't let your hips sag",
                        "severity": 4
                    })
                    
            # Common feedback
            if metrics.form_score < 70:
                feedback.append({
                    "msg": "Focus on maintaining proper form",
                    "severity": 3
                })
            if metrics.confidence < 0.6:
                feedback.append({
                    "msg": "Some movements were difficult to analyze - try adjusting your position",
                    "severity": 2
                })
                
        except Exception as e:
            logger.error(f"Feedback generation failed: {str(e)}")
            feedback.append({
                "msg": "Unable to generate detailed feedback",
                "severity": 2
            })
            
        return feedback
        
    def _calculate_angle(self, a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
        """Calculate the angle between three points."""
        try:
            ba = a - b
            bc = c - b
            
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return np.degrees(angle)
            
        except Exception as e:
            logger.error(f"Angle calculation failed: {str(e)}")
            raise
            
    def _estimate_rep_count(self, angles: List[float], threshold: float = 100) -> int:
        """Estimate the number of repetitions based on angle cycles."""
        if not angles:
            return 0
            
        try:
            # Find peaks and valleys
            peaks = []
            valleys = []
            
            for i in range(1, len(angles) - 1):
                if angles[i] > angles[i-1] and angles[i] > angles[i+1]:
                    peaks.append(i)
                elif angles[i] < angles[i-1] and angles[i] < angles[i+1]:
                    valleys.append(i)
                    
            # Count complete cycles
            return min(len(peaks), len(valleys))
            
        except Exception as e:
            logger.error(f"Rep counting failed: {str(e)}")
            return 0
        
    def _calculate_form_score(self, depth: float, stability: float, back_angles: List[float], knee_angles: List[float]) -> float:
        """Calculate a form score from 0 to 100."""
        # Depth score (0-40)
        depth_score = min(40, (depth / 90) * 40)
        
        # Stability score (0-30)
        stability_score = max(0, 30 - (stability * 2))
        
        # Back angle score (0-30)
        back_angle_score = 0
        if back_angles:
            avg_back_angle = np.mean(back_angles)
            back_angle_score = max(0, 30 - abs(avg_back_angle - 45) * 0.5)
            
        return depth_score + stability_score + back_angle_score 