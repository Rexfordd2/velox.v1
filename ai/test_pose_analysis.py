import cv2
import numpy as np
from services.pose_detector import PoseDetector
from services.movement_analyzer import MovementAnalyzer, ExerciseType

def test_pose_detection():
    # Initialize services
    pose_detector = PoseDetector()
    movement_analyzer = MovementAnalyzer()
    
    # Create a test video (simple animation of a squat)
    width, height = 640, 480
    fps = 30
    duration = 3  # seconds
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter('test_squat.mp4', fourcc, fps, (width, height))
    
    # Generate frames
    for frame in range(fps * duration):
        # Create a blank frame
        img = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Draw a simple stick figure doing a squat
        # This is a very simplified version - in reality, you'd want to use a proper animation
        progress = frame / (fps * duration)
        squat_depth = abs(np.sin(progress * np.pi * 2))  # Oscillate between 0 and 1
        
        # Draw body parts
        head_pos = (width // 2, int(height * 0.2))
        hip_pos = (width // 2, int(height * 0.4 + squat_depth * 100))
        knee_pos = (width // 2, int(height * 0.6 + squat_depth * 50))
        ankle_pos = (width // 2, int(height * 0.8))
        
        # Draw lines
        cv2.line(img, head_pos, hip_pos, (255, 255, 255), 2)
        cv2.line(img, hip_pos, knee_pos, (255, 255, 255), 2)
        cv2.line(img, knee_pos, ankle_pos, (255, 255, 255), 2)
        
        # Draw joints
        for pos in [head_pos, hip_pos, knee_pos, ankle_pos]:
            cv2.circle(img, pos, 5, (0, 255, 0), -1)
        
        # Write frame
        out.write(img)
    
    # Release video writer
    out.release()
    
    # Test pose detection
    print("Testing pose detection...")
    landmarks_sequence = pose_detector.process_video('test_squat.mp4')
    
    if landmarks_sequence:
        print(f"Successfully detected poses in {len(landmarks_sequence)} frames")
        
        # Test movement analysis
        print("\nTesting movement analysis...")
        metrics, feedback = movement_analyzer.analyze_movement(
            landmarks_sequence,
            ExerciseType.SQUAT.value
        )
        
        print("\nAnalysis Results:")
        print(f"Depth: {metrics.depth:.2f} degrees")
        print(f"Form Score: {metrics.form_score:.2f}/100")
        print(f"Rep Count: {metrics.rep_count}")
        print(f"Tempo: {metrics.tempo:.2f} frames per rep")
        print(f"Stability: {metrics.stability:.2f}")
        
        print("\nFeedback:")
        for item in feedback:
            print(f"- {item}")
    else:
        print("No poses detected in the test video")

if __name__ == "__main__":
    test_pose_detection() 