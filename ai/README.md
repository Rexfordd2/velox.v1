# Velox AI Backend

This is the AI-powered pose analysis backend for the Velox fitness platform.

## Features

- Real-time pose detection using MediaPipe
- Movement analysis for exercises (squat, deadlift, bench press)
- Form scoring and feedback generation
- RESTful API built with FastAPI

## Setup

### 1. Create Python Virtual Environment

```bash
cd ai
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

### 4. API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
```
GET /health
```

### Analyze Pose
```
POST /analyze-pose
```

**Parameters:**
- `file`: Video file (MP4, WebM, or MOV)
- `exercise_type`: Type of exercise ("squat", "deadlift", "bench_press")
- `user_id`: User identifier

**Response:**
```json
{
  "analysis_id": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "exercise_type": "squat",
  "user_id": "user123",
  "metrics": {
    "depth": 90,
    "form_score": 85,
    "rep_count": 10,
    "tempo": 2.5,
    "stability": 92
  },
  "feedback": [
    "Great depth on your squats",
    "Try to keep your knees from caving inward"
  ],
  "confidence_score": 0.85
}
```

## Development

### Running with Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t velox-ai .
docker run -p 8000:8000 velox-ai
```

## Environment Variables

Create a `.env` file:
```
PORT=8000
``` 