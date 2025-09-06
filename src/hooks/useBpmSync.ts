import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syncWithBeats } from "../../packages/music-sync/src/bpmSync";

export type BpmSyncStatus = {
  bpm: number;
  isRunning: boolean;
  nextBeatEtaMs: number; // estimated time until next beat
  driftPct: number; // % drift vs target over last 16 beats
  combo: number; // on-beat streak from rhythm coupling (optional)
};

export type BpmSyncControls = {
  start: (bpm?: number) => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  nudge: (deltaBpm: number) => void; // +/- BPM quick adjust
  tap: () => void; // tap tempo: average last 4 taps
  setVolume: (v: number) => void; // 0..1, for click audio
};

export function useBpmSync(opts?: {
  initialBpm?: number;
  haptics?: boolean; // use device haptics on each beat
  audio?: boolean; // play click sound
  coupleVelocity?: boolean; // if true, consume external velocity samples
  getVelocitySeries?: () => { t: number; v: number }[] | null; // optional callback
}): [BpmSyncStatus, BpmSyncControls] {
  const options = opts ?? {};

  const [status, setStatus] = useState<BpmSyncStatus>({
    bpm: options.initialBpm ?? 120,
    isRunning: false,
    nextBeatEtaMs: 0,
    driftPct: 0,
    combo: 0,
  });

  const bpmRef = useRef<number>(options.initialBpm ?? 120);
  const runningRef = useRef<boolean>(false);
  const nextBeatAtRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const beatPeriodRef = useRef<number>(60000 / bpmRef.current);
  const lastBeatsRef = useRef<{ scheduled: number; actual: number }[]>([]);
  const tapsRef = useRef<number[]>([]);
  const audioVolumeRef = useRef<number>(0.8);
  const clickReadyRef = useRef<boolean>(false);
  const clickPlayRef = useRef<null | ((whenMs: number) => void)>(null);
  const hapticRef = useRef<null | (() => void)>(null);
  const couplingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function nowMs(): number {
    if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
    return Date.now();
  }

  function clamp(min: number, v: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  // Optional audio/haptics setup (lazy)
  useEffect(() => {
    let disposed = false;
    async function setupAudio() {
      if (!options.audio || clickReadyRef.current) return;
      try {
        const AudioCtx = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const play = (whenMs: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "square";
            osc.frequency.value = 1000;
            gain.gain.value = audioVolumeRef.current;
            osc.connect(gain).connect(ctx.destination);
            const t0 = ctx.currentTime + Math.max(0, (whenMs - (typeof performance !== "undefined" ? performance.now() : Date.now())) / 1000);
            osc.start(t0);
            osc.stop(t0 + 0.03);
          };
          if (!disposed) {
            clickPlayRef.current = play;
            clickReadyRef.current = true;
          }
        }
      } catch {}
      // Fallback to Expo AV if available in environment
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod: any = require("expo-av");
        const createAsync = mod?.Audio?.Sound?.createAsync;
        if (typeof createAsync === 'function') {
          const res = await createAsync(
            // @ts-ignore resolved by Expo bundler in mobile app
            require("../../apps/mobile/assets/metronome.wav"),
            { volume: audioVolumeRef.current, shouldPlay: false, isLooping: false }
          );
          const sound = res?.sound;
          const play = async () => { try { await sound?.replayAsync(); } catch {} };
          if (!disposed) {
            clickPlayRef.current = () => { void play(); };
            clickReadyRef.current = true;
          }
        }
      } catch {}
    }

    async function setupHaptics() {
      if (!options.haptics || hapticRef.current) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod: any = require("expo-haptics");
        hapticRef.current = () => { try { mod.impactAsync(mod.ImpactFeedbackStyle.Light); } catch {} };
      } catch { hapticRef.current = null; }
    }

    setupAudio();
    setupHaptics();
    return () => { disposed = true; };
  }, [options.audio, options.haptics]);

  const updateDrift = useCallback((scheduled: number, actual: number) => {
    const history = lastBeatsRef.current;
    history.push({ scheduled, actual });
    if (history.length > 16) history.shift();
    const period = beatPeriodRef.current;
    if (history.length >= 2) {
      const errs = history.map(b => Math.abs(b.actual - b.scheduled));
      const meanErr = errs.reduce((a, b) => a + b, 0) / errs.length;
      const driftPct = clamp(0, (meanErr / period) * 100, 100);
      setStatus(s => ({ ...s, driftPct }));
    }
  }, []);

  const triggerBeat = useCallback((scheduledAt: number) => {
    const actual = nowMs();
    if (options.audio && clickPlayRef.current) { try { clickPlayRef.current(actual); } catch {} }
    if (options.haptics && hapticRef.current) { try { hapticRef.current(); } catch {} }
    updateDrift(scheduledAt, actual);
  }, [options.audio, options.haptics, updateDrift]);

  const loop = useCallback((tNow: number) => {
    if (!runningRef.current) return;
    const period = beatPeriodRef.current;
    if (nextBeatAtRef.current === 0) nextBeatAtRef.current = tNow + 10;
    while (tNow >= nextBeatAtRef.current - 2) {
      const scheduled = nextBeatAtRef.current;
      triggerBeat(scheduled);
      nextBeatAtRef.current += period;
    }
    setStatus(s => ({ ...s, bpm: bpmRef.current, isRunning: true, nextBeatEtaMs: Math.max(0, nextBeatAtRef.current - tNow) }));
    rafIdRef.current = requestAnimationFrame(loop);
  }, [triggerBeat]);

  const ensureCouplingTimer = useCallback(() => {
    if (!options.coupleVelocity || !options.getVelocitySeries) return;
    if (couplingTimerRef.current) return;
    couplingTimerRef.current = setInterval(() => {
      try {
        const series = options.getVelocitySeries?.();
        if (!series || series.length === 0) return;
        const result: any = syncWithBeats(series);
        const combo: number = typeof result.combo === "number" ? result.combo : (() => {
          const beats = result.beats ?? [];
          let streak = 0;
          for (const r of result.reps ?? []) {
            const nearest = beats.reduce((acc: number, b: any) => {
              const d = Math.abs(r.t - b.t);
              return d < acc ? d : acc;
            }, Infinity);
            streak = nearest < 60 ? streak + 1 : 0;
          }
          return streak;
        })();
        setStatus(s => ({ ...s, combo }));
      } catch {}
    }, 250);
  }, [options]);

  const clearCouplingTimer = useCallback(() => {
    if (couplingTimerRef.current) { clearInterval(couplingTimerRef.current); couplingTimerRef.current = null; }
  }, []);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      clearCouplingTimer();
      runningRef.current = false;
    };
  }, [clearCouplingTimer]);

  const start = useCallback((bpm?: number) => {
    if (runningRef.current) return;
    if (typeof bpm === "number" && !Number.isNaN(bpm)) {
      bpmRef.current = clamp(30, bpm, 300);
      beatPeriodRef.current = 60000 / bpmRef.current;
    }
    lastBeatsRef.current = [];
    runningRef.current = true;
    setStatus(s => ({ ...s, isRunning: true, bpm: bpmRef.current }));
    ensureCouplingTimer();
    nextBeatAtRef.current = 0;
    rafIdRef.current = requestAnimationFrame(loop);
  }, [ensureCouplingTimer, loop]);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    clearCouplingTimer();
    setStatus(s => ({ ...s, isRunning: false, nextBeatEtaMs: 0 }));
  }, [clearCouplingTimer]);

  const setBpm = useCallback((bpm: number) => {
    bpmRef.current = clamp(30, bpm, 300);
    beatPeriodRef.current = 60000 / bpmRef.current;
    setStatus(s => ({ ...s, bpm: bpmRef.current }));
  }, []);

  const nudge = useCallback((deltaBpm: number) => { setBpm(bpmRef.current + deltaBpm); }, [setBpm]);

  const tap = useCallback(() => {
    const t = nowMs();
    const arr = tapsRef.current;
    arr.push(t);
    if (arr.length > 5) arr.shift();
    if (arr.length < 3) return;
    const intervals: number[] = [];
    for (let i = 1; i < arr.length; i++) intervals.push(arr[i] - arr[i - 1]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const devs = intervals.map(x => Math.abs(x - median)).sort((a, b) => a - b);
    const mad = devs[Math.floor(devs.length / 2)] || 1;
    const k = 3.5;
    const cleaned = intervals.filter(x => Math.abs(x - median) <= k * mad);
    const mean = cleaned.reduce((a, b) => a + b, 0) / cleaned.length;
    const newBpm = clamp(30, 60000 / mean, 300);
    setBpm(newBpm);
  }, [setBpm]);

  const setVolume = useCallback((v: number) => { audioVolumeRef.current = clamp(0, v, 1); }, []);

  const controls = useMemo<BpmSyncControls>(() => ({ start, stop, setBpm, nudge, tap, setVolume }), [start, stop, setBpm, nudge, tap]);

  return [status, controls];
}