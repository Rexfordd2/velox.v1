from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
from datetime import datetime
import os
from dotenv import load_dotenv
import uuid
import tempfile
import shutil
import cv2
import numpy as np
from collections import defaultdict
import logging
import time
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import http_exception_handler

from services.pose_detector import PoseDetector
from services.movement_analyzer import MovementAnalyzer, ExerciseType
from config import get_settings

# Load environment variables and validated settings (fail fast on error)
load_dotenv()
settings = get_settings()

app = FastAPI(
    title="Velox AI Backend",
    description="AI-powered pose analysis and movement tracking API",
    version="1.0.0"
)

# Configure CORS based on validated env
allowed_origins = settings.ai_allowed_origins
if settings.environment == "production" and not allowed_origins:
    raise RuntimeError("AI_ALLOWED_ORIGINS must be set in production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else (["*"] if settings.environment != "production" else []),
    allow_credentials=settings.ai_allow_credentials,
    allow_methods=settings.ai_allow_methods,
    allow_headers=settings.ai_allow_headers,
)

# Configure structured logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("velox-ai")

PII_KEYS = {"email", "e_mail", "password", "token", "authorization", "cookie", "ssn", "phone", "phoneNumber", "userEmail"}

def mask_value(value):
    if value is None:
        return None
    if isinstance(value, str):
        if len(value) <= 4:
            return "***"
        return value[:2] + "***" + value[-2:]
    if isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, list):
        return [mask_value(v) for v in value]
    if isinstance(value, dict):
        return {k: (mask_value(v) if (k.lower() in PII_KEYS or 'email' in k.lower() or 'token' in k.lower()) else mask_value(v) if isinstance(v, (dict, list)) else v) for k, v in value.items()}
    return "***"

def log_json(level: str, message: str, **ctx):
    try:
        import json
        line = json.dumps({
            "level": level,
            "time": datetime.utcnow().isoformat(),
            "message": message,
            **mask_value(ctx),
        })
    except Exception:
        line = f"{level.upper()} {message}"
    getattr(logger, level if level in ("info", "warning", "error", "debug") else "info")(line)

@app.middleware("http")
async def add_request_id_and_logging(request: Request, call_next):
    start = time.perf_counter()
    request_id = request.headers.get("x-request-id") or request.headers.get("x-trace-id") or str(uuid.uuid4())
    try:
        response = await call_next(request)
    except Exception as exc:
        duration = int((time.perf_counter() - start) * 1000)
        log_json("error", "unhandled_server_error", requestId=request_id, path=str(request.url.path), method=request.method, durationMs=duration, error=str(exc))
        raise
    duration = int((time.perf_counter() - start) * 1000)
    response.headers["x-request-id"] = request_id
    response.headers["x-trace-id"] = request_id
    try:
        client_ip = request.client.host if request.client else None
    except Exception:
        client_ip = None
    log_json("info", "request_completed", requestId=request_id, path=str(request.url.path), method=request.method, status=response.status_code, durationMs=duration, ip=client_ip)
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = request.headers.get("x-request-id") or request.headers.get("x-trace-id") or str(uuid.uuid4())
    log_json("error", "unhandled_exception", requestId=request_id, path=str(request.url.path), method=request.method, error=str(exc))
    return JSONResponse(status_code=500, content={"detail": "internal_error", "request_id": request_id})

# Initialize services with optimized settings
pose_detector = PoseDetector(
    model_complexity=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
    enable_frame_skipping=True
)
movement_analyzer = MovementAnalyzer()

# Performance tracking
performance_stats = defaultdict(lambda: {
    'total_videos': 0,
    'total_frames': 0,
    'processing_times': [],
    'confidence_scores': [],
    'success_rate': 0,
    'failure_rate': 0
})

class VideoProcessingOptions(BaseModel):
    target_fps: Optional[int] = 30
    target_resolution: Optional[tuple] = (720, 480)
    enable_frame_skipping: Optional[bool] = True
    min_confidence: Optional[float] = 0.7

async def process_video_frames(video_path: str, options: VideoProcessingOptions) -> tuple:
    """Process video frames with optimized settings."""
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    original_fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    # Calculate frame skip rate
    skip_rate = max(1, original_fps // options.target_fps) if options.enable_frame_skipping else 1
    
    frames = []
    landmarks = []
    frame_number = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Skip frames based on target FPS
        if frame_number % skip_rate != 0:
            frame_number += 1
            continue
            
        # Resize frame if needed
        if options.target_resolution:
            frame = cv2.resize(frame, options.target_resolution)
            
        # Detect pose
        pose_landmarks, confidence = pose_detector.detect_pose(frame, frame_number)
        
        if pose_landmarks and confidence >= options.min_confidence:
            frames.append(frame)
            landmarks.append(pose_landmarks)
            
        frame_number += 1
        
    cap.release()
    return frames, landmarks

@app.post("/analyze-pose")
async def analyze_pose(
    file: UploadFile = File(...),
    exercise_type: str = None,
    options: VideoProcessingOptions = VideoProcessingOptions()
):
    try:
        # Save uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, file.filename)
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process video
        start_time = datetime.now()
        frames, landmarks = await process_video_frames(temp_path, options)
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Update performance stats
        performance_stats[exercise_type]['total_videos'] += 1
        performance_stats[exercise_type]['total_frames'] += len(frames)
        performance_stats[exercise_type]['processing_times'].append(processing_time)
        
        metrics = pose_detector.get_performance_metrics()
        performance_stats[exercise_type]['confidence_scores'].extend(metrics.get('confidence_scores', []))
        
        # Analyze movement if exercise type provided
        analysis_results = None
        if exercise_type and landmarks:
            analysis_results = movement_analyzer.analyze_movement(landmarks, exercise_type)
            
        # Cleanup
        shutil.rmtree(temp_dir)
        
        return {
            "analysis_id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "exercise_type": exercise_type,
            "frames_processed": len(frames),
            "processing_time_seconds": processing_time,
            "performance_metrics": metrics,
            "analysis_results": analysis_results
        }
        
    except Exception as e:
        if exercise_type:
            performance_stats[exercise_type]['failure_rate'] += 1
        log_json("error", "analyze_pose_error", error=str(e), exerciseType=exercise_type)
        raise HTTPException(status_code=500, detail="internal_error")

@app.get("/performance/metrics")
async def get_performance_metrics(exercise_type: Optional[str] = None):
    """Get performance metrics for all or specific exercise type."""
    if exercise_type and exercise_type not in performance_stats:
        raise HTTPException(status_code=404, detail=f"No data for exercise type: {exercise_type}")
        
    if exercise_type:
        stats = performance_stats[exercise_type]
        return {
            "exercise_type": exercise_type,
            "total_videos_processed": stats['total_videos'],
            "total_frames_processed": stats['total_frames'],
            "average_processing_time": np.mean(stats['processing_times']) if stats['processing_times'] else 0,
            "average_confidence": np.mean(stats['confidence_scores']) if stats['confidence_scores'] else 0,
            "success_rate": 1 - (stats['failure_rate'] / stats['total_videos'] if stats['total_videos'] > 0 else 0),
            "metrics_history": {
                "processing_times": stats['processing_times'][-10:],  # Last 10 videos
                "confidence_distribution": np.histogram(stats['confidence_scores'], bins=10).tolist() if stats['confidence_scores'] else None
            }
        }
    else:
        return {
            exercise: {
                "total_videos_processed": stats['total_videos'],
                "average_processing_time": np.mean(stats['processing_times']) if stats['processing_times'] else 0,
                "success_rate": 1 - (stats['failure_rate'] / stats['total_videos'] if stats['total_videos'] > 0 else 0)
            }
            for exercise, stats in performance_stats.items()
        }

@app.get("/performance/exercise-comparison")
async def compare_exercise_performance():
    """Compare performance metrics across different exercises."""
    comparison = {}
    
    for exercise, stats in performance_stats.items():
        if stats['total_videos'] > 0:
            comparison[exercise] = {
                "avg_processing_time": np.mean(stats['processing_times']) if stats['processing_times'] else 0,
                "avg_confidence": np.mean(stats['confidence_scores']) if stats['confidence_scores'] else 0,
                "success_rate": 1 - (stats['failure_rate'] / stats['total_videos']),
                "total_samples": stats['total_videos']
            }
            
    return comparison

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 