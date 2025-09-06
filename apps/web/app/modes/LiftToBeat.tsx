"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { veloxLibrarySource, spotifySource, localSource } from '@velox/music';
import { BeatSource, beatWindows } from '@velox/core';
import { MusicSync } from '@velox/music-sync';
import { AdherenceTracker } from '@velox/music';

type SourceKey = 'veloxLib' | 'spotify' | 'local' | 'silent';

export default function LiftToBeat() {
  const [source, setSource] = useState<SourceKey>('veloxLib');
  const [bpm, setBpm] = useState(120);
  const [energy, setEnergy] = useState<number | undefined>(undefined);
  const [vibes, setVibes] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [haptics, setHaptics] = useState(true);
  const [beatCount, setBeatCount] = useState(0);
  const [adherence, setAdherence] = useState(0);
  const [flowScore, setFlowScore] = useState(0);

  const playbackRef = useRef<null | {
    play: () => Promise<void> | void;
    pause: () => Promise<void> | void;
    seek: (ms: number) => Promise<void> | void;
    getPositionMs: () => Promise<number> | number;
    getDurationMs: () => Promise<number | null> | number | null;
  }>(null);

  const musicSyncRef = useRef<MusicSync | null>(null);
  const adherenceRef = useRef<AdherenceTracker | null>(null);

  useEffect(() => {
    const sync = new MusicSync({
      defaultBpm: bpm,
      onBeat: () => setBeatCount(c => (c + 1) % 4),
    });
    musicSyncRef.current = sync;
    sync.start();
    adherenceRef.current = new AdherenceTracker({ bpm, toleranceMs: 60 });
    return () => sync.stop();
  }, []);

  useEffect(() => {
    musicSyncRef.current?.setSpotifyActive(source === 'spotify');
  }, [source]);

  useEffect(() => {
    // Load default track for Velox library
    if (source === 'veloxLib') {
      veloxLibrarySource.listByTempo(bpm).then(async tracks => {
        const chosen = tracks[0] || null;
        if (!chosen) return;
        const loaded = await veloxLibrarySource.loadById(chosen.id);
        playbackRef.current = loaded.controls;
        setBpm(loaded.bpm);
        setEnergy(chosen.energy);
        setVibes(chosen.vibes || []);
        const dur = await loaded.controls.getDurationMs();
        setDuration(typeof dur === 'number' ? dur : null);
      });
    }
    if (source === 'spotify') {
      // Stub load
      spotifySource.listByTempo(bpm).then(async tracks => {
        const chosen = tracks[0] || null;
        if (!chosen) return;
        const loaded = await spotifySource.loadById(chosen.id);
        playbackRef.current = loaded.controls;
        setBpm(loaded.bpm);
        setEnergy(chosen.energy);
        setVibes(chosen.vibes || []);
        const dur = await loaded.controls.getDurationMs();
        setDuration(typeof dur === 'number' ? dur : null);
      });
    }
    if (source === 'local') {
      // Leave to user action in UI
    }
    if (source === 'silent') {
      playbackRef.current = null;
      setEnergy(undefined);
      setVibes([]);
      setDuration(null);
    }
  }, [source, bpm]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!playbackRef.current) return;
      const pos = await playbackRef.current.getPositionMs();
      setPosition(typeof pos === 'number' ? pos : 0);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const windows = useMemo(() => beatWindows(bpm, 1 as any), [bpm]);

  // Simulated hit button for dev: update adherence and flow
  const recordSimulatedHit = () => {
    const now = Date.now();
    adherenceRef.current?.recordHit(now);
    const stats = adherenceRef.current?.getAdherence();
    if (stats) {
      setAdherence(stats.percent);
      // naive flow score: rolling average favoring consistency
      setFlowScore(prev => Math.min(100, (prev * 0.8) + (stats.percent * 0.2)));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Lift To Beat</h1>

      {/* Source Picker */}
      <div className="flex items-center gap-2">
        {[
          { id: 'veloxLib', label: 'Velox Library' },
          { id: 'spotify', label: 'Spotify' },
          { id: 'local', label: 'Local' },
          { id: 'silent', label: 'Silent' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setSource(s.id as SourceKey)}
            className={`px-3 py-1 rounded-full border ${source === s.id ? 'bg-black text-white' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Track Info */}
      <div className="flex items-center gap-6">
        <div className="text-sm">BPM: <span className="font-medium">{bpm}</span></div>
        <div className="text-sm">Energy: <span className="font-medium">{energy ?? '—'}</span></div>
        <div className="text-sm flex items-center gap-1">Vibes: {(vibes || []).map(v => (
          <span key={v} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">{v}</span>
        ))}</div>
      </div>

      {/* Scrubber */}
      <div className="flex items-center gap-3 w-full max-w-xl">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={position}
          onChange={e => playbackRef.current?.seek(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-xs w-24 text-right">
          {Math.floor(position / 1000)} / {Math.floor((duration || 0) / 1000)}s
        </div>
      </div>

      {/* Phase windows */}
      <div className="flex items-center gap-4">
        {(['ecc', 'iso', 'con'] as const).map(key => (
          <div key={key} className="flex flex-col items-center">
            <div className="text-xs uppercase text-gray-500">{key}</div>
            <div className="w-24 h-2 bg-gray-200 rounded">
              <div className="h-2 bg-purple-400 rounded" style={{ width: `${Math.min(100, (windows[key] / (60000 / bpm)) * 100)}%` }} />
            </div>
            <div className="text-xs text-gray-500">{Math.round(windows[key])}ms</div>
          </div>
        ))}
      </div>

      {/* Live beat ring & haptics */}
      <div className="flex items-center gap-6">
        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${beatCount === 0 ? 'border-purple-500' : 'border-gray-300'}`}>
          <div className={`w-6 h-6 rounded-full ${beatCount === 0 ? 'bg-purple-500' : 'bg-gray-300'}`} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={haptics} onChange={e => setHaptics(e.target.checked)} />
          Haptics
        </label>
      </div>

      {/* Score HUD */}
      <div className="grid grid-cols-2 gap-6 max-w-xl">
        <div className="p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Beat adherence</div>
          <div className="text-2xl font-semibold">{Math.round(adherence)}%</div>
        </div>
        <div className="p-4 rounded-lg border">
          <div className="text-sm text-gray-500">Flow score</div>
          <div className="text-2xl font-semibold">{Math.round(flowScore)}</div>
        </div>
      </div>

      <button className="px-3 py-2 rounded border" onClick={recordSimulatedHit}>Simulate Hit</button>
    </div>
  );
}


