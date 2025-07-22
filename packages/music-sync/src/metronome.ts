export interface MetronomeConfig {
  bpm: number;
  volume?: number; // 0-1, defaults to 0.5
  onBeat?: () => void;
}

export class Metronome {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private interval: number | null = null;
  private config: MetronomeConfig;
  private isPlaying = false;

  constructor(config: MetronomeConfig) {
    this.config = {
      volume: 0.5,
      ...config
    };
  }

  private createClickSound() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Create oscillator for click sound
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = 1000; // 1kHz click

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.config.volume || 0.5;

    // Connect nodes
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  private playClick() {
    if (!this.audioContext || !this.oscillator || !this.gainNode) {
      this.createClickSound();
    }

    // Short click duration
    const now = this.audioContext!.currentTime;
    this.gainNode!.gain.setValueAtTime(this.config.volume || 0.5, now);
    this.gainNode!.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    this.oscillator!.start(now);
    this.oscillator!.stop(now + 0.05);

    // Recreate oscillator for next click
    this.createClickSound();

    // Call onBeat callback if provided
    this.config.onBeat?.();
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Calculate interval from BPM
    const intervalMs = (60 / this.config.bpm) * 1000;
    this.interval = window.setInterval(() => this.playClick(), intervalMs);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Clean up audio nodes
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume;
    }
  }

  setBpm(bpm: number) {
    this.config.bpm = bpm;
    if (this.isPlaying) {
      this.stop();
      this.start();
    }
  }
} 