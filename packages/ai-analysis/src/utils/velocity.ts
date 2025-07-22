import { savitzkyGolay } from './filters';

interface VelocityMetric {
  repIdx: number;
  peak: number;
  mean: number;
  displacement: number;
  v_raw?: number[];
  v_smooth?: number[];
}

interface VelocityConfig {
  smoothing: boolean;
  alpha: number;
}

const DEFAULT_CONFIG: VelocityConfig = {
  smoothing: true,
  alpha: 0.2
};

/**
 * Apply exponential moving average smoothing to a series of values
 * @param values Array of values to smooth
 * @param alpha Smoothing factor (0-1), lower = more smoothing
 * @returns Smoothed values
 */
function applyEMA(values: number[], alpha: number): number[] {
  if (values.length === 0) return [];
  
  const smoothed = [values[0]];
  for (let i = 1; i < values.length; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }
  return smoothed;
}

// TODO-MVP: Add confidence scoring system for velocity measurements
// TODO-MVP: Implement outlier detection for velocity data points
// TODO-MVP: Add error bounds and validation for velocity calculations

/**
 * Calculate velocity metrics for a series of vertical positions
 * @param ySeries Vertical positions in meters per frame
 * @param fps Frames per second
 * @param config Optional configuration for velocity calculation
 * @returns Array of velocity metrics per rep
 */
export function calcVelocity(
  ySeries: number[],
  fps: number,
  config: Partial<VelocityConfig> = {}
): VelocityMetric[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (ySeries.length < 2) {
    return [];
  }

  // Apply Savitzky-Golay filter to smooth the position data
  const smoothedY = savitzkyGolay(ySeries, 5, 2); // 5-point window, 2nd order

  // Calculate raw velocities by differentiating position
  const rawVelocities: number[] = [];
  for (let i = 1; i < smoothedY.length; i++) {
    const dt = 1 / fps;
    const dy = smoothedY[i] - smoothedY[i - 1];
    rawVelocities.push(dy / dt);
  }

  // Apply EMA smoothing if enabled
  const velocities = finalConfig.smoothing 
    ? applyEMA(rawVelocities, finalConfig.alpha)
    : rawVelocities;

  // Detect rep boundaries via zero-crossings
  const repBoundaries: number[] = [0]; // Start with first frame
  for (let i = 1; i < velocities.length; i++) {
    if (velocities[i - 1] < 0 && velocities[i] >= 0) {
      repBoundaries.push(i);
    }
  }
  // Add last frame as final boundary if not already included
  if (repBoundaries[repBoundaries.length - 1] !== velocities.length - 1) {
    repBoundaries.push(velocities.length - 1);
  }

  // Calculate metrics for each rep
  const metrics: VelocityMetric[] = [];
  for (let i = 0; i < repBoundaries.length - 1; i++) {
    const start = repBoundaries[i];
    const end = repBoundaries[i + 1];
    const repVelocities = velocities.slice(start, end);
    const repRawVelocities = rawVelocities.slice(start, end);
    
    if (repVelocities.length === 0) continue;
    
    // Calculate peak velocity (absolute max)
    const peak = Math.max(...repVelocities.map(Math.abs));
    
    // Calculate mean velocity
    const mean = repVelocities.reduce((sum, v) => sum + Math.abs(v), 0) / repVelocities.length;
    
    // Calculate total displacement
    const displacement = Math.abs(smoothedY[end] - smoothedY[start]);

    metrics.push({
      repIdx: i,
      peak,
      mean,
      displacement,
      v_raw: repRawVelocities,
      v_smooth: repVelocities
    });
  }

  return metrics;
} 