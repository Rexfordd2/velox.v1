import cv2
import numpy as np
import mediapipe as mp
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
        self.clahe = cv2.createCLAHE(
            clipLimit=IMAGE_PROCESSING_CONFIG['contrast_limit'],
            tileGridSize=IMAGE_PROCESSING_CONFIG['grid_size']
        )
        self.frame_cache = deque(maxlen=IMAGE_PROCESSING_CONFIG['cache_size'])
        
        # Initialize GPU context if available
        if IMAGE_PROCESSING_CONFIG['enable_gpu']:
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
        # Convert to LAB color space
        lab = cv2.cvtColor(frame, cv2.COLOR_RGB2LAB)
        l_channel = lab[:,:,0]
        
        # Calculate average brightness
        avg_brightness = np.mean(l_channel) / 255.0
        return avg_brightness < IMAGE_PROCESSING_CONFIG['brightness_threshold']
    
    def _enhance_frame(self, frame: np.ndarray) -> np.ndarray:
        """Enhance frame quality."""
        if self.use_gpu:
            return self._enhance_frame_gpu(frame)
        return self._enhance_frame_cpu(frame)
    
    def _enhance_frame_cpu(self, frame: np.ndarray) -> np.ndarray:
        """CPU-based frame enhancement."""
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
                 frame_buffer_size: int = 5):
        """Initialize pose detector with optimized settings."""
        try:
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(
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
            
        except Exception as e:
            logging.error(f"Failed to initialize MediaPipe Pose: {str(e)}")
            raise PoseDetectionError(f"Pose detector initialization failed: {str(e)}")
    
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