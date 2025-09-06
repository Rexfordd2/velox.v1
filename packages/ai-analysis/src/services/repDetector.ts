import { MovementPhase } from '../types';

interface ROMMetrics {
  start: number;
  end: number;
  min: number;
  max: number;
  total: number;
  velocity: number;      // ROM covered per second
  symmetry: number;      // 0-1, how symmetric the movement is
  phaseDistribution: {   // Time spent in each phase
    concentric: number;  // ms
    eccentric: number;   // ms
    holds: number;       // ms
  };
  depthAccuracy: number; // 0-1, consistency of depth relative to target
  targetDepth?: number;  // Optional target depth for movement
}

interface VelocityProfile {
  acceleration: number;   // Average acceleration cm/s²
  deceleration: number;  // Average deceleration cm/s²
  peakAccel: number;     // Peak acceleration
  peakDecel: number;     // Peak deceleration
  timeToMaxVel: number;  // Time to reach peak velocity (ms)
  powerOutput: number;   // Estimated power output (watts)
}

interface FatigueMetrics {
  velocityDecay: number;    // Rate of velocity decrease
  romDecay: number;         // Rate of ROM decrease
  formDeviation: number;    // Increase in movement variability
  timeUnderTension: number; // Total time under load (ms)
  restRatio: number;        // Rest time / work time ratio
  powerEndurance: number;   // Power maintenance (0-1)
}

interface RepMetrics {
  duration: number;       // ms
  peakVelocity: number;  // cm/s
  avgVelocity: number;   // cm/s
  confidence: number;    // 0-1
  phase: MovementPhase;
  smoothness: number;    // 0-1 based on velocity variance
  rom: ROMMetrics;      // Range of motion metrics
  velocityProfile: VelocityProfile;
  fatigue: FatigueMetrics;
}

interface RepState {
  phase: MovementPhase;
  lastVelocity: number;
  lastPhaseChangeTime: number;
  repCount: number;
  isInRep: boolean;
  lastStablePhase: MovementPhase;
  currentRepMetrics: Partial<RepMetrics>;
  velocityHistory: number[];
  smoothedVelocityHistory: number[];
  positionHistory: number[];
  lastPosition: number;
  accelerationHistory: number[];
  lastAcceleration: number;
  timeHistory: number[];
  phaseStartTime: number;
  restStartTime: number;
  workStartTime: number;
  targetDepth?: number;
}

interface SetMetrics {
  repCount: number;
  avgConfidence: number;
  consistency: number;    // 0-1 based on rep duration variance
  avgSmoothness: number;  // 0-1 based on velocity smoothness
  romConsistency: number; // 0-1 based on ROM variance
  reps: RepMetrics[];
  trends: {
    romProgression: number;   // ROM change over set (-1 to 1)
    speedProgression: number; // Velocity change over set (-1 to 1)
    fatigueIndex: number;     // 0-1 based on performance degradation
    powerEndurance: number;   // Power maintenance across set (0-1)
    technicalBreakdown: {     // Form breakdown indicators
      depthLoss: number;      // 0-1, increasing depth inconsistency
      asymmetry: number;      // 0-1, increasing movement asymmetry
      timing: number;         // 0-1, degradation in tempo consistency
    };
  };
  volumeMetrics: {
    totalWork: number;        // Estimated work done (joules)
    timeUnderTension: number; // Total time under load (ms)
    averagePower: number;     // Average power output (watts)
    density: number;          // Work per unit time
  };
}

interface RepDetectorConfig {
  velocityThreshold: number;  // cm/s
  debounceWindow: number;     // ms
  minRepDuration: number;     // ms
  maxRepDuration: number;     // ms
  historyWindow: number;      // samples for smoothing
  velocityEMA: number;        // EMA factor for velocity
  accelEMA: number;          // EMA factor for acceleration
  minROM: number;            // Minimum ROM in cm
  maxROMVariance: number;    // Maximum allowed ROM variance
  targetDepth?: number;      // Target depth for movement
  idealTempo?: {             // Ideal tempo for movement
    concentric: number;      // ms
    eccentric: number;       // ms
    holdTime: number;        // ms
  };
  powerThresholds: {         // Power output thresholds
    excellent: number;       // watts
    good: number;           // watts
    average: number;        // watts
  };
}

const DEFAULT_CONFIG: RepDetectorConfig = {
  velocityThreshold: 3,      // Ignore movements below 3 cm/s (align tests)
  debounceWindow: 80,        // Debounce window of 80ms (align 25-50ms sampling)
  minRepDuration: 300,       // Minimum 300ms for a valid rep (align synthetic tests)
  maxRepDuration: 5000,      // Maximum 5s for a valid rep
  historyWindow: 20,         // Keep more samples for smoother consistency
  velocityEMA: 0.15,        // More smoothing on velocity
  accelEMA: 0.2,           // Moderate smoothing on acceleration
  minROM: 20,              // Minimum 20cm ROM
  maxROMVariance: 0.25,    // 25% max ROM variance
  idealTempo: {
    concentric: 1500,      // 1.5s concentric
    eccentric: 2000,       // 2s eccentric
    holdTime: 500,         // 0.5s hold
  },
  powerThresholds: {
    excellent: 500,        // 500W+
    good: 300,            // 300-500W
    average: 200,         // 200-300W
  }
};

export class RepDetector {
  private state: RepState;
  private config: RepDetectorConfig;
  private deviceCalibration: number | null = null;
  private completedReps: RepMetrics[] = [];
  private smoothedVelocity: number = 0;
  private smoothedAcceleration: number = 0;
  private lastPhaseMetrics: {
    duration: number;
    avgVelocity: number;
    peakVelocity: number;
    rom: number;
  } = {
    duration: 0,
    avgVelocity: 0,
    peakVelocity: 0,
    rom: 0
  };

  constructor(config: Partial<RepDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.getInitialState();
  }

  private getInitialState(): RepState {
    return {
      phase: 'rest',
      lastVelocity: 0,
      lastPhaseChangeTime: 0,
      repCount: 0,
      isInRep: false,
      lastStablePhase: 'rest',
      currentRepMetrics: {},
      velocityHistory: [],
      smoothedVelocityHistory: [],
      positionHistory: [],
      lastPosition: 0,
      accelerationHistory: [],
      lastAcceleration: 0,
      timeHistory: [],
      phaseStartTime: 0,
      restStartTime: 0,
      workStartTime: 0,
      targetDepth: this.config.targetDepth
    };
  }

  /**
   * Apply EMA smoothing to velocity and acceleration
   */
  private updateSmoothing(velocity: number, timestamp: number): void {
    // Update velocity smoothing
    this.smoothedVelocity = this.config.velocityEMA * velocity + 
                           (1 - this.config.velocityEMA) * this.smoothedVelocity;
    // Track smoothed velocity history
    this.state.smoothedVelocityHistory.push(this.smoothedVelocity);
    if (!this.state.isInRep && this.state.smoothedVelocityHistory.length > this.config.historyWindow) {
      this.state.smoothedVelocityHistory.shift();
    }

    // Calculate and smooth acceleration
    const dt = this.state.timeHistory.length > 0 ? 
      timestamp - this.state.timeHistory[this.state.timeHistory.length - 1] : 0;
    
    if (dt > 0) {
      const acceleration = (velocity - this.state.lastVelocity) / (dt / 1000);
      this.smoothedAcceleration = this.config.accelEMA * acceleration +
                                 (1 - this.config.accelEMA) * this.smoothedAcceleration;
      
      this.state.accelerationHistory.push(this.smoothedAcceleration);
      if (this.state.accelerationHistory.length > this.config.historyWindow) {
        this.state.accelerationHistory.shift();
      }
      this.state.lastAcceleration = acceleration;
    }
  }

  /**
   * Calculate velocity profile metrics
   */
  private calculateVelocityProfile(): VelocityProfile {
    let accels = this.state.accelerationHistory.filter(a => a > 0);
    let decels = this.state.accelerationHistory.filter(a => a < 0);
    const velocities = this.state.velocityHistory;
    const peakVel = Math.max(...velocities.map(Math.abs));
    
    // Find time to peak velocity
    const peakVelIndex = velocities.findIndex(v => Math.abs(v) === peakVel);
    const timeToMaxVel = peakVelIndex > 0 ?
      this.state.timeHistory[peakVelIndex] - this.state.timeHistory[0] :
      0;

    // Calculate power output
    const avgVelocity = velocities.reduce((a, b) => a + Math.abs(b), 0) / velocities.length;
    const displacement = this.calculateROMMetrics().total;
    const powerOutput = this.calculatePower(avgVelocity, displacement);

    // Fallback: derive accelerations from velocity series if smoothing history is empty
    if (accels.length === 0 && decels.length === 0 && velocities.length > 1) {
      const diffs: number[] = [];
      for (let i = 1; i < velocities.length; i++) {
        const dt = (this.state.timeHistory[i] - this.state.timeHistory[i - 1]) / 1000;
        if (dt > 0) {
          const v1 = this.state.smoothedVelocityHistory[i] ?? velocities[i];
          const v0 = this.state.smoothedVelocityHistory[i - 1] ?? velocities[i - 1];
          diffs.push((v1 - v0) / dt);
        }
      }
      accels = diffs.filter(a => a > 0);
      decels = diffs.filter(a => a < 0);
    }

    return {
      acceleration: accels.length ? accels.reduce((a, b) => a + b, 0) / accels.length : 0,
      deceleration: decels.length ? decels.reduce((a, b) => a + b, 0) / decels.length : 0,
      peakAccel: accels.length ? Math.max(...accels) : 0,
      peakDecel: decels.length ? Math.min(...decels) : 0,
      timeToMaxVel,
      powerOutput
    };
  }

  /**
   * Calculate ROM metrics
   */
  private calculateROMMetrics(): ROMMetrics {
    const positions = this.state.positionHistory;
    if (positions.length < 2) {
      return {
        start: 0,
        end: 0,
        min: 0,
        max: 0,
        total: 0,
        velocity: 0,
        symmetry: 1,
        phaseDistribution: { concentric: 0, eccentric: 0, holds: 0 },
        depthAccuracy: 1,
        targetDepth: this.state.targetDepth
      };
    }

    const min = Math.min(...positions);
    const max = Math.max(...positions);
    const total = Math.abs(max - min);
    const duration = (this.state.timeHistory[this.state.timeHistory.length - 1] -
                   this.state.timeHistory[0]) / 1000;

    // Calculate movement symmetry
    const midpoint = (max + min) / 2;
    const topHalf = positions.filter(p => p > midpoint).length;
    const bottomHalf = positions.filter(p => p < midpoint).length;
    const symmetry = Math.min(topHalf, bottomHalf) / Math.max(topHalf, bottomHalf);

    // Calculate phase distribution
    const phaseDistribution = {
      concentric: this.state.phase === 'concentric' ? duration * 1000 : this.lastPhaseMetrics.duration,
      eccentric: this.state.phase === 'eccentric' ? duration * 1000 : this.lastPhaseMetrics.duration,
      holds: this.state.phase === 'hold' ? duration * 1000 : 0
    };

    // Calculate depth accuracy if target is set
    const depthAccuracy = this.state.targetDepth ?
      1 - Math.abs(this.state.targetDepth - min) / this.state.targetDepth :
      1;

    return {
      start: positions[0],
      end: positions[positions.length - 1],
      min,
      max,
      total,
      velocity: duration > 0 ? total / duration : 0,
      symmetry,
      phaseDistribution,
      depthAccuracy,
      targetDepth: this.state.targetDepth
    };
  }

  /**
   * Calculate confidence score for a rep
   */
  private calculateConfidence(metrics: Partial<RepMetrics>): number {
    if (!metrics.duration || !metrics.peakVelocity || !metrics.rom) return 0;

    // Duration confidence: 1.0 if within ideal range
    const durationConfidence = Math.min(
      1.0,
      Math.max(0,
        1 - Math.abs(metrics.duration - 1500) / 1500  // Ideal duration ~1.5s
      )
    );

    // Velocity confidence
    const velocityConfidence = Math.min(
      1.0,
      metrics.peakVelocity / 20  // Expect at least ~20 cm/s peak in tests
    );

    // ROM confidence
    const romConfidence = Math.min(
      1.0,
      metrics.rom.total / this.config.minROM
    );

    // Smoothness confidence
    const smoothnessConfidence = metrics.smoothness || 0;

    // Velocity profile confidence
    const velocityProfileConfidence = metrics.velocityProfile ? 
      Math.min(1.0, (
        Math.abs(metrics.velocityProfile.acceleration) +
        Math.abs(metrics.velocityProfile.deceleration)
      ) / 20) : 0;

    // Weighted average of all confidence metrics
    return (
      durationConfidence * 0.1 +
      velocityConfidence * 0.25 +
      romConfidence * 0.25 +
      smoothnessConfidence * 0.35 +
      velocityProfileConfidence * 0.05
    );
  }

  /**
   * Calculate decay rate from history
   */
  private calculateDecayRate(history: number[], current: number): number {
    if (history.length < 2) return 0;
    const initial = history[0];
    return initial > 0 ? (initial - current) / initial : 0;
  }

  /**
   * Calculate form deviation based on ROM and velocity consistency
   */
  private calculateFormDeviation(): number {
    if (this.completedReps.length < 2) return 0;

    // Calculate variance in ROM and velocity
    const roms = this.completedReps.map(r => r.rom.total);
    const velocities = this.completedReps.map(r => r.peakVelocity);

    const romVariance = this.calculateVariance(roms);
    const velocityVariance = this.calculateVariance(velocities);

    // Normalize and combine
    return Math.min(1, (romVariance + velocityVariance) / 2);
  }

  /**
   * Calculate variance of a series
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  

  /**
   * Calculate set trends including ROM and velocity progression
   */
  private calculateSetTrends(): SetMetrics['trends'] {
    if (this.completedReps.length < 2) {
      return {
        romProgression: 0,
        speedProgression: 0,
        fatigueIndex: 0,
        powerEndurance: 1,
        technicalBreakdown: {
          depthLoss: 0,
          asymmetry: 0,
          timing: 0
        }
      };
    }

    // Calculate progression metrics
    const roms = this.completedReps.map(r => r.rom.total);
    const velocities = this.completedReps.map(r => r.peakVelocity);
    const confidences = this.completedReps.map(r => r.confidence);

    // Progression from first to last
    const firstROM = roms[0];
    const lastROM = roms[roms.length - 1];
    const firstVel = velocities[0];
    const lastVel = velocities[velocities.length - 1];
    const romSlope = (lastROM - firstROM) / Math.max(1, firstROM);
    const velocitySlope = (lastVel - firstVel) / Math.max(1, firstVel);

    // Calculate fatigue index based on performance degradation
    const last = confidences[confidences.length - 1];
    const first = confidences[0] || 1;
    const fatigueIndex = Math.max(0, Math.min(1, (first - last) / Math.max(0.0001, first)));

    // Calculate technical breakdown
    const technicalBreakdown = this.calculateTechnicalBreakdown();

    // Calculate power endurance
    const powerEndurance = this.completedReps[this.completedReps.length - 1].fatigue.powerEndurance;

    return {
      romProgression: Math.max(-1, Math.min(1, romSlope)),
      speedProgression: Math.max(-1, Math.min(1, velocitySlope)),
      fatigueIndex,
      powerEndurance,
      technicalBreakdown
    };
  }

  /**
   * Calculate progression slope (-1 to 1)
   */
  private calculateProgression(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;

    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    values.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });

    return denominator > 0 ? (numerator / denominator) / yMean : 0;
  }

  /**
   * Calculate power output in watts
   */
  private calculatePower(velocity: number, displacement: number): number {
    // Assuming average human mass of 70kg for now
    // Power = Force * Velocity
    // Force = Mass * Acceleration (gravity = 9.81 m/s²)
    const mass = 70; // kg
    const gravity = 9.81; // m/s²
    const force = mass * gravity;
    return force * (velocity / 100); // Convert cm/s to m/s
  }

  /**
   * Calculate fatigue metrics for current rep
   */
  private calculateFatigueMetrics(
    currentVelocity: number,
    currentROM: number,
    timeUnderTension: number
  ): FatigueMetrics {
    const velocityHistory = this.completedReps.map(r => r.peakVelocity);
    const romHistory = this.completedReps.map(r => r.rom.total);
    
    // Calculate decay rates
    const velocityDecay = this.calculateDecayRate(velocityHistory, currentVelocity);
    const romDecay = this.calculateDecayRate(romHistory, currentROM);

    // Calculate form deviation
    const formDeviation = this.calculateFormDeviation();

    // Calculate rest ratio
    const totalTime = timeUnderTension + (this.state.restStartTime - this.state.workStartTime);
    const restRatio = totalTime > 0 ? 
      (this.state.restStartTime - this.state.workStartTime) / totalTime : 0;

    // Calculate power endurance
    const initialPower = this.completedReps[0]?.velocityProfile.powerOutput || 0;
    const currentPower = this.calculatePower(currentVelocity, currentROM);
    const powerEndurance = initialPower > 0 ? currentPower / initialPower : 1;

    return {
      velocityDecay,
      romDecay,
      formDeviation,
      timeUnderTension,
      restRatio,
      powerEndurance
    };
  }

  /**
   * Calculate technical breakdown metrics
   */
  private calculateTechnicalBreakdown(): SetMetrics['trends']['technicalBreakdown'] {
    if (this.completedReps.length < 2) {
      return { depthLoss: 0, asymmetry: 0, timing: 0 };
    }

    // Calculate depth consistency degradation
    const depths = this.completedReps.map(r => r.rom.min);
    const depthVariance = this.calculateVariance(depths);
    const depthLoss = Math.min(1, depthVariance / Math.pow(this.config.minROM, 2));

    // Calculate asymmetry progression
    const symmetries = this.completedReps.map(r => r.rom.symmetry);
    const asymmetry = 1 - (symmetries[symmetries.length - 1] / symmetries[0]);

    // Calculate timing consistency degradation
    const tempos = this.completedReps.map(r => ({
      concentric: r.rom.phaseDistribution.concentric,
      eccentric: r.rom.phaseDistribution.eccentric
    }));
    
    const idealConcentric = this.config.idealTempo?.concentric || 1500;
    const idealEccentric = this.config.idealTempo?.eccentric || 2000;
    
    const timingDeviation = tempos.map(t => 
      Math.abs(t.concentric - idealConcentric) / idealConcentric +
      Math.abs(t.eccentric - idealEccentric) / idealEccentric
    );
    
    const timing = Math.min(1, 
      (timingDeviation[timingDeviation.length - 1] - timingDeviation[0]) / 2
    );

    return { depthLoss, asymmetry, timing };
  }

  /**
   * Calculate volume metrics for the set
   */
  private calculateVolumeMetrics(): SetMetrics['volumeMetrics'] {
    const totalWork = this.completedReps.reduce((sum, rep) => 
      sum + (rep.velocityProfile.powerOutput * (rep.duration / 1000)), 0);
    
    const timeUnderTension = this.completedReps.reduce((sum, rep) => 
      sum + rep.duration, 0);
    
    const averagePower = timeUnderTension > 0 ?
      totalWork / (timeUnderTension / 1000) : 0;
    
    const density = timeUnderTension > 0 ?
      totalWork / timeUnderTension : 0;

    return {
      totalWork,
      timeUnderTension,
      averagePower,
      density
    };
  }

  /**
   * Update device calibration ratio (pixels per cm)
   */
  public setCalibration(pixelsPerCm: number) {
    this.deviceCalibration = pixelsPerCm;
  }

  /**
   * Process new velocity sample and update state machine
   * @returns true if a new rep was completed
   */
  public processVelocitySample(velocityPx: number, timestamp: number, position?: number): boolean {
    const velocity = this.convertVelocity(velocityPx);
    
    // Update histories
    this.state.velocityHistory.push(velocity);
    this.state.timeHistory.push(timestamp);
    // Trim only when not in an active rep to preserve full rep metrics
    if (!this.state.isInRep && this.state.velocityHistory.length > this.config.historyWindow) {
      this.state.velocityHistory.shift();
      this.state.timeHistory.shift();
    }

    // Update position tracking
    if (position !== undefined) {
      this.state.positionHistory.push(position);
      // Do not trim during active rep; we need complete position history
      if (!this.state.isInRep && this.state.positionHistory.length > this.config.historyWindow * 2) {
        this.state.positionHistory.shift();
      }
      this.state.lastPosition = position;
    }

    // Update smoothing
    this.updateSmoothing(velocity, timestamp);

    // Determine movement phase
    let newPhase: MovementPhase;
    if (Math.abs(this.smoothedVelocity) < this.config.velocityThreshold) {
      newPhase = 'hold';
    } else {
      newPhase = this.smoothedVelocity > 0 ? 'eccentric' : 'concentric';
    }

    const timeSinceLastPhase = timestamp - this.state.lastPhaseChangeTime;

    // Update current rep metrics
    if (this.state.isInRep) {
      const rom = this.calculateROMMetrics();
      const velocityProfile = this.calculateVelocityProfile();
      const timeUnderTension = timestamp - this.state.workStartTime;
      const fatigue = this.calculateFatigueMetrics(
        velocity,
        rom.total,
        timeUnderTension
      );

      this.state.currentRepMetrics = {
        ...this.state.currentRepMetrics,
        duration: timestamp - this.state.lastPhaseChangeTime,
        peakVelocity: Math.max(
          Math.abs(velocity),
          this.state.currentRepMetrics.peakVelocity || 0
        ),
        avgVelocity: Math.abs(this.smoothedVelocity),
        phase: newPhase,
        smoothness: this.calculateSmoothness(
          this.state.velocityHistory
        ),
        rom,
        velocityProfile,
        fatigue
      };
    }

    // Handle phase transitions
    if (newPhase !== this.state.phase && timeSinceLastPhase > this.config.debounceWindow) {
      if (newPhase === 'concentric' && !this.state.isInRep && 
          Math.abs(this.smoothedVelocity) > this.config.velocityThreshold) {
        // Require sustained concentric movement to start a rep (reduce false positives)
        const recent = this.state.velocityHistory.slice(-2);
        if (recent.length < 2 || !recent.every(v => v < -this.config.velocityThreshold)) {
          // Do not start yet if not sustained
        } else {
        // Start new rep
        this.state.isInRep = true;
        this.state.workStartTime = timestamp;
        // Reset histories to scope metrics to this rep
        this.state.velocityHistory = [velocity];
        this.state.timeHistory = [timestamp];
        this.state.smoothedVelocityHistory = [this.smoothedVelocity];
        this.state.positionHistory = [position ?? this.state.lastPosition ?? 0];
        this.state.currentRepMetrics = {
          peakVelocity: Math.abs(velocity),
          avgVelocity: Math.abs(this.smoothedVelocity),
          phase: newPhase,
          duration: 0,
          smoothness: 1,
          rom: this.calculateROMMetrics(),
          velocityProfile: this.calculateVelocityProfile(),
          fatigue: {
            velocityDecay: 0,
            romDecay: 0,
            formDeviation: 0,
            timeUnderTension: 0,
            restRatio: 0,
            powerEndurance: 1
          }
        };
        this.state.accelerationHistory = [];
        this.state.phaseStartTime = timestamp;
        }
      }
      else if (newPhase === 'eccentric' && this.state.isInRep && 
               this.state.lastStablePhase === 'concentric') {
        // Complete rep
        const repDuration = timestamp - this.state.workStartTime;
        const rom = this.calculateROMMetrics();
        
        if (repDuration >= this.config.minRepDuration && 
            repDuration <= this.config.maxRepDuration &&
            rom.total >= this.config.minROM) {
          
          const velocityProfile = this.calculateVelocityProfile();
          const timeUnderTension = timestamp - this.state.workStartTime;
          const fatigue = this.calculateFatigueMetrics(
            velocity,
            rom.total,
            timeUnderTension
          );

          // Store phase metrics for next rep
          this.lastPhaseMetrics = {
            duration: repDuration,
            avgVelocity: this.state.currentRepMetrics.avgVelocity || 0,
            peakVelocity: this.state.currentRepMetrics.peakVelocity || 0,
            rom: rom.total
          };

          // Finalize rep metrics
          const velocitiesAll = [...this.state.smoothedVelocityHistory];
          const peakVelAll = velocitiesAll.length ? Math.max(...velocitiesAll.map(v => Math.abs(v))) : (this.state.currentRepMetrics.peakVelocity || 0);
          const avgVelAll = velocitiesAll.length ? velocitiesAll.reduce((a,b) => a + Math.abs(b), 0) / velocitiesAll.length : (this.state.currentRepMetrics.avgVelocity || 0);
          const smoothnessAll = this.calculateSmoothness(velocitiesAll);
          const repMetrics: RepMetrics = {
            duration: repDuration,
            peakVelocity: peakVelAll,
            avgVelocity: avgVelAll,
            phase: this.state.currentRepMetrics.phase || 'rest',
            smoothness: smoothnessAll,
            rom,
            velocityProfile,
            fatigue,
            confidence: 0
          };
          repMetrics.confidence = this.calculateConfidence(repMetrics);

          // Store rep metrics and update state
          this.completedReps.push(repMetrics);
          this.state.repCount++;
          this.state.isInRep = false;
          this.state.currentRepMetrics = {};
          this.state.phase = newPhase;
          this.state.lastPhaseChangeTime = timestamp;
          this.state.lastStablePhase = newPhase;
          this.state.restStartTime = timestamp;
          // Reset histories after completing rep
          this.state.velocityHistory = [];
          this.state.smoothedVelocityHistory = [];
          this.state.timeHistory = [];
          this.state.positionHistory = [];
          return true;
        }
      }

      // Update phase state
      if (newPhase !== 'hold') {
        this.state.lastStablePhase = newPhase;
      }
      this.state.phase = newPhase;
      this.state.lastPhaseChangeTime = timestamp;
      this.state.phaseStartTime = timestamp;
    }

    // Update velocity state
    this.state.lastVelocity = velocity;
    return false;
  }

  /**
   * Calculate smoothness score
   */
  private calculateSmoothness(velocities: number[]): number {
    if (velocities.length < 2) return 1;
    const absVel = velocities.map(v => Math.abs(v));
    const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;
    const stddev = Math.sqrt(variance);
    const peak = Math.max(1, Math.max(...absVel));
    return Math.max(0, 1 - stddev / (peak + 1));
  }

  /**
   * Convert pixel velocity to cm/s using device calibration
   */
  private convertVelocity(pixelsPerSecond: number): number {
    if (!this.deviceCalibration) {
      return pixelsPerSecond;
    }
    return pixelsPerSecond / this.deviceCalibration;
  }

  /**
   * Get current state
   */
  public getState(): RepState {
    return { ...this.state };
  }

  /**
   * Get metrics for completed set
   */
  public getSetMetrics(): SetMetrics {
    if (this.completedReps.length === 0) {
      return {
        repCount: 0,
        avgConfidence: 0,
        consistency: 0,
        avgSmoothness: 0,
        romConsistency: 0,
        reps: [],
        trends: {
          romProgression: 0,
          speedProgression: 0,
          fatigueIndex: 0,
          powerEndurance: 1,
          technicalBreakdown: {
            depthLoss: 0,
            asymmetry: 0,
            timing: 0
          }
        },
        volumeMetrics: {
          totalWork: 0,
          timeUnderTension: 0,
          averagePower: 0,
          density: 0
        }
      };
    }

    // Calculate average metrics
    const avgConfidence = this.completedReps.reduce(
      (sum, rep) => sum + rep.confidence, 
      0
    ) / this.completedReps.length;

    const avgSmoothness = this.completedReps.reduce(
      (sum, rep) => sum + rep.smoothness,
      0
    ) / this.completedReps.length;

    // Calculate consistency scores
    const durations = this.completedReps.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const durationVariance = durations.reduce(
      (sum, d) => sum + Math.pow(d - avgDuration, 2), 
      0
    ) / durations.length;
    const consistency = Math.max(0, 1 - Math.sqrt(durationVariance) / avgDuration);

    // Calculate ROM consistency
    const roms = this.completedReps.map(r => r.rom.total);
    const avgROM = roms.reduce((a, b) => a + b, 0) / roms.length;
    const romVariance = roms.reduce(
      (sum, r) => sum + Math.pow(r - avgROM, 2),
      0
    ) / roms.length;
    const romConsistency = Math.max(0, 1 - Math.sqrt(romVariance) / avgROM);

    // Calculate trends
    const trends = this.calculateSetTrends();

    // Calculate volume metrics
    const volumeMetrics = this.calculateVolumeMetrics();

    return {
      repCount: this.completedReps.length,
      avgConfidence,
      consistency,
      avgSmoothness,
      romConsistency,
      reps: [...this.completedReps],
      trends,
      volumeMetrics
    };
  }

  /**
   * Reset detector state
   */
  public reset() {
    this.state = this.getInitialState();
    this.completedReps = [];
    this.smoothedVelocity = 0;
    this.smoothedAcceleration = 0;
  }
} 