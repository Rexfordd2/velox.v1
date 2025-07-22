interface CalibrationPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface CalibrationResult {
  pixelsPerCm: number;
  confidence: number;
}

const REFERENCE_OBJECT_CM = 20; // Standard 20cm reference object
const MIN_POINTS_REQUIRED = 10;
const MIN_SWEEP_DISTANCE_PX = 100;
const MAX_CALIBRATION_TIME_MS = 5000;

export class CameraCalibrator {
  private points: CalibrationPoint[] = [];
  private startTime: number = 0;
  private deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  /**
   * Start a new calibration session
   */
  public startCalibration() {
    this.points = [];
    this.startTime = Date.now();
  }

  /**
   * Add a calibration point from tracked object
   */
  public addPoint(x: number, y: number): boolean {
    const now = Date.now();
    
    // Enforce time limit
    if (now - this.startTime > MAX_CALIBRATION_TIME_MS) {
      return false;
    }

    this.points.push({ x, y, timestamp: now });
    return true;
  }

  /**
   * Calculate calibration result from collected points
   */
  public calculateCalibration(): CalibrationResult | null {
    if (this.points.length < MIN_POINTS_REQUIRED) {
      return null;
    }

    // Calculate total path length in pixels
    let totalDistance = 0;
    for (let i = 1; i < this.points.length; i++) {
      const dx = this.points[i].x - this.points[i-1].x;
      const dy = this.points[i].y - this.points[i-1].y;
      totalDistance += Math.sqrt(dx*dx + dy*dy);
    }

    if (totalDistance < MIN_SWEEP_DISTANCE_PX) {
      return null;
    }

    // Calculate pixels per cm using reference object
    const pixelsPerCm = totalDistance / REFERENCE_OBJECT_CM;

    // Calculate confidence based on number of points and sweep coverage
    const confidence = Math.min(
      1.0,
      (this.points.length / MIN_POINTS_REQUIRED) * 
      (totalDistance / MIN_SWEEP_DISTANCE_PX)
    );

    return { pixelsPerCm, confidence };
  }

  /**
   * Save calibration to local storage
   */
  public saveCalibration(result: CalibrationResult) {
    localStorage.setItem(
      `camera_calibration_${this.deviceId}`,
      JSON.stringify({
        ...result,
        timestamp: Date.now()
      })
    );
  }

  /**
   * Load saved calibration for device
   */
  public loadCalibration(): CalibrationResult | null {
    const saved = localStorage.getItem(`camera_calibration_${this.deviceId}`);
    if (!saved) return null;
    
    try {
      const { pixelsPerCm, confidence, timestamp } = JSON.parse(saved);
      
      // Validate saved calibration
      if (typeof pixelsPerCm !== 'number' || typeof confidence !== 'number') {
        return null;
      }
      
      return { pixelsPerCm, confidence };
    } catch {
      return null;
    }
  }
} 