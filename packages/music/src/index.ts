export * from './sources/spotify';
export * from './sources/local';
export * from './sources/veloxLib';
export * from './adherence';

export interface BeatEngine {
  setBpm(bpm: number): void;
  start(atMs?: number): void;
  stop(): void;
  onBeat(listener: (nowMs: number) => void): () => void;
}

export interface PlaybackControls {
  play(): Promise<void> | void;
  pause(): Promise<void> | void;
  seek(ms: number): Promise<void> | void;
  getPositionMs(): Promise<number> | number;
  getDurationMs(): Promise<number | null> | number | null;
}

export type VibeTag = 'chill' | 'hype' | 'focus' | 'groove' | 'epic' | 'retro';

export interface TrackSummary {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  energy?: number; // 0-1
  vibes?: VibeTag[];
  durationMs?: number;
}

export interface MusicSource {
  id: 'veloxLib' | 'spotify' | 'local' | 'silent';
  label: string;
  listByTempo?(bpm: number): Promise<TrackSummary[]>;
  loadById(id: string): Promise<{ controls: PlaybackControls; bpm: number; meta: TrackSummary }>;
}


