import unittest
from typing import List, Dict
import numpy as np
from ..services.exercises.deadlift_analyzer import DeadliftAnalyzer
from ..services.pose_utils import Pose, FormScore, RepBoundary

class TestDeadliftAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = DeadliftAnalyzer()
        
    def _create_mock_pose(self, landmarks: Dict) -> Pose:
        """Create a mock pose with given landmarks."""
        return Pose(
            landmarks=landmarks,
            timestamp=0.0,
            confidence=1.0
        )
        
    def _create_mock_landmarks(self, positions: Dict[int, tuple]) -> Dict:
        """Create mock landmarks with given positions."""
        landmarks = {}
        for joint_id, pos in positions.items():
            landmarks[joint_id] = {
                'x': pos[0],
                'y': pos[1],
                'z': pos[2],
                'visibility': 1.0
            }
        return landmarks
        
    def test_good_form(self):
        """Test deadlift with perfect form."""
        landmarks = self._create_mock_landmarks({
            11: (0.5, 0.3, 0),  # Left shoulder
            12: (0.7, 0.3, 0),  # Right shoulder
            13: (0.4, 0.4, 0),  # Left elbow
            14: (0.8, 0.4, 0),  # Right elbow
            23: (0.5, 0.6, 0),  # Left hip
            24: (0.7, 0.6, 0),  # Right hip
            25: (0.5, 0.7, 0),  # Left knee
            26: (0.7, 0.7, 0),  # Right knee
            27: (0.5, 0.8, 0),  # Left ankle
            28: (0.7, 0.8, 0)   # Right ankle
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.analyzer.analyze_pose([pose])
        
        self.assertIsInstance(score, FormScore)
        self.assertGreater(score.overall_score, 0.8)
        self.assertIn('hip_score', score.metrics)
        self.assertIn('back_score', score.metrics)
        self.assertIn('knee_score', score.metrics)
        self.assertIn('bar_path_score', score.metrics)
        
    def test_borderline_form(self):
        """Test deadlift with borderline form (slight back rounding)."""
        landmarks = self._create_mock_landmarks({
            11: (0.5, 0.35, 0),  # Left shoulder (slightly lower)
            12: (0.7, 0.35, 0),  # Right shoulder (slightly lower)
            13: (0.4, 0.45, 0),  # Left elbow
            14: (0.8, 0.45, 0),  # Right elbow
            23: (0.5, 0.65, 0),  # Left hip (slightly lower)
            24: (0.7, 0.65, 0),  # Right hip (slightly lower)
            25: (0.5, 0.75, 0),  # Left knee
            26: (0.7, 0.75, 0),  # Right knee
            27: (0.5, 0.85, 0),  # Left ankle
            28: (0.7, 0.85, 0)   # Right ankle
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.analyzer.analyze_pose([pose])
        
        self.assertIsInstance(score, FormScore)
        self.assertGreater(score.overall_score, 0.6)
        self.assertLess(score.overall_score, 0.8)
        self.assertIn("Keep your back straight", score.feedback)
        
    def test_poor_form(self):
        """Test deadlift with poor form (severe back rounding and bar drift)."""
        landmarks = self._create_mock_landmarks({
            11: (0.5, 0.4, 0),   # Left shoulder (much lower)
            12: (0.7, 0.4, 0),   # Right shoulder (much lower)
            13: (0.3, 0.5, 0),   # Left elbow (further out)
            14: (0.9, 0.5, 0),   # Right elbow (further out)
            23: (0.5, 0.7, 0),   # Left hip (much lower)
            24: (0.7, 0.7, 0),   # Right hip (much lower)
            25: (0.5, 0.8, 0),   # Left knee
            26: (0.7, 0.8, 0),   # Right knee
            27: (0.5, 0.9, 0),   # Left ankle
            28: (0.7, 0.9, 0)    # Right ankle
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.analyzer.analyze_pose([pose])
        
        self.assertIsInstance(score, FormScore)
        self.assertLess(score.overall_score, 0.6)
        self.assertIn("Keep your back straight", score.feedback)
        self.assertIn("Keep the bar close to your body", score.feedback)
        
    def test_rep_detection(self):
        """Test rep detection with simulated deadlift movement."""
        landmarks_list = []
        for i in range(10):
            # Simulate a deadlift rep
            y_pos = 0.3 + 0.1 * np.sin(i * np.pi / 5)  # Oscillating vertical position
            landmarks = self._create_mock_landmarks({
                11: (0.5, y_pos, 0),  # Left shoulder
                12: (0.7, y_pos, 0),  # Right shoulder
                13: (0.4, y_pos + 0.1, 0),  # Left elbow
                14: (0.8, y_pos + 0.1, 0),  # Right elbow
                23: (0.5, y_pos + 0.2, 0),  # Left hip
                24: (0.7, y_pos + 0.2, 0),  # Right hip
                25: (0.5, y_pos + 0.3, 0),  # Left knee
                26: (0.7, y_pos + 0.3, 0)   # Right knee
            })
            landmarks_list.append(self._create_mock_pose(landmarks))
            
        boundaries = self.analyzer.get_rep_boundaries(landmarks_list)
        self.assertGreater(len(boundaries), 0)
        self.assertEqual(boundaries[0].rep_type, "deadlift")
        self.assertIn("peak_velocity", boundaries[0].extra)
        
    def test_missing_landmarks(self):
        """Test handling of missing landmarks."""
        landmarks = self._create_mock_landmarks({
            11: (0.5, 0.3, 0),  # Left shoulder
            12: (0.7, 0.3, 0),  # Right shoulder
            # Missing other landmarks
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.analyzer.analyze_pose([pose])
        
        self.assertIsInstance(score, FormScore)
        self.assertEqual(score.overall_score, 0.0)
        self.assertEqual(len(score.metrics), 0)
        
if __name__ == '__main__':
    unittest.main() 