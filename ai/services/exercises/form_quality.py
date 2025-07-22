from typing import List, Dict, Optional
import numpy as np
from ..pose_utils import calculate_angle, get_joint_position

def calculate_form_confidence(
    pose_frames: List[Dict],
    joint_angles: Dict[str, List[float]],
    ideal_angles: Dict[str, float],
    rep_start: int,
    rep_end: int
) -> float:
    """
    Calculate form confidence score based on joint angle deviations.
    
    Args:
        pose_frames: List of pose frames with landmarks
        joint_angles: Dict of joint names to their angle measurements
        ideal_angles: Dict of joint names to their ideal angles
        rep_start: Start frame index of the rep
        rep_end: End frame index of the rep
        
    Returns:
        Confidence score between 0 and 1
    """
    if not pose_frames or not joint_angles or rep_start >= rep_end:
        return 0.0
        
    # Calculate average deviation for each joint during the rep
    joint_deviations = []
    
    for joint_name, angles in joint_angles.items():
        if not angles or joint_name not in ideal_angles:
            continue
            
        # Get angles during the rep
        rep_angles = angles[rep_start:rep_end+1]
        if not rep_angles:
            continue
            
        # Calculate average deviation from ideal
        ideal = ideal_angles[joint_name]
        deviations = [abs(angle - ideal) for angle in rep_angles]
        avg_deviation = np.mean(deviations)
        joint_deviations.append(avg_deviation)
    
    if not joint_deviations:
        return 0.0
        
    # Calculate overall average deviation
    avg_overall_deviation = np.mean(joint_deviations)
    
    # Scale to confidence score:
    # - <5° deviation = 1.0 confidence
    # - >25° deviation = 0.0 confidence
    # - Linear scale between 5° and 25°
    if avg_overall_deviation <= 5:
        confidence = 1.0
    elif avg_overall_deviation >= 25:
        confidence = 0.0
    else:
        confidence = 1.0 - ((avg_overall_deviation - 5) / 20)
        
    return float(confidence)

def get_pushup_confidence(
    pose_frames: List[Dict],
    rep_start: int,
    rep_end: int,
    thresholds: Dict
) -> float:
    """Calculate form confidence for a pushup rep."""
    joint_angles = {
        "elbow": [],
        "hip": [],
        "neck": []
    }
    
    for pose in pose_frames[rep_start:rep_end+1]:
        # Elbow angle (average of left and right)
        left_shoulder = get_joint_position(pose, 11)
        left_elbow = get_joint_position(pose, 13)
        left_wrist = get_joint_position(pose, 15)
        right_shoulder = get_joint_position(pose, 12)
        right_elbow = get_joint_position(pose, 14)
        right_wrist = get_joint_position(pose, 16)
        
        if all([left_shoulder, left_elbow, left_wrist, right_shoulder, right_elbow, right_wrist]):
            left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
            right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
            joint_angles["elbow"].append((left_angle + right_angle) / 2)
            
        # Hip angle
        shoulder = get_joint_position(pose, 11)
        hip = get_joint_position(pose, 23)
        ankle = get_joint_position(pose, 27)
        if all([shoulder, hip, ankle]):
            joint_angles["hip"].append(calculate_angle(shoulder, hip, ankle))
            
        # Neck angle
        ear = get_joint_position(pose, 7)
        if all([ear, shoulder, hip]):
            joint_angles["neck"].append(calculate_angle(ear, shoulder, hip))
    
    ideal_angles = {
        "elbow": thresholds["elbow_angle_deg"],
        "hip": 180,  # Straight line
        "neck": 180  # Neutral position
    }
    
    return calculate_form_confidence(pose_frames, joint_angles, ideal_angles, rep_start, rep_end)

def get_bench_press_confidence(
    pose_frames: List[Dict],
    rep_start: int,
    rep_end: int,
    thresholds: Dict
) -> float:
    """Calculate form confidence for a bench press rep."""
    joint_angles = {
        "elbow": [],
        "lumbar": []
    }
    
    for pose in pose_frames[rep_start:rep_end+1]:
        # Elbow angle (average of left and right)
        left_shoulder = get_joint_position(pose, 11)
        left_elbow = get_joint_position(pose, 13)
        left_wrist = get_joint_position(pose, 15)
        right_shoulder = get_joint_position(pose, 12)
        right_elbow = get_joint_position(pose, 14)
        right_wrist = get_joint_position(pose, 16)
        
        if all([left_shoulder, left_elbow, left_wrist, right_shoulder, right_elbow, right_wrist]):
            left_angle = calculate_angle(left_shoulder, left_elbow, left_wrist)
            right_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
            joint_angles["elbow"].append((left_angle + right_angle) / 2)
            
        # Lumbar angle
        shoulder = get_joint_position(pose, 11)
        hip = get_joint_position(pose, 23)
        knee = get_joint_position(pose, 25)
        if all([shoulder, hip, knee]):
            joint_angles["lumbar"].append(calculate_angle(shoulder, hip, knee))
    
    ideal_angles = {
        "elbow": thresholds["elbow_angle_deg"],
        "lumbar": thresholds["back_angle_deg"]
    }
    
    return calculate_form_confidence(pose_frames, joint_angles, ideal_angles, rep_start, rep_end) 