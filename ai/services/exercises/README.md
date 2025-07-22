# Exercise Analyzers

This directory contains exercise-specific analyzers for the Velox fitness intelligence platform. Each analyzer is responsible for:
1. Detecting exercise repetitions
2. Analyzing form and technique
3. Providing real-time feedback
4. Calculating performance metrics

## Available Analyzers

### Squat Analyzer
- Tracks knee and hip angles for proper depth
- Monitors back angle and knee alignment
- Detects stability issues
- Provides feedback on:
  - Squat depth
  - Back position
  - Knee tracking
  - Overall stability

### Deadlift Analyzer
- Tracks hip hinge and back angle
- Monitors bar path and knee position
- Detects stability issues
- Provides feedback on:
  - Hip height
  - Back angle
  - Bar path
  - Knee position

### Bench Press Analyzer
- Tracks elbow angles for proper depth
- Monitors bar path for straight movement
- Detects bar tilt and stability
- Provides feedback on:
  - Elbow angle at bottom
  - Bar path straightness
  - Bar levelness
  - Overall stability

### Overhead Press Analyzer
- Tracks shoulder and elbow angles
- Monitors bar path for vertical movement
- Detects shoulder stability
- Provides feedback on:
  - Lockout position
  - Bar path straightness
  - Shoulder stability
  - Overall control

### Pull-Up Analyzer
- Tracks elbow and shoulder angles
- Monitors body position and movement
- Detects swinging and stability
- Provides feedback on:
  - Pull height
  - Body control
  - Shoulder position
  - Movement efficiency

### Barbell Row Analyzer
- Tracks back angle and elbow position
- Monitors bar path and hip position
- Detects body movement
- Provides feedback on:
  - Back angle
  - Pull height
  - Bar path
  - Body stability

### Lunge Analyzer
- Tracks knee angles for both legs
- Monitors torso position
- Detects balance and stability
- Provides feedback on:
  - Front knee position
  - Back knee position
  - Torso uprightness
  - Overall stability

## Usage

```python
from services.exercises import get_analyzer_for_exercise
from services.pose_utils import Pose

# Get appropriate analyzer
analyzer = get_analyzer_for_exercise("squat")  # or any other supported exercise

# Check if starting position is valid
is_valid = analyzer.isValidStart(landmarks)

# Score a rep
score, feedback = analyzer.scoreRep(landmarks)

# Get movement phase
phase = analyzer.phase(landmarks)  # returns 'eccentric', 'concentric', or 'isometric'
```

## Configuration

Exercise-specific thresholds are defined in `config/form_thresholds.json`. Each exercise has its own section with parameters like:
- Target angles
- Range of motion limits
- Stability thresholds
- Form criteria

## Base Analyzer Class

All analyzers extend the `BaseFormAnalyzer` class which provides:
- Common functionality for loading thresholds
- Utility methods for landmark validation
- Angle calculation helpers
- Required interface methods:
  - `isValidStart(landmarks)` - Check valid starting position
  - `scoreRep(landmarks[])` - Score form and provide feedback
  - `phase(landmarks)` - Determine movement phase

## Contributing

When contributing new analyzers or modifications:
1. Extend `BaseFormAnalyzer` class
2. Implement all required methods
3. Add thresholds to `form_thresholds.json`
4. Add comprehensive test cases
5. Update this documentation 