# Pose Analysis Accuracy

## Angle Calculations

### Joint Angles
Joint angles are calculated using the cosine law:
```
angle = arccos((a·b) / (|a|·|b|))
```
where:
- `a` and `b` are vectors from the joint to adjacent joints
- `·` is the dot product
- `|v|` is the vector magnitude

### Smoothing
To reduce jitter in angle calculations, we use a moving average filter:
```
smoothed[i] = (1/n) * Σ(angles[i-n/2:i+n/2])
```
where:
- `n` is the window size (default: 5 frames)
- `angles` is the sequence of raw angles

## Form Thresholds

### Squat
- Hip Depth: 110° (target)
  - Too shallow: < 90°
  - Too deep: > 120°
- Knee Valgus: < 5° deviation
- Back Angle: 45° from vertical
- Stability: > 0.7 (normalized score)

### Deadlift
- Back Angle: 45° from vertical
- Hip Angle: 90° at start
- Knee Angle: 120° at start
- Bar Path: < 5cm deviation
- Stability: > 0.7

### Bench Press
- Elbow Angle: 90° at bottom
- Shoulder Angle: 45° from bench
- Bar Path: < 3cm deviation
- Stability: > 0.8

### Push-up
- Elbow Angle: 90° at bottom
- Body Line: < 5° deviation
- Depth: > 70% of arm length
- Stability: > 0.7

### Pull-up
- Elbow Angle: 90° at bottom
- Shoulder Angle: 45° from vertical
- Height: > 80% of full range
- Stability: > 0.7

### Overhead Press
- Elbow Angle: 90° at start
- Shoulder Angle: 45° from vertical
- Bar Path: < 3cm deviation
- Stability: > 0.8

### Row
- Elbow Angle: 90° at peak
- Back Angle: 45° from vertical
- Bar Path: < 5cm deviation
- Stability: > 0.7

### Lunge
- Front Knee: 90° at bottom
- Back Knee: 90° at bottom
- Torso: < 5° deviation
- Stability: > 0.7

## Tuning Thresholds

1. **Depth/Angle Thresholds**
   - Adjust based on exercise type and user goals
   - Consider user flexibility and experience level
   - Use video analysis to validate thresholds

2. **Stability Thresholds**
   - Higher for technical lifts (bench press, overhead press)
   - Lower for compound movements (squat, deadlift)
   - Adjust based on user experience level

3. **Path Deviation**
   - Tighter for technical lifts
   - Wider for compound movements
   - Consider equipment constraints

## Improving Accuracy

1. **Camera Setup**
   - Position camera perpendicular to movement plane
   - Ensure good lighting
   - Use high frame rate (30+ fps)

2. **Processing**
   - Apply smoothing to reduce jitter
   - Use Kalman filtering for tracking
   - Validate joint visibility

3. **Calibration**
   - Allow user to calibrate for height
   - Consider equipment dimensions
   - Account for camera angle

4. **Feedback**
   - Provide real-time feedback
   - Show visual guides
   - Explain corrections needed 