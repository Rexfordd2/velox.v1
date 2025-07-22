from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
from datetime import datetime
import os
from dotenv import load_dotenv
import uuid
import random

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Velox AI Backend (Simplified)",
    description="Mock AI-powered pose analysis API for testing",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class PoseAnalysisResponse(BaseModel):
    analysis_id: str
    timestamp: datetime
    exercise_type: str
    user_id: str
    metrics: dict
    feedback: List[str]
    confidence_score: float

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Mock pose analysis endpoint
@app.post("/analyze-pose", response_model=PoseAnalysisResponse)
async def analyze_pose(
    file: UploadFile = File(...),
    exercise_type: str = "squat",
    user_id: str = "user123"
):
    # Generate mock data for testing
    form_score = random.randint(70, 95)
    
    # Exercise-specific feedback
    feedback_options = {
        "squat": [
            "Great depth on your squats!",
            "Try to keep your knees from caving inward",
            "Maintain a neutral spine throughout the movement",
            "Good job keeping your chest up",
            "Focus on driving through your heels"
        ],
        "deadlift": [
            "Excellent hip hinge pattern",
            "Keep the bar closer to your body",
            "Good lockout at the top",
            "Try to maintain a neutral neck position",
            "Great job keeping your back straight"
        ],
        "bench_press": [
            "Good bar path control",
            "Try to maintain better shoulder blade retraction",
            "Excellent elbow positioning",
            "Keep your feet firmly planted",
            "Good control on the descent"
        ]
    }
    
    # Get random feedback for the exercise
    exercise_feedback = feedback_options.get(exercise_type, feedback_options["squat"])
    selected_feedback = random.sample(exercise_feedback, min(3, len(exercise_feedback)))
    
    # Generate response
    return PoseAnalysisResponse(
        analysis_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        exercise_type=exercise_type,
        user_id=user_id,
        metrics={
            "depth": random.randint(80, 110),
            "form_score": form_score,
            "rep_count": random.randint(8, 12),
            "tempo": round(random.uniform(2.0, 3.5), 1),
            "stability": random.randint(85, 98)
        },
        feedback=selected_feedback,
        confidence_score=round(form_score / 100.0, 2)
    )

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    ) 