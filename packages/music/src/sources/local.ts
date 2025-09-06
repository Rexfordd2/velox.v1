import { MusicSource, PlaybackControls, TrackSummary } from '../index';

// Local file picker + WSOLA timestretch API stub

class LocalPlayback implements PlaybackControls {
  private audio: HTMLAudioElement;
  private sourceUrl: string;
  constructor(sourceUrl: string) {
    this.sourceUrl = sourceUrl;
    this.audio = new Audio(sourceUrl);
  }
  async play(): Promise<void> { await this.audio.play(); }
  async pause(): Promise<void> { this.audio.pause(); }
  async seek(ms: number): Promise<void> { this.audio.currentTime = ms / 1000; }
  async getPositionMs(): Promise<number> { return this.audio.currentTime * 1000; }
  async getDurationMs(): Promise<number | null> { return isFinite(this.audio.duration) ? this.audio.duration * 1000 : null; }

  // WSOLA timestretch stub: no-op, placeholder for future worker/process
  async setTempoMultiplier(_multiplier: number): Promise<void> {}
}

export async function pickLocalFile(): Promise<{ url: string; name: string } | null> {
  // Stub: caller should provide file input element in UI
  return null;
}

export const localSource: MusicSource = {
  id: 'local',
  label: 'Local',
  async loadById(id: string) {
    const url = id; // for local, pass object URL or remote URL as id
    const controls = new LocalPlayback(url);
    const meta: TrackSummary = { id: url, title: 'Local File', artist: 'You', bpm: 120 };
    return { controls, bpm: meta.bpm, meta };
  },
  async listByTempo(_bpm: number) {
    return [];
  }
};


