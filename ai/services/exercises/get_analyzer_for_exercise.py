from typing import Optional, Dict, Any
from .base_form_analyzer import BaseFormAnalyzer
from .squat_analyzer import SquatAnalyzer
from .deadlift_analyzer import DeadliftAnalyzer
from .bench_press_analyzer import BenchPressAnalyzer
from .overhead_press_analyzer import OverheadPressAnalyzer
from .pullup_analyzer import PullUpAnalyzer
from .barbell_row_analyzer import BarbellRowAnalyzer
from .lunge_analyzer import LungeAnalyzer

def get_analyzer_for_exercise(exercise_name: str, custom_definition: Optional[Dict[str, Any]] = None) -> Optional[BaseFormAnalyzer]:
    """
    Factory function to get the appropriate analyzer for a given exercise.
    
    Args:
        exercise_name: Name of the exercise (case-insensitive)
        
    Returns:
        Appropriate analyzer instance or None if exercise not supported
    """
    analyzers = {
        "squat": SquatAnalyzer,
        "deadlift": DeadliftAnalyzer,
        "bench_press": BenchPressAnalyzer,
        "overhead_press": OverheadPressAnalyzer,
        "pullup": PullUpAnalyzer,
        "barbell_row": BarbellRowAnalyzer,
        "lunge": LungeAnalyzer
    }
    
    exercise_name = exercise_name.lower().replace(" ", "_")
    analyzer_class = analyzers.get(exercise_name)
    
    if analyzer_class:
        return analyzer_class()

    # Fallback: build a lightweight analyzer from a custom definition
    if custom_definition:
        return _build_custom_analyzer(custom_definition)
    
    return None


class _CustomAnalyzer(BaseFormAnalyzer):
    def __init__(self, definition: Dict[str, Any]):
        # store the definition; skip thresholds loading for custom
        self._definition = definition
        super().__init__()

    @property
    def exercise_name(self) -> str:
        # generic name; thresholds not used for custom
        return self._definition.get('name', 'custom')

    def _load_thresholds(self):
        # override: no thresholds file for custom; derive from definition
        return {}

    def isValidStart(self, landmarks: Dict) -> bool:
        # minimal check: presence of landmarks is validated upstream
        return True

    def get_joint_triplets(self):
        # derive joint triplets for common angle joints
        # map single joint to an approximate triplet using adjacent joints
        mapping = {
            'knee': ('hip', 'knee', 'ankle'),
            'hip': ('shoulder', 'hip', 'knee'),
            'elbow': ('shoulder', 'elbow', 'wrist'),
            'shoulder': ('hip', 'shoulder', 'elbow'),
        }
        triplets = []
        for phase in self._definition.get('phases', []):
            for crit in phase.get('criteria', []):
                for key in ('angle', 'rom', 'velocity'):
                    cfg = crit.get(key)
                    if cfg and isinstance(cfg, dict):
                        joint = cfg.get('joint')
                        if joint in mapping:
                            triplets.append(mapping[joint])
        # ensure unique
        uniq = []
        seen = set()
        for t in triplets:
            if t not in seen:
                uniq.append(t)
                seen.add(t)
        return uniq or [('hip','knee','ankle')]

    def get_target_angles(self):
        targets = {}
        for phase in self._definition.get('phases', []):
            for crit in phase.get('criteria', []):
                angle = crit.get('angle')
                if angle and isinstance(angle, dict) and 'joint' in angle:
                    j = angle['joint']
                    min_v = angle.get('min', 0.0)
                    max_v = angle.get('max', 180.0)
                    targets[j] = (float(min_v), float(max_v))
        return targets

    def scoreRep(self, landmarks):
        # simplistic scoring based on angle coverage and hold time
        rep_count = self.analyze_movement_sequence(landmarks)
        cues = []
        score = 0.0
        if rep_count.count > 0:
            score = min(1.0, max(0.0, rep_count.confidence))
        # cues from criteria
        for phase in self._definition.get('phases', []):
            for crit in phase.get('criteria', []):
                if crit.get('cueOnFail'):
                    cues.append(crit['cueOnFail'])
        return score, cues


def _build_custom_analyzer(definition: Dict[str, Any]) -> BaseFormAnalyzer:
    return _CustomAnalyzer(definition)