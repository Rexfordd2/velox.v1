import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RepData {
  timestamp: number;
  exerciseName: string;
  velocity: {
    raw: number;
    calibrated: number;
  };
  rom: number;
  confidenceScore: number;
  phaseTransitions: {
    eccentric: number;
    concentric: number;
    lockout: number;
  };
  feedback?: string[];
}

interface SetSummary {
  totalReps: number;
  avgVelocity: number;
  avgROM: number;
  avgConfidence: number;
  fatigueIndex: number; // Percentage drop from first to last rep
}

export interface WorkoutSession {
  id: string;
  startTime: number;
  endTime?: number;
  exerciseName: string;
  reps: RepData[];
  summary?: {
    totalReps: number;
    avgVelocity: number;
    avgROM: number;
    avgConfidence: number;
    sets: SetSummary[];
  };
}

interface SessionDB extends DBSchema {
  sessions: {
    key: string;
    value: WorkoutSession;
    indexes: {
      'by-exercise': string;
      'by-date': number;
    };
  };
}

class SessionTracker {
  private db: IDBPDatabase<SessionDB> | null = null;
  private currentSession: WorkoutSession | null = null;
  private readonly SET_BREAK_THRESHOLD = 800; // Reduced from 3000ms to 800ms for testing

  async init() {
    this.db = await openDB<SessionDB>('velox-sessions', 1, {
      upgrade(db) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-exercise', 'exerciseName');
        sessionStore.createIndex('by-date', 'startTime');
      },
    });
  }

  async startSession(exerciseName: string): Promise<string> {
    if (!this.db) await this.init();
    
    const sessionId = crypto.randomUUID();
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      exerciseName,
      reps: [],
    };

    await this.db!.put('sessions', this.currentSession);
    return sessionId;
  }

  async recordRep(data: Omit<RepData, 'timestamp' | 'exerciseName'>) {
    if (!this.currentSession) throw new Error('No active session');

    const repData: RepData = {
      ...data,
      timestamp: Date.now(),
      exerciseName: this.currentSession.exerciseName,
    };

    this.currentSession.reps.push(repData);
    await this.db!.put('sessions', this.currentSession);
  }

  private calculateSetSummaries(reps: RepData[]): SetSummary[] {
    const sets: RepData[][] = [];
    let currentSet: RepData[] = [];

    reps.forEach((rep, i) => {
      if (i > 0 && rep.timestamp - reps[i - 1].timestamp > this.SET_BREAK_THRESHOLD) {
        if (currentSet.length > 0) sets.push(currentSet);
        currentSet = [];
      }
      currentSet.push(rep);
    });
    if (currentSet.length > 0) sets.push(currentSet);

    return sets.map(setReps => {
      const firstVel = setReps[0].velocity.calibrated;
      const lastVel = setReps[setReps.length - 1].velocity.calibrated;
      
      return {
        totalReps: setReps.length,
        avgVelocity: setReps.reduce((sum, rep) => sum + rep.velocity.calibrated, 0) / setReps.length,
        avgROM: setReps.reduce((sum, rep) => sum + rep.rom, 0) / setReps.length,
        avgConfidence: setReps.reduce((sum, rep) => sum + rep.confidenceScore, 0) / setReps.length,
        fatigueIndex: ((firstVel - lastVel) / firstVel) * 100,
      };
    });
  }

  async endSession(): Promise<WorkoutSession> {
    if (!this.currentSession) throw new Error('No active session');

    const sets = this.calculateSetSummaries(this.currentSession.reps);
    
    this.currentSession.endTime = Date.now();
    this.currentSession.summary = {
      totalReps: this.currentSession.reps.length,
      avgVelocity: sets.reduce((sum, set) => sum + set.avgVelocity, 0) / sets.length,
      avgROM: sets.reduce((sum, set) => sum + set.avgROM, 0) / sets.length,
      avgConfidence: sets.reduce((sum, set) => sum + set.avgConfidence, 0) / sets.length,
      sets,
    };

    await this.db!.put('sessions', this.currentSession);
    const session = { ...this.currentSession };
    this.currentSession = null;
    return session;
  }

  async getSession(id: string): Promise<WorkoutSession | undefined> {
    if (!this.db) await this.init();
    return this.db!.get('sessions', id);
  }

  async getSessions(limit = 10): Promise<WorkoutSession[]> {
    if (!this.db) await this.init();
    const sessions = await this.db!.getAllFromIndex('sessions', 'by-date');
    return sessions.sort((a, b) => b.startTime - a.startTime).slice(0, limit);
  }

  async getSessionsByExercise(exerciseName: string): Promise<WorkoutSession[]> {
    if (!this.db) await this.init();
    return this.db!.getAllFromIndex('sessions', 'by-exercise', exerciseName);
  }
}

export const sessionTracker = new SessionTracker(); 