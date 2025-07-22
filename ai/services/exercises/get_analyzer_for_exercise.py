from typing import Optional
from .base_form_analyzer import BaseFormAnalyzer
from .squat_analyzer import SquatAnalyzer
from .deadlift_analyzer import DeadliftAnalyzer
from .bench_press_analyzer import BenchPressAnalyzer
from .overhead_press_analyzer import OverheadPressAnalyzer
from .pullup_analyzer import PullUpAnalyzer
from .barbell_row_analyzer import BarbellRowAnalyzer
from .lunge_analyzer import LungeAnalyzer

def get_analyzer_for_exercise(exercise_name: str) -> Optional[BaseFormAnalyzer]:
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
    return None 