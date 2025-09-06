export type Strictness = 'balanced' | 'strict';

export interface RepEvent {
  startTs: number;
  endTs: number;
  phases: { ecc: number; iso: number; con: number };
  romDeg: number;
  depthScore: number;
  stabilityScore: number;
}

export interface FrameSample {
  ts: number; // milliseconds
  kneeFlexDeg: number; // knee flexion in degrees (0 extended → 140 deep)
  hipFlexDeg: number; // hip flexion in degrees (0 extended → 140 deep)
  barY: number; // vertical proxy (smaller = higher on screen). Use relative units
}

interface Thresholds {
  minRomDeg: number; // minimal total ROM to count a rep
  minDepthDeg: number; // minimal peak flexion (knee/hip) to count depth
  minStability: number; // allowed normalized jerkiness (lower is better)
  minPauseMs: number; // minimal pause at bottom/top to avoid bounce counting
  minConVelocity: number; // minimal upward velocity to start concentric
  minEccVelocity: number; // minimal downward velocity to start eccentric
}

function getThresholds(strictness: Strictness): Thresholds {
  const base: Thresholds = {
    minRomDeg: 45,
    minDepthDeg: 70,
    minStability: 0.6,
    minPauseMs: 80,
    minConVelocity: 0.02,
    minEccVelocity: 0.02,
  };
  if (strictness === 'strict') {
    return {
      minRomDeg: base.minRomDeg * 1.15,
      minDepthDeg: base.minDepthDeg * 1.15,
      minStability: Math.min(1, base.minStability * 1.15),
      minPauseMs: Math.round(base.minPauseMs * 1.15),
      minConVelocity: base.minConVelocity * 1.15,
      minEccVelocity: base.minEccVelocity * 1.15,
    };
  }
  return base;
}

type State = 'idle' | 'ecc' | 'bottom_iso' | 'con' | 'top_iso';

export class RepEngine {
  private readonly thresholds: Thresholds;

  private state: State = 'idle';
  private lastTs: number | null = null;
  private lastBarY: number | null = null;
  private lastHipDeg: number | null = null;
  private lastKneeDeg: number | null = null;

  private repStartTs: number | null = null;
  private phaseStartTs: number | null = null;
  private eccTime = 0;
  private isoTime = 0;
  private conTime = 0;
  private startHipDeg = 0;
  private startKneeDeg = 0;
  private peakFlexDeg = 0; // track max of hip/knee flex during ecc
  private romDeg = 0;
  private stabilityAccumulator = 0; // crude jerk metric from barY acceleration
  private prevVel: number | null = null;

  private events: RepEvent[] = [];

  constructor(private readonly strictness: Strictness = 'balanced') {
    this.thresholds = getThresholds(strictness);
  }

  getEvents(): RepEvent[] {
    return this.events;
  }

  ingest(sample: FrameSample) {
    const { ts, barY, hipFlexDeg, kneeFlexDeg } = normalizeSample(sample);

    if (this.lastTs == null) {
      this.lastTs = ts;
      this.lastBarY = barY;
      this.lastHipDeg = hipFlexDeg;
      this.lastKneeDeg = kneeFlexDeg;
      return;
    }

    const dt = Math.max(0, ts - this.lastTs);
    const barVel = (barY - (this.lastBarY as number)) / Math.max(1, dt); // px/ms (screen coords; negative = up)
    const barAcc = this.prevVel == null ? 0 : (barVel - this.prevVel);
    this.prevVel = barVel;

    // stability metric: accumulate absolute acceleration normalized
    this.stabilityAccumulator += Math.abs(barAcc);

    // track ROM
    const maxFlexThisFrame = Math.max(hipFlexDeg, kneeFlexDeg);
    this.peakFlexDeg = Math.max(this.peakFlexDeg, maxFlexThisFrame);

    switch (this.state) {
      case 'idle': {
        // start eccentric if moving down and flexion increasing
        const goingDown = barVel > this.thresholds.minEccVelocity;
        const flexing = maxFlexThisFrame > (this.lastHipDeg as number) || maxFlexThisFrame > (this.lastKneeDeg as number);
        if (goingDown && flexing) {
          this.transition('ecc', ts);
          this.repStartTs = ts;
          this.startHipDeg = hipFlexDeg;
          this.startKneeDeg = kneeFlexDeg;
        }
        break;
      }
      case 'ecc': {
        this.eccTime += dt;
        // detect bottom: velocity near zero and deep enough
        const nearZero = Math.abs(barVel) < this.thresholds.minEccVelocity;
        const deepEnough = this.peakFlexDeg >= this.thresholds.minDepthDeg;
        if (nearZero && deepEnough) {
          this.transition('bottom_iso', ts);
        }
        break;
      }
      case 'bottom_iso': {
        this.isoTime += dt;
        const stayedEnough = this.phaseDuration(ts) >= this.thresholds.minPauseMs;
        // start concentric if moving up
        const movingUp = barVel < -this.thresholds.minConVelocity;
        if (stayedEnough && movingUp) {
          this.transition('con', ts);
        }
        break;
      }
      case 'con': {
        this.conTime += dt;
        // detect top by velocity near zero and ROM satisfied
        const nearZero = Math.abs(barVel) < this.thresholds.minConVelocity;
        const currentFlex = Math.max(hipFlexDeg, kneeFlexDeg);
        const romCandidate = Math.max(0, this.peakFlexDeg - currentFlex);
        this.romDeg = Math.max(this.romDeg, romCandidate);
        if (nearZero && this.romDeg >= this.thresholds.minRomDeg) {
          this.transition('top_iso', ts);
        }
        break;
      }
      case 'top_iso': {
        const stayedEnough = this.phaseDuration(ts) >= this.thresholds.minPauseMs;
        if (stayedEnough) {
          this.finishRep(ts);
          this.transition('idle', ts);
        }
        break;
      }
    }

    this.lastTs = ts;
    this.lastBarY = barY;
    this.lastHipDeg = hipFlexDeg;
    this.lastKneeDeg = kneeFlexDeg;
  }

  private phaseDuration(ts: number): number {
    return this.phaseStartTs == null ? 0 : ts - this.phaseStartTs;
  }

  private transition(next: State, ts: number) {
    this.phaseStartTs = ts;
    this.state = next;
  }

  private finishRep(endTs: number) {
    const startTs = this.repStartTs ?? endTs;
    const totalTime = Math.max(1, endTs - startTs);
    const stabilityNorm = 1 - Math.min(1, this.stabilityAccumulator / (totalTime * 0.01));
    const stabilityScore = clamp01(stabilityNorm);
    const depthScore = clamp01(this.peakFlexDeg / Math.max(1, this.thresholds.minDepthDeg));

    const event: RepEvent = {
      startTs,
      endTs,
      phases: { ecc: this.eccTime, iso: this.isoTime, con: this.conTime },
      romDeg: this.romDeg,
      depthScore,
      stabilityScore,
    };
    this.events.push(event);

    // reset rep accumulators
    this.repStartTs = null;
    this.eccTime = 0;
    this.isoTime = 0;
    this.conTime = 0;
    this.peakFlexDeg = 0;
    this.romDeg = 0;
    this.stabilityAccumulator = 0;
    this.prevVel = null;
  }
}

function normalizeSample(s: FrameSample) {
  return s;
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}


