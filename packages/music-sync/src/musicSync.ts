import { Metronome } from './metronome';

export interface TempoSegment {
  startMs: number;
  endMs: number;
  bpm: number;
}

export interface MusicSyncConfig {
  defaultBpm?: number;
  onBeat?: () => void;
  onTempoChange?: (bpm: number) => void;
}

export class MusicSync {
  private metronome: Metronome | null = null;
  private tempoSegments: TempoSegment[] = [];
  private currentSegmentIndex = 0;
  private startTime: number | null = null;
  private config: MusicSyncConfig;
  private isSpotifyActive = false;
  private segmentInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: MusicSyncConfig = {}) {
    this.config = {
      defaultBpm: 100,
      ...config
    };
  }

  setTempoSegments(segments: TempoSegment[]) {
    this.tempoSegments = segments.sort((a, b) => a.startMs - b.startMs);
    this.currentSegmentIndex = 0;
  }

  // Seed from Spotify audio analysis sections
  seedFromSpotify(tempo: number | null | undefined, sections?: { start: number; duration: number; tempo?: number }[]) {
    const segs: TempoSegment[] = [];
    if (sections && sections.length > 0) {
      let t = 0;
      for (const s of sections) {
        const startMs = Math.round((s.start ?? t) * 1000);
        const endMs = Math.round((s.start + s.duration) * 1000);
        const bpm = Math.round(s.tempo ?? tempo ?? this.config.defaultBpm!);
        segs.push({ startMs, endMs, bpm });
        t = s.start + s.duration;
      }
    } else if (tempo) {
      // Single flat tempo segment for first 10 minutes
      segs.push({ startMs: 0, endMs: 10 * 60 * 1000, bpm: Math.round(tempo) });
    }
    if (segs.length) this.setTempoSegments(segs);
  }

  private getCurrentSegment(elapsedMs: number): TempoSegment | null {
    if (!this.tempoSegments.length) return null;

    // Find the segment containing the current time
    for (let i = 0; i < this.tempoSegments.length; i++) {
      const segment = this.tempoSegments[i];
      if (elapsedMs >= segment.startMs && elapsedMs < segment.endMs) {
        if (i !== this.currentSegmentIndex) {
          this.currentSegmentIndex = i;
          this.config.onTempoChange?.(segment.bpm);
          if (this.metronome) {
            this.metronome.setBpm(segment.bpm);
          }
        }
        return segment;
      }
    }

    return null;
  }

  setSpotifyActive(active: boolean) {
    this.isSpotifyActive = active;
    if (this.metronome) {
      this.metronome.setVolume(active ? 0 : 0.5); // Fade out when Spotify is active
    }
  }

  start() {
    this.startTime = Date.now();

    // Start with either first segment's BPM or default
    const initialBpm = this.tempoSegments.length > 0 
      ? this.tempoSegments[0].bpm 
      : this.config.defaultBpm!;

    // Initialize metronome
    this.metronome = new Metronome({
      bpm: initialBpm,
      volume: this.isSpotifyActive ? 0 : 0.5,
      onBeat: this.config.onBeat
    });

    // ensure bpm is applied explicitly for predictability in tests
    this.metronome.setBpm(initialBpm);
    this.metronome.start();

    // Start tempo segment tracking
    if (this.tempoSegments.length > 0) {
      const checkSegment = () => {
        if (!this.startTime) return;
        const elapsedMs = Date.now() - this.startTime;
        this.getCurrentSegment(elapsedMs);
      };

      // Check for segment changes every 100ms
      if (this.segmentInterval) clearInterval(this.segmentInterval);
      this.segmentInterval = setInterval(checkSegment, 100);
    }
  }

  stop() {
    if (this.metronome) {
      this.metronome.stop();
      this.metronome = null;
    }
    if (this.segmentInterval) {
      clearInterval(this.segmentInterval);
      this.segmentInterval = null;
    }
    this.startTime = null;
    this.currentSegmentIndex = 0;
  }

  setBpm(bpm: number) {
    if (this.metronome) {
      this.metronome.setBpm(bpm);
    }
  }
} 