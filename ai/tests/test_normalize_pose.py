import numpy as np
from ai.services.pose_detector import normalize_pose


def test_normalize_pose_basic_alignment_and_scale():
    # Construct simple landmarks dict using MediaPipe integer indices
    # Shoulders at (-1,0) and (1,0); hips at (-1,2) and (1,2)
    # After normalization: pelvis at origin, axis aligned to +Y, scaled by shoulder width=2 => scale 0.5
    lm = {
        11: [ -1.0, 0.0, 1.0 ],   # left_shoulder
        12: [  1.0, 0.0, 1.0 ],   # right_shoulder
        23: [ -1.0, 2.0, 1.0 ],   # left_hip
        24: [  1.0, 2.0, 1.0 ],   # right_hip
        0:  [  0.0, -1.0, 1.0 ],  # nose (for checking transform)
    }

    out = normalize_pose(lm)
    # pelvis centered at origin means hip centers become around y>0
    # Shoulder width=2 => scale 0.5, hips y=2 -> relative to pelvis y=2 -> scaled 1.0
    # Nose at y=-1 relative to pelvis y=2 becomes -3, scaled -1.5
    nose = np.array(out[0])
    assert np.isclose(nose[0], 0.0, atol=1e-6)
    assert np.isclose(nose[1], -1.5, atol=1e-6)


