// Generator for composing short replay reels with overlays and audio policy handling

export type AudioSourceType = "streaming" | "velox" | "local";

export interface ReelMetrics {
  bpm: number;
  videoDurationSeconds: number;
  startAtSeconds?: number;
  coachingTips?: string[];
}

export interface BeatCue {
  time: number; // seconds from video start
  index: number; // zero-based within the exported segment
}

export interface CaptionCue {
  time: number; // seconds from video start
  text: string;
  duration: number; // seconds
}

export interface Timeline {
  start: number;
  end: number;
  bpm: number;
  beats: BeatCue[];
  captions: CaptionCue[];
}

export interface AudioPolicyInput {
  sourceType: AudioSourceType;
  policy?: "mute" | "replace"; // for streaming sources, default replace
}

export interface AudioPolicyResult {
  action: "keep" | "mute" | "replace";
  rightsClearedTrack?: string | null;
  tempoLocked: boolean;
}

export interface FfmpegAdapter {
  // Implemented by web (ffmpeg.wasm) or server-side (native ffmpeg) variants
  exportMp4(input: {
    videoSource: string;
    audioSource?: string; // optional if muting or using embedded audio
    overlays: { beats: BeatCue[]; captions: CaptionCue[] };
    outDurationSeconds: number;
    startAtSeconds: number;
    audioPolicy: AudioPolicyResult;
  }): Promise<Uint8Array>;
}

export interface GenerateReelOptions {
  metrics: ReelMetrics;
  desiredDurationSeconds?: number; // will be clamped to [15,25]
  videoSource: string; // URL or path
  audioSource?: string; // optional explicit audio source
  rightsClearedTrackUrl?: string; // recommended when audio policy is replace
  audio: AudioPolicyInput;
  ffmpegAdapter: FfmpegAdapter;
}

const MIN_DURATION = 15;
const MAX_DURATION = 25;

export function clampDurationSeconds(
  desired: number | undefined,
  maxAvailable: number
): number {
  const target = desired ?? Math.min(MAX_DURATION, Math.max(MIN_DURATION, maxAvailable >= 20 ? 20 : maxAvailable));
  const clamped = Math.max(MIN_DURATION, Math.min(MAX_DURATION, target));
  return Math.min(clamped, maxAvailable);
}

export function chooseAudioPolicy(input: AudioPolicyInput): AudioPolicyResult {
  if (input.sourceType === "streaming") {
    if (input.policy === "mute") {
      return { action: "mute", rightsClearedTrack: null, tempoLocked: false };
    }
    return { action: "replace", rightsClearedTrack: "rights-cleared", tempoLocked: false };
  }
  // velox/local audio can be kept and tempo-locked
  return { action: "keep", rightsClearedTrack: null, tempoLocked: true };
}

export function buildTimeline(
  metrics: ReelMetrics,
  desiredDurationSeconds?: number
): Timeline {
  const start = Math.max(0, metrics.startAtSeconds ?? 0);
  const maxAvailable = Math.max(0, metrics.videoDurationSeconds - start);
  const duration = clampDurationSeconds(desiredDurationSeconds, maxAvailable);
  const end = start + duration;

  const beatInterval = 60 / metrics.bpm;
  const firstBeatIndex = Math.ceil(start / beatInterval);
  const beats: BeatCue[] = [];
  let idx = 0;
  for (let i = firstBeatIndex; ; i++) {
    const t = i * beatInterval;
    if (t > end + 1e-9) break;
    if (t + 1e-9 >= start) {
      beats.push({ time: round6(t), index: idx++ });
    }
  }

  const captions: CaptionCue[] = [];
  const maxTips = 2;
  const tips = (metrics.coachingTips ?? []).slice(0, maxTips);
  if (tips.length > 0 && beats.length > 0) {
    for (let j = 0; j < tips.length; j++) {
      // Place captions roughly at 25% and 75% through the segment, snapped to nearest beat
      const fraction = tips.length === 1 ? 0.5 : j === 0 ? 0.25 : 0.75;
      const targetTime = start + duration * fraction;
      const nearestBeat = findNearestBeatTime(beats, targetTime);
      captions.push({ time: round6(nearestBeat), text: tips[j], duration: Math.min(2.5, beatInterval * 4) });
    }
  }

  return { start: round6(start), end: round6(end), bpm: metrics.bpm, beats, captions };
}

function findNearestBeatTime(beats: BeatCue[], t: number): number {
  if (beats.length === 0) return t;
  let best = beats[0].time;
  let bestDist = Math.abs(best - t);
  for (let i = 1; i < beats.length; i++) {
    const d = Math.abs(beats[i].time - t);
    if (d < bestDist) {
      best = beats[i].time;
      bestDist = d;
    }
  }
  return best;
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export async function generateReel(options: GenerateReelOptions): Promise<{
  mp4Data: Uint8Array;
  timeline: Timeline;
  audioPolicy: AudioPolicyResult;
}> {
  const timeline = buildTimeline(options.metrics, options.desiredDurationSeconds);
  const audioPolicy = chooseAudioPolicy(options.audio);

  // Determine which audio source to pass through to the adapter
  let audioSource: string | undefined = options.audioSource;
  if (audioPolicy.action === "replace") {
    audioSource = options.rightsClearedTrackUrl ?? undefined;
  } else if (audioPolicy.action === "mute") {
    audioSource = undefined;
  }

  const mp4Data = await options.ffmpegAdapter.exportMp4({
    videoSource: options.videoSource,
    audioSource,
    overlays: { beats: timeline.beats, captions: timeline.captions },
    outDurationSeconds: timeline.end - timeline.start,
    startAtSeconds: timeline.start,
    audioPolicy,
  });

  return { mp4Data, timeline, audioPolicy };
}


