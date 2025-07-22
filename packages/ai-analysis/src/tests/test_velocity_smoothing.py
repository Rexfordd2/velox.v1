import pytest
import numpy as np
from ..utils.velocity import calcVelocity

def generate_noisy_sine(freq: float, duration: float, fps: float, noise_std: float = 0.1) -> np.ndarray:
    """Generate a noisy sine wave for testing.
    
    Args:
        freq: Frequency of the sine wave in Hz
        duration: Duration in seconds
        fps: Frames per second
        noise_std: Standard deviation of the noise to add
        
    Returns:
        Array of y-positions with noise
    """
    t = np.linspace(0, duration, int(duration * fps))
    clean = np.sin(2 * np.pi * freq * t)
    noise = np.random.normal(0, noise_std, len(t))
    return clean + noise

def test_ema_smoothing_reduces_noise():
    """Test that EMA smoothing reduces velocity noise."""
    # Generate noisy sine wave
    fps = 60
    y_series = generate_noisy_sine(freq=1.0, duration=2.0, fps=fps, noise_std=0.1)
    
    # Calculate velocities with and without smoothing
    raw_metrics = calcVelocity(y_series.tolist(), fps, {"smoothing": False})
    smoothed_metrics = calcVelocity(y_series.tolist(), fps, {"smoothing": True, "alpha": 0.2})
    
    # Get raw and smoothed velocities from first rep
    raw_velocities = raw_metrics[0].v_raw if raw_metrics else []
    smoothed_velocities = smoothed_metrics[0].v_smooth if smoothed_metrics else []
    
    if not raw_velocities or not smoothed_velocities:
        pytest.fail("No velocity data generated")
    
    # Calculate standard deviations
    raw_std = np.std(raw_velocities)
    smoothed_std = np.std(smoothed_velocities)
    
    # Assert smoothed std dev is at least 40% lower than raw
    reduction = (raw_std - smoothed_std) / raw_std * 100
    assert reduction >= 40, f"Noise reduction ({reduction:.1f}%) less than required 40%"

def test_ema_preserves_signal():
    """Test that EMA smoothing preserves the underlying signal."""
    # Generate clean sine wave
    fps = 60
    y_series = generate_noisy_sine(freq=1.0, duration=2.0, fps=fps, noise_std=0.0)
    
    # Calculate velocities with and without smoothing
    raw_metrics = calcVelocity(y_series.tolist(), fps, {"smoothing": False})
    smoothed_metrics = calcVelocity(y_series.tolist(), fps, {"smoothing": True, "alpha": 0.2})
    
    # Get peak velocities
    raw_peak = raw_metrics[0].peak if raw_metrics else 0
    smoothed_peak = smoothed_metrics[0].peak if smoothed_metrics else 0
    
    if not raw_peak or not smoothed_peak:
        pytest.fail("No velocity data generated")
    
    # Assert peak velocities are within 10% of each other
    peak_diff = abs(raw_peak - smoothed_peak) / raw_peak * 100
    assert peak_diff <= 10, f"Peak velocity difference ({peak_diff:.1f}%) exceeds 10%"

def test_configurable_smoothing():
    """Test that smoothing can be configured and disabled."""
    # Generate noisy sine wave
    fps = 60
    y_series = generate_noisy_sine(freq=1.0, duration=2.0, fps=fps, noise_std=0.1)
    
    # Calculate velocities with different smoothing configs
    raw_metrics = calcVelocity(y_series.tolist(), fps, {"smoothing": False})
    light_smooth = calcVelocity(y_series.tolist(), fps, {"smoothing": True, "alpha": 0.5})
    heavy_smooth = calcVelocity(y_series.tolist(), fps, {"smoothing": True, "alpha": 0.1})
    
    # Get velocities from first rep
    raw_velocities = raw_metrics[0].v_raw if raw_metrics else []
    light_velocities = light_smooth[0].v_smooth if light_smooth else []
    heavy_velocities = heavy_smooth[0].v_smooth if heavy_smooth else []
    
    if not all([raw_velocities, light_velocities, heavy_velocities]):
        pytest.fail("No velocity data generated")
    
    # Calculate standard deviations
    raw_std = np.std(raw_velocities)
    light_std = np.std(light_velocities)
    heavy_std = np.std(heavy_velocities)
    
    # Assert more aggressive smoothing (lower alpha) reduces noise more
    assert heavy_std < light_std < raw_std, "Smoothing strength not working as expected" 