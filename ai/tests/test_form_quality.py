import pytest
import numpy as np
from ..services.exercises.form_quality import (
    calculate_form_confidence,
    get_pushup_confidence,
    get_bench_press_confidence
)

# Mock data helpers
def create_mock_pose(
    left_elbow_angle: float,
    right_elbow_angle: float,
    hip_angle: float,
    neck_angle: float
) -> dict:
    """Create mock pose data with specified angles."""
    # Convert angles to coordinates that would produce these angles
    def angle_to_coords(angle: float) -> tuple:
        rad = np.radians(angle)
        return (np.cos(rad), np.sin(rad))
    
    return {
        # Left arm joints
        11: np.array([0, 0]),  # Left shoulder
        13: np.array([1, 0]),  # Left elbow
        15: np.array([1 + angle_to_coords(left_elbow_angle)[0], 
                     angle_to_coords(left_elbow_angle)[1]]),  # Left wrist
        
        # Right arm joints
        12: np.array([2, 0]),  # Right shoulder
        14: np.array([3, 0]),  # Right elbow
        16: np.array([3 + angle_to_coords(right_elbow_angle)[0],
                     angle_to_coords(right_elbow_angle)[1]]),  # Right wrist
        
        # Spine and hip joints
        7: np.array([1, 2 + angle_to_coords(neck_angle)[1]]),  # Left ear
        23: np.array([1, -1]),  # Left hip
        24: np.array([2, -1]),  # Right hip
        25: np.array([1 + angle_to_coords(hip_angle)[0],
                     -1 + angle_to_coords(hip_angle)[1]]),  # Left knee
        27: np.array([1, -2])  # Left ankle
    }

@pytest.fixture
def perfect_pushup_frames():
    """Perfect form pushup sequence."""
    frames = []
    # Start position (top)
    frames.append(create_mock_pose(
        left_elbow_angle=170,
        right_elbow_angle=170,
        hip_angle=178,
        neck_angle=178
    ))
    # Middle of descent
    frames.append(create_mock_pose(
        left_elbow_angle=135,
        right_elbow_angle=135,
        hip_angle=179,
        neck_angle=179
    ))
    # Bottom position
    frames.append(create_mock_pose(
        left_elbow_angle=90,
        right_elbow_angle=90,
        hip_angle=180,
        neck_angle=180
    ))
    return frames

@pytest.fixture
def average_pushup_frames():
    """Average form pushup sequence with some deviations."""
    frames = []
    # Start position (top) - slight elbow bend
    frames.append(create_mock_pose(
        left_elbow_angle=160,
        right_elbow_angle=155,
        hip_angle=170,
        neck_angle=170
    ))
    # Middle of descent - hips starting to sag
    frames.append(create_mock_pose(
        left_elbow_angle=130,
        right_elbow_angle=125,
        hip_angle=165,
        neck_angle=165
    ))
    # Bottom position - uneven elbows, sagging hips
    frames.append(create_mock_pose(
        left_elbow_angle=85,
        right_elbow_angle=95,
        hip_angle=160,
        neck_angle=160
    ))
    return frames

@pytest.fixture
def bad_pushup_frames():
    """Poor form pushup sequence with major deviations."""
    frames = []
    # Start position - significant elbow bend
    frames.append(create_mock_pose(
        left_elbow_angle=145,
        right_elbow_angle=140,
        hip_angle=155,
        neck_angle=150
    ))
    # Middle - severe hip sag, neck strain
    frames.append(create_mock_pose(
        left_elbow_angle=120,
        right_elbow_angle=110,
        hip_angle=140,
        neck_angle=140
    ))
    # Bottom - very uneven, collapsed form
    frames.append(create_mock_pose(
        left_elbow_angle=75,
        right_elbow_angle=100,
        hip_angle=130,
        neck_angle=130
    ))
    return frames

def test_perfect_pushup_confidence(perfect_pushup_frames):
    """Test confidence calculation for perfect form."""
    thresholds = {
        "elbow_angle_deg": 90,
        "hip_angle_deg": 15,
        "neck_angle_deg": 15
    }
    confidence = get_pushup_confidence(
        perfect_pushup_frames,
        rep_start=0,
        rep_end=2,
        thresholds=thresholds
    )
    assert 0.9 <= confidence <= 1.0

def test_average_pushup_confidence(average_pushup_frames):
    """Test confidence calculation for average form."""
    thresholds = {
        "elbow_angle_deg": 90,
        "hip_angle_deg": 15,
        "neck_angle_deg": 15
    }
    confidence = get_pushup_confidence(
        average_pushup_frames,
        rep_start=0,
        rep_end=2,
        thresholds=thresholds
    )
    assert 0.4 <= confidence <= 0.6

def test_bad_pushup_confidence(bad_pushup_frames):
    """Test confidence calculation for poor form."""
    thresholds = {
        "elbow_angle_deg": 90,
        "hip_angle_deg": 15,
        "neck_angle_deg": 15
    }
    confidence = get_pushup_confidence(
        bad_pushup_frames,
        rep_start=0,
        rep_end=2,
        thresholds=thresholds
    )
    assert confidence < 0.2 