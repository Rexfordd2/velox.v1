from __future__ import annotations
try:
    import cv2  # type: ignore
except Exception:  # pragma: no cover
    cv2 = None  # type: ignore
import numpy as np
try:
    import mediapipe as mp  # type: ignore
except Exception:  # pragma: no cover
    mp = None  # type: ignore
import time
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass
from collections import deque
import logging
from .error_handling import (
    PoseDetectionError, LowConfidenceError, InvalidFrameError,
    NoLandmarksDetectedError, ProcessingTimeoutError,
    exponential_backoff, fallback_enabled, log_execution_time
)

# Image processing configuration
IMAGE_PROCESSING_CONFIG = {
    'target_size': (256, 256),  # Optimal size for pose detection
    'max_dimension': 1080,  # Maximum dimension for any input
    'jpeg_quality': 90,  # JPEG compression quality
    'enable_gpu': True,  # Use GPU acceleration when available
    'batch_size': 4,  # Process frames in batches
    'cache_size': 5,  # Number of frames to cache
    'brightness_threshold': 0.3,  # Minimum brightness threshold
    'contrast_limit': 3.0,  # CLAHE contrast limit
    'grid_size': (8, 8)  # CLAHE grid size
}

# TODO-MVP: Add camera calibration system for accurate velocity measurements
# TODO-MVP: Implement multi-angle pose detection for improved accuracy
# TODO-MVP: Add confidence thresholds for pose normalization

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPPORTED_EXERCISES = ['squat', 'pushup', 'deadlift']
MIN_CONFIDENCE_THRESHOLD = 0.5
PROCESSING_TIMEOUT = 5.0  # seconds

@dataclass
class ProcessingMetrics:
    frame_count: int = 0
    processed_frames: int = 0
    skipped_frames: int = 0
    processing_times: List[float] = None
    confidence_scores: List[float] = None
    failures: int = 0
    
    def __post_init__(self):
        self.processing_times = []
        self.confidence_scores = []
    
    def add_processing_time(self, time_ms: float):
        self.processing_times.append(time_ms)
    
    def add_confidence_score(self, score: float):
        self.confidence_scores.append(score)
    
    def compute_averages(self) -> Dict:
        return {
            'avg_processing_time': np.mean(self.processing_times) if self.processing_times else 0,
            'avg_confidence': np.mean(self.confidence_scores) if self.confidence_scores else 0,
            'frame_processing_rate': self.processed_frames / self.frame_count if self.frame_count else 0,
            'failure_rate': self.failures / self.frame_count if self.frame_count else 0
        }

class ImageProcessor:
    def __init__(self):
        if cv2 is None:
            self.clahe = None
        else:
            self.clahe = cv2.createCLAHE(
                clipLimit=IMAGE_PROCESSING_CONFIG['contrast_limit'],
                tileGridSize=IMAGE_PROCESSING_CONFIG['grid_size']
            )
        self.frame_cache = deque(maxlen=IMAGE_PROCESSING_CONFIG['cache_size'])
        
        # Initialize GPU context if available
        if IMAGE_PROCESSING_CONFIG['enable_gpu'] and cv2 is not None:
            try:
                cv2.cuda.setDevice(0)
                self.use_gpu = True
                self.gpu_stream = cv2.cuda.Stream()
            except:
                self.use_gpu = False
                logging.warning("GPU acceleration not available, falling back to CPU")
    
    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Optimize frame for pose detection."""
        try:
            # Validate frame
            if frame is None or frame.size == 0:
                raise InvalidFrameError("Invalid frame data")
            
            if cv2 is None:
                return frame

            # Resize if needed
            h, w = frame.shape[:2]
            if max(h, w) > IMAGE_PROCESSING_CONFIG['max_dimension']:
                scale = IMAGE_PROCESSING_CONFIG['max_dimension'] / max(h, w)
                new_size = (int(w * scale), int(h * scale))
                frame = cv2.resize(frame, new_size)
            
            # Convert to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Enhance low light conditions
            if self._needs_enhancement(frame_rgb):
                frame_rgb = self._enhance_frame(frame_rgb)
            
            # Resize to target size
            frame_rgb = cv2.resize(frame_rgb, IMAGE_PROCESSING_CONFIG['target_size'])
            
            # Cache frame
            self.frame_cache.append(frame_rgb)
            
            return frame_rgb
            
        except Exception as e:
            logging.error(f"Frame preprocessing failed: {str(e)}")
            raise InvalidFrameError(f"Frame preprocessing failed: {str(e)}")
    
    def _needs_enhancement(self, frame: np.ndarray) -> bool:
        """Check if frame needs brightness/contrast enhancement."""
        if cv2 is None:
            return False
        # Convert to LAB color space
        lab = cv2.cvtColor(frame, cv2.COLOR_RGB2LAB)
        l_channel = lab[:,:,0]
        
        # Calculate average brightness
        avg_brightness = np.mean(l_channel) / 255.0
        return avg_brightness < IMAGE_PROCESSING_CONFIG['brightness_threshold']
    
    def _enhance_frame(self, frame: np.ndarray) -> np.ndarray:
        """Enhance frame quality."""
        if cv2 is None:
            return frame
        if self.use_gpu:
            return self._enhance_frame_gpu(frame)
        return self._enhance_frame_cpu(frame)
    
    def _enhance_frame_cpu(self, frame: np.ndarray) -> np.ndarray:
        """CPU-based frame enhancement."""
        if cv2 is None or self.clahe is None:
            return frame
        # Convert to LAB color space
        lab = cv2.cvtColor(frame, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L channel
        cl = self.clahe.apply(l)
        
        # Merge channels
        enhanced_lab = cv2.merge((cl, a, b))
        
        # Convert back to RGB
        return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2RGB)
    
    def _enhance_frame_gpu(self, frame: np.ndarray) -> np.ndarray:
        """GPU-accelerated frame enhancement."""
        if cv2 is None:
            return frame
        try:
            # Upload to GPU
            gpu_frame = cv2.cuda_GpuMat(frame)
            
            # Convert to LAB
            gpu_lab = cv2.cuda.cvtColor(gpu_frame, cv2.COLOR_RGB2LAB, stream=self.gpu_stream)
            
            # Split channels
            gpu_channels = cv2.cuda.split(gpu_lab)
            
            # Apply CLAHE
            gpu_cl = cv2.cuda.createCLAHE(
                clipLimit=IMAGE_PROCESSING_CONFIG['contrast_limit'],
                tileGridSize=IMAGE_PROCESSING_CONFIG['grid_size']
            ).apply(gpu_channels[0], stream=self.gpu_stream)
            
            # Merge channels
            gpu_enhanced = cv2.cuda.merge([gpu_cl, gpu_channels[1], gpu_channels[2]])
            
            # Convert back to RGB
            gpu_result = cv2.cuda.cvtColor(gpu_enhanced, cv2.COLOR_LAB2RGB, stream=self.gpu_stream)
            
            # Download result
            return gpu_result.download()
            
        except Exception as e:
            logging.warning(f"GPU enhancement failed, falling back to CPU: {str(e)}")
            return self._enhance_frame_cpu(frame)

class PoseDetector:
    def __init__(self, 
                 model_complexity: int = 1,
                 min_detection_confidence: float = 0.7,
                 min_tracking_confidence: float = 0.7,
                 enable_frame_skipping: bool = True,
                 frame_buffer_size: int = 5,
                 calibration: Optional[Dict] = None):
        """Initialize pose detector with optimized settings."""
        try:
            self.mp_pose = mp.solutions.pose if mp is not None else None
            self.pose = None if self.mp_pose is None else self.mp_pose.Pose(
                    static_image_mode=False,
                    model_complexity=model_complexity,
                    min_detection_confidence=min_detection_confidence,
                    min_tracking_confidence=min_tracking_confidence
                )
            
            self.enable_frame_skipping = enable_frame_skipping
            self.frame_buffer = deque(maxlen=frame_buffer_size)
            self.metrics = ProcessingMetrics()
            self.last_successful_pose = None
            self.consecutive_failures = 0
            self.image_processor = ImageProcessor()
            # Optional calibration info: {'pixelsPerMeter': float, 'homography': [...], 'tiltDeg': float}
            self.calibration: Optional[Dict] = calibration if isinstance(calibration, dict) else None
            
        except Exception as e:
            logging.error(f"Failed to initialize MediaPipe Pose: {str(e)}")
            raise PoseDetectionError(f"Pose detector initialization failed: {str(e)}")

    def set_calibration(self, calibration: Optional[Dict]):
        """Update calibration parameters used during normalization/blending."""
        if calibration is not None and not isinstance(calibration, dict):
            raise ValueError("calibration must be dict or None")
        self.calibration = calibration
    
    def validate_frame(self, frame: np.ndarray) -> None:
        """Validate frame data before processing."""
        if frame is None:
            raise InvalidFrameError("Frame is None")
        if not isinstance(frame, np.ndarray):
            raise InvalidFrameError("Frame must be a numpy array")
        if frame.size == 0:
            raise InvalidFrameError("Frame is empty")
        if len(frame.shape) != 3:
            raise InvalidFrameError("Frame must be a 3D array (height, width, channels)")
            
    @log_execution_time
    def detect_pose(self, frame: np.ndarray, frame_number: int) -> Tuple[Optional[mp.solutions.pose.PoseLandmarkList], float]:
        """Detect pose in frame with performance optimizations."""
        self.metrics.frame_count += 1
        
        try:
            # Preprocess frame
            processed_frame = self.image_processor.preprocess_frame(frame)
            
            # Check if we should skip this frame
            if self.should_skip_frame(frame_number):
                self.metrics.skipped_frames += 1
                if self.last_successful_pose is None:
                    raise NoLandmarksDetectedError("No previous pose available for skipped frame")
                return self.last_successful_pose, self.metrics.confidence_scores[-1] if self.metrics.confidence_scores else 0
            
            # Set processing timeout
            start_time = time.time()
            
            # Detect pose
            if self.pose is None:
                raise PoseDetectionError("Pose model not available")
            results = self.pose.process(processed_frame)
            
            # Check processing time
            if time.time() - start_time > PROCESSING_TIMEOUT:
                raise ProcessingTimeoutError(f"Pose detection exceeded timeout of {PROCESSING_TIMEOUT}s")
            
            if results.pose_landmarks:
                self.metrics.processed_frames += 1
                self.consecutive_failures = 0
                
                # Calculate confidence score
                confidence = sum(lm.visibility for lm in results.pose_landmarks.landmark) / len(results.pose_landmarks.landmark)
                
                # Check confidence threshold
                if confidence < MIN_CONFIDENCE_THRESHOLD:
                    raise LowConfidenceError(f"Low confidence score: {confidence:.2f}")
                
                self.metrics.add_confidence_score(confidence)
                self.last_successful_pose = results.pose_landmarks
                self.frame_buffer.append(frame_number)
                
                return results.pose_landmarks, confidence
                
            else:
                raise NoLandmarksDetectedError("No pose landmarks detected in frame")
                
        except Exception as e:
            self.metrics.failures += 1
            self.consecutive_failures += 1
            logging.error(f"Error processing frame {frame_number}: {str(e)}")
            raise PoseDetectionError(f"Pose detection failed: {str(e)}")
            
    def should_skip_frame(self, frame_number: int) -> bool:
        """Determine if frame should be skipped based on motion and performance."""
        if not self.enable_frame_skipping or len(self.frame_buffer) < 2:
            return False
            
        # Skip every other frame if we have good tracking
        if self.consecutive_failures == 0 and frame_number % 2 == 0:
            return True
            
        # Calculate motion between frames
        prev_frame = self.frame_buffer[-1]
        curr_frame = frame_number
        motion = abs(curr_frame - prev_frame)
        
        # Skip if motion is minimal
        return motion < 0.1
        
    @exponential_backoff(max_retries=3, base_delay=0.1, max_delay=2.0)
    @fallback_enabled(fallback_func='fallback_detection')
    @log_execution_time
    def detect_pose(self, frame: np.ndarray, frame_number: int) -> Tuple[Optional[mp.solutions.pose.PoseLandmarkList], float]:
        """
        Detect pose in frame with performance optimizations.
        
        Args:
            frame: Input frame
            frame_number: Current frame number
        
        Returns:
            Tuple of (landmarks, confidence_score)
        """
        self.metrics.frame_count += 1
        
        try:
            # Validate and preprocess frame
            self.validate_frame(frame)
            processed_frame = self.preprocess_frame(frame)
            
            # Check if we should skip this frame
            if self.should_skip_frame(frame_number):
                self.metrics.skipped_frames += 1
                if self.last_successful_pose is None:
                    raise NoLandmarksDetectedError("No previous pose available for skipped frame")
                return self.last_successful_pose, self.metrics.confidence_scores[-1] if self.metrics.confidence_scores else 0
            
            # Set processing timeout
            start_time = time.time()
            
            # Detect pose
            results = self.pose.process(processed_frame)
            
            # Check processing time
            if time.time() - start_time > PROCESSING_TIMEOUT:
                raise ProcessingTimeoutError(f"Pose detection exceeded timeout of {PROCESSING_TIMEOUT}s")
            
            if results.pose_landmarks:
                self.metrics.processed_frames += 1
                self.consecutive_failures = 0
                
                # Calculate confidence score
                confidence = sum(lm.visibility for lm in results.pose_landmarks.landmark) / len(results.pose_landmarks.landmark)
                
                # Check confidence threshold
                if confidence < MIN_CONFIDENCE_THRESHOLD:
                    raise LowConfidenceError(f"Low confidence score: {confidence:.2f}")
                
                self.metrics.add_confidence_score(confidence)
                self.last_successful_pose = results.pose_landmarks
                self.frame_buffer.append(frame_number)
                
                logger.debug(f"Frame {frame_number} processed successfully. Confidence: {confidence:.2f}")
                return results.pose_landmarks, confidence
                
            else:
                raise NoLandmarksDetectedError("No pose landmarks detected in frame")
                
        except Exception as e:
            self.metrics.failures += 1
            self.consecutive_failures += 1
            logger.error(f"Error processing frame {frame_number}: {str(e)}")
            raise PoseDetectionError(f"Pose detection failed: {str(e)}")
            
    @log_execution_time
    def fallback_detection(self, frame: np.ndarray) -> Tuple[Optional[mp.solutions.pose.PoseLandmarkList], float]:
        """Fallback detection method for challenging frames."""
        try:
            logger.info("Attempting fallback detection with enhanced preprocessing...")
            
            # Try with different preprocessing
            enhanced_frame = self.enhance_frame_quality(frame)
            results = self.pose.process(enhanced_frame)
            
            if results.pose_landmarks:
                confidence = sum(lm.visibility for lm in results.pose_landmarks.landmark) / len(results.pose_landmarks.landmark)
                logger.info(f"Fallback detection succeeded with confidence: {confidence:.2f}")
                return results.pose_landmarks, confidence
                
            raise NoLandmarksDetectedError("Fallback detection failed to detect landmarks")
            
        except Exception as e:
            logger.error(f"Fallback detection failed: {str(e)}")
            # Return last successful pose if available, otherwise raise
            if self.last_successful_pose:
                logger.warning("Using last successful pose as ultimate fallback")
                return self.last_successful_pose, 0.5
            raise
            
    @log_execution_time
    def enhance_frame_quality(self, frame: np.ndarray) -> np.ndarray:
        """Enhance frame quality for better detection."""
        try:
            # Convert to LAB color space
            lab = cv2.cvtColor(frame, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            cl = clahe.apply(l)
            
            # Merge channels
            enhanced = cv2.merge((cl,a,b))
            
            # Convert back to RGB
            enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)
            
            return enhanced_rgb
            
        except Exception as e:
            logger.error(f"Frame quality enhancement failed: {str(e)}")
            return frame  # Return original frame if enhancement fails
            
    def get_performance_metrics(self) -> Dict:
        """Get current performance metrics."""
        metrics = self.metrics.compute_averages()
        metrics.update({
            'total_frames': self.metrics.frame_count,
            'processed_frames': self.metrics.processed_frames,
            'skipped_frames': self.metrics.skipped_frames,
            'failures': self.metrics.failures,
            'consecutive_failures': self.consecutive_failures
        })
        return metrics
        
    def reset_metrics(self):
        """Reset performance metrics."""
        self.metrics = ProcessingMetrics()
        self.consecutive_failures = 0
        logger.info("Performance metrics reset")
        
    def process_video(self, video_path: str) -> List[Dict]:
        """Process video file with optimized batch processing."""
        cap = cv2.VideoCapture(video_path)
        frame_landmarks = []
        batch_frames = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Add frame to batch
            batch_frames.append(frame)
            
            # Process batch when full
            if len(batch_frames) == IMAGE_PROCESSING_CONFIG['batch_size']:
                batch_results = self._process_batch(batch_frames)
                frame_landmarks.extend(batch_results)
                batch_frames = []
        
        # Process remaining frames
        if batch_frames:
            batch_results = self._process_batch(batch_frames)
            frame_landmarks.extend(batch_results)
        
        cap.release()
        return frame_landmarks
    
    def _process_batch(self, frames: List[np.ndarray]) -> List[Dict]:
        """Process a batch of frames efficiently."""
        results = []
        for i, frame in enumerate(frames):
            try:
                landmarks, _ = self.detect_pose(frame, len(results))
                if landmarks:
                    results.append(landmarks)
            except Exception as e:
                logging.warning(f"Failed to process frame in batch: {str(e)}")
                continue
        return results
        
    def calculate_angles(self, landmarks: Dict) -> Dict[str, float]:
        """
        Calculate joint angles from pose landmarks.
        
        Args:
            landmarks: Dictionary of pose landmarks
            
        Returns:
            Dictionary of joint angles
        """
        angles = {}
        
        # Example: Calculate knee angle
        if all(k in landmarks for k in [23, 25, 27]):  # Left knee
            hip = np.array([landmarks[23]['x'], landmarks[23]['y']])
            knee = np.array([landmarks[25]['x'], landmarks[25]['y']])
            ankle = np.array([landmarks[27]['x'], landmarks[27]['y']])
            angles['left_knee'] = self._calculate_angle(hip, knee, ankle)
            
        if all(k in landmarks for k in [24, 26, 28]):  # Right knee
            hip = np.array([landmarks[24]['x'], landmarks[24]['y']])
            knee = np.array([landmarks[26]['x'], landmarks[26]['y']])
            ankle = np.array([landmarks[28]['x'], landmarks[28]['y']])
            angles['right_knee'] = self._calculate_angle(hip, knee, ankle)
            
        return angles
        
    def _calculate_angle(self, a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
        """
        Calculate the angle between three points.
        
        Args:
            a: First point
            b: Middle point
            c: Last point
            
        Returns:
            Angle in degrees
        """
        ba = a - b
        bc = c - b
        
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
        angle = np.arccos(cosine_angle)
        
        return np.degrees(angle) 

# ------------------------
# Pose normalization helpers
# ------------------------

def _extract_point(landmarks: Dict, key: int, fallback_key: str = None) -> Optional[np.ndarray]:
    """
    Extract a 2D point [x, y] and optional confidence from a landmarks dict that
    may be keyed by integer indices (MediaPipe) or strings.
    """
    if landmarks is None:
        return None
    value = None
    if key in landmarks:
        value = landmarks[key]
    elif fallback_key and fallback_key in landmarks:
        value = landmarks[fallback_key]
    if value is None:
        return None
    # Support dicts with x/y or arrays [x, y, (z), (visibility)]
    if isinstance(value, dict):
        x = float(value.get('x', 0.0))
        y = float(value.get('y', 0.0))
        v = float(value.get('visibility', value.get('confidence', 1.0)))
        return np.array([x, y, v], dtype=float)
    arr = np.array(value, dtype=float)
    if arr.size == 0:
        return None
    if arr.size == 1:
        return np.array([arr[0], 0.0, 1.0], dtype=float)
    if arr.size == 2:
        return np.array([arr[0], arr[1], 1.0], dtype=float)
    # [x, y, visibility, ...]
    return np.array([arr[0], arr[1], arr[2] if arr.size > 2 else 1.0], dtype=float)


def normalize_pose(landmarks: Dict) -> Dict:
    """
    Center at pelvis midpoint (hip center), rotate so body axis (shoulder→hip)
    aligns with vertical, and scale by shoulder width. Returns a new landmarks dict
    with normalized x,y; preserves other fields if present.

    Landmarks may be keyed by MediaPipe indices or by string names.
    """
    # MediaPipe indices
    LEFT_SHOULDER, RIGHT_SHOULDER = 11, 12
    LEFT_HIP, RIGHT_HIP = 23, 24

    l_sh = _extract_point(landmarks, LEFT_SHOULDER, 'left_shoulder')
    r_sh = _extract_point(landmarks, RIGHT_SHOULDER, 'right_shoulder')
    l_hip = _extract_point(landmarks, LEFT_HIP, 'left_hip')
    r_hip = _extract_point(landmarks, RIGHT_HIP, 'right_hip')

    if any(p is None for p in [l_sh, r_sh, l_hip, r_hip]):
        return landmarks

    shoulder_center = (l_sh[:2] + r_sh[:2]) / 2.0
    hip_center = (l_hip[:2] + r_hip[:2]) / 2.0
    pelvis = hip_center

    # Body axis vector from shoulders to hips
    axis = hip_center - shoulder_center
    axis_norm = np.linalg.norm(axis)
    if axis_norm < 1e-6:
        return landmarks

    # Rotation to align axis with +Y (image coordinates typically downwards, but canonical vertical)
    # Angle between axis and +Y is atan2(ax, ay); rotate by -that to align to Y
    angle = np.arctan2(axis[0], axis[1])
    cos_t = np.cos(-angle)
    sin_t = np.sin(-angle)
    R = np.array([[cos_t, -sin_t], [sin_t, cos_t]])

    # Scale by shoulder width
    shoulder_width = np.linalg.norm(l_sh[:2] - r_sh[:2])
    if shoulder_width < 1e-6:
        return landmarks
    scale = 1.0 / shoulder_width

    def _transform_point(val):
        if isinstance(val, dict):
            x = float(val.get('x', 0.0))
            y = float(val.get('y', 0.0))
            rest = {k: v for k, v in val.items() if k not in ('x', 'y')}
            p = np.array([x, y])
            p = (R @ (p - pelvis)) * scale
            return {**rest, 'x': float(p[0]), 'y': float(p[1])}
        arr = np.array(val, dtype=float)
        if arr.size < 2:
            return val
        p = (R @ (arr[:2] - pelvis)) * scale
        out = arr.copy()
        out[0], out[1] = p[0], p[1]
        return out

    normalized = {}
    for k, v in landmarks.items():
        normalized[k] = _transform_point(v)
    return normalized


def multiAngleBlend(poses_from_views: List[Dict]) -> Dict:
    """
    Merge multiple pose landmark dicts by joint-confidence weighting.
    For each joint, compute weighted average of (x,y) using visibility/confidence.
    """
    if not poses_from_views:
        return {}

    # Collect all keys
    all_keys = set()
    for pose in poses_from_views:
        all_keys.update(pose.keys())

    blended: Dict = {}
    for key in all_keys:
        sum_x = 0.0
        sum_y = 0.0
        sum_w = 0.0
        vis_list = []
        last_sample = None
        for pose in poses_from_views:
            if key not in pose:
                continue
            val = pose[key]
            last_sample = val
            if isinstance(val, dict):
                x = float(val.get('x', 0.0))
                y = float(val.get('y', 0.0))
                w = float(val.get('visibility', val.get('confidence', 1.0)))
                sum_x += w * x
                sum_y += w * y
                sum_w += w
                vis_list.append(w)
            else:
                arr = np.array(val, dtype=float)
                if arr.size >= 2:
                    x, y = float(arr[0]), float(arr[1])
                    w = float(arr[2]) if arr.size > 2 else 1.0
                    sum_x += w * x
                    sum_y += w * y
                    sum_w += w
                    vis_list.append(w)
        if sum_w > 0:
            x_blend = sum_x / sum_w
            y_blend = sum_y / sum_w
            avg_vis = float(np.mean(vis_list)) if vis_list else 1.0
            if isinstance(last_sample, dict):
                out = dict(last_sample)
                out['x'] = x_blend
                out['y'] = y_blend
                if 'visibility' in out:
                    out['visibility'] = avg_vis
                blended[key] = out
            else:
                arr = np.array(last_sample, dtype=float)
                if arr.size >= 2:
                    arr_out = arr.copy()
                    arr_out[0] = x_blend
                    arr_out[1] = y_blend
                    if arr_out.size > 2:
                        arr_out[2] = avg_vis
                    blended[key] = arr_out
        elif last_sample is not None:
            blended[key] = last_sample
    return blended

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
def _results_to_landmarks_dict(results_landmarks) -> Dict:
    """Convert MediaPipe landmarks to a landmarks dict keyed by index with x,y,visibility."""
    if results_landmarks is None:
        return {}
    out: Dict = {}
    try:
        for idx, lm in enumerate(results_landmarks.landmark):
            out[idx] = { 'x': float(lm.x), 'y': float(lm.y), 'visibility': float(getattr(lm, 'visibility', 1.0)) }
    except Exception:
        # Already in dict form
        return results_landmarks
    return out

def _avg_visibility(landmarks: Dict, keys: List[int]) -> float:
    vals = []
    for k in keys:
        v = landmarks.get(k)
        if isinstance(v, dict):
            vals.append(float(v.get('visibility', 1.0)))
    return float(np.mean(vals)) if vals else 0.0

class PoseDetector(PoseDetector):  # extend with multi-view utilities
    def detect_pose_multi(self, frames: List[np.ndarray], frame_number: int) -> Tuple[Dict, float]:
        """
        Detect pose from multiple synchronized frames (views), normalize per-view,
        and blend landmarks using confidence-weighted averaging.
        Returns blended landmarks dict and aggregated confidence.
        """
        if not frames:
            return {}, 0.0
        per_view: List[Dict] = []
        confidences: List[float] = []
        for i, f in enumerate(frames):
            try:
                lm, conf = self.detect_pose(f, frame_number + i)
                confidences.append(conf)
                if lm is None:
                    continue
                lm_dict = _results_to_landmarks_dict(lm)
                # Confidence gate for normalization
                vis = _avg_visibility(lm_dict, [11,12,23,24])  # shoulders/hips
                if vis >= MIN_CONFIDENCE_THRESHOLD:
                    lm_dict = normalize_pose(lm_dict)
                per_view.append(lm_dict)
            except Exception as e:
                logger.warning(f"Multi-view detection failed on view {i}: {e}")
                continue
        if not per_view:
            return {}, 0.0
        blended = multiAngleBlend(per_view)
        agg_conf = float(np.mean(confidences)) if confidences else 0.0
        return blended, agg_conf