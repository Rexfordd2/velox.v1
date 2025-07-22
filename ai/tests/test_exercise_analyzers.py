import unittest
from typing import List, Dict
import numpy as np
from ..services.exercises.bench_press_analyzer import BenchPressAnalyzer
from ..services.exercises.pushup_analyzer import PushUpAnalyzer
from ..services.pose_utils import Pose, FormScore, RepBoundary

class TestExerciseAnalyzers(unittest.TestCase):
    def setUp(self):
        self.bench_press_analyzer = BenchPressAnalyzer()
        self.pushup_analyzer = PushUpAnalyzer()
        
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
        
    def test_bench_press_analyzer(self):
        # Test case 1: Perfect form
        landmarks = self._create_mock_landmarks({
            11: (0.5, 0.3, 0),  # Left shoulder
            12: (0.7, 0.3, 0),  # Right shoulder
            13: (0.4, 0.4, 0),  # Left elbow
            14: (0.8, 0.4, 0),  # Right elbow
            15: (0.3, 0.5, 0),  # Left wrist
            16: (0.9, 0.5, 0),  # Right wrist
            23: (0.5, 0.6, 0),  # Left hip
            24: (0.7, 0.6, 0),  # Right hip
            25: (0.5, 0.8, 0),  # Left knee
            26: (0.7, 0.8, 0)   # Right knee
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.bench_press_analyzer.analyze_pose([pose])
        
        self.assertIsInstance(score, FormScore)
        self.assertGreater(score.overall_score, 0.8)
        self.assertIn('elbow_score', score.metrics)
        self.assertIn('bar_path_score', score.metrics)
        self.assertIn('lumbar_score', score.metrics)
        
        # Test case 2: Poor form (excessive lumbar arch)
        landmarks = self._create_mock_landmarks({
            11: (0.5, 0.3, 0),  # Left shoulder
            12: (0.7, 0.3, 0),  # Right shoulder
            13: (0.4, 0.4, 0),  # Left elbow
            14: (0.8, 0.4, 0),  # Right elbow
            15: (0.3, 0.5, 0),  # Left wrist
            16: (0.9, 0.5, 0),  # Right wrist
            23: (0.5, 0.7, 0),  # Left hip (lowered)
            24: (0.7, 0.7, 0),  # Right hip (lowered)
            25: (0.5, 0.8, 0),  # Left knee
            26: (0.7, 0.8, 0)   # Right knee
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.bench_press_analyzer.analyze_pose([pose])
        
        self.assertLess(score.overall_score, 0.7)
        self.assertIn("Reduce lower back arch", score.feedback)
        
    def test_pushup_analyzer(self):
        # Test case 1: Perfect form
        landmarks = self._create_mock_landmarks({
            7: (0.5, 0.2, 0),   # Left ear
            11: (0.5, 0.3, 0),  # Left shoulder
            12: (0.7, 0.3, 0),  # Right shoulder
            13: (0.4, 0.4, 0),  # Left elbow
            14: (0.8, 0.4, 0),  # Right elbow
            15: (0.3, 0.5, 0),  # Left wrist
            16: (0.9, 0.5, 0),  # Right wrist
            23: (0.5, 0.6, 0),  # Left hip
            24: (0.7, 0.6, 0),  # Right hip
            27: (0.5, 0.9, 0),  # Left ankle
            28: (0.7, 0.9, 0)   # Right ankle
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.pushup_analyzer.analyze_pose([pose])
        
        self.assertIsInstance(score, FormScore)
        self.assertGreater(score.overall_score, 0.8)
        self.assertIn('elbow_score', score.metrics)
        self.assertIn('hip_score', score.metrics)
        self.assertIn('neck_score', score.metrics)
        
        # Test case 2: Poor form (sagging hips)
        landmarks = self._create_mock_landmarks({
            7: (0.5, 0.2, 0),   # Left ear
            11: (0.5, 0.3, 0),  # Left shoulder
            12: (0.7, 0.3, 0),  # Right shoulder
            13: (0.4, 0.4, 0),  # Left elbow
            14: (0.8, 0.4, 0),  # Right elbow
            15: (0.3, 0.5, 0),  # Left wrist
            16: (0.9, 0.5, 0),  # Right wrist
            23: (0.5, 0.7, 0),  # Left hip (lowered)
            24: (0.7, 0.7, 0),  # Right hip (lowered)
            27: (0.5, 0.9, 0),  # Left ankle
            28: (0.7, 0.9, 0)   # Right ankle
        })
        
        pose = self._create_mock_pose(landmarks)
        score = self.pushup_analyzer.analyze_pose([pose])
        
        self.assertLess(score.overall_score, 0.7)
        self.assertIn("Keep your body straight", score.feedback)
        
    def test_rep_detection(self):
        # Test bench press rep detection
        landmarks_list = []
        for i in range(10):
            # Simulate a bench press rep
            y_pos = 0.3 + 0.1 * np.sin(i * np.pi / 5)  # Oscillating vertical position
            landmarks = self._create_mock_landmarks({
                11: (0.5, y_pos, 0),  # Left shoulder
                12: (0.7, y_pos, 0),  # Right shoulder
                13: (0.4, y_pos + 0.1, 0),  # Left elbow
                14: (0.8, y_pos + 0.1, 0),  # Right elbow
                15: (0.3, y_pos + 0.2, 0),  # Left wrist
                16: (0.9, y_pos + 0.2, 0),  # Right wrist
                23: (0.5, 0.6, 0),  # Left hip
                24: (0.7, 0.6, 0)   # Right hip
            })
            landmarks_list.append(self._create_mock_pose(landmarks))
            
        boundaries = self.bench_press_analyzer.get_rep_boundaries(landmarks_list)
        self.assertGreater(len(boundaries), 0)
        self.assertEqual(boundaries[0].rep_type, "bench_press")
        
        # Test push-up rep detection
        landmarks_list = []
        for i in range(10):
            # Simulate a push-up rep
            y_pos = 0.3 + 0.1 * np.sin(i * np.pi / 5)  # Oscillating vertical position
            landmarks = self._create_mock_landmarks({
                7: (0.5, 0.2, 0),   # Left ear
                11: (0.5, y_pos, 0),  # Left shoulder
                12: (0.7, y_pos, 0),  # Right shoulder
                13: (0.4, y_pos + 0.1, 0),  # Left elbow
                14: (0.8, y_pos + 0.1, 0),  # Right elbow
                15: (0.3, y_pos + 0.2, 0),  # Left wrist
                16: (0.9, y_pos + 0.2, 0),  # Right wrist
                23: (0.5, 0.6, 0),  # Left hip
                24: (0.7, 0.6, 0)   # Right hip
            })
            landmarks_list.append(self._create_mock_pose(landmarks))
            
        boundaries = self.pushup_analyzer.get_rep_boundaries(landmarks_list)
        self.assertGreater(len(boundaries), 0)
        self.assertEqual(boundaries[0].rep_type, "pushup")
        
if __name__ == '__main__':
    unittest.main() 