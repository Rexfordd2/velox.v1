import { MusicSource, TrackSummary } from '../index';

// Loads catalog JSON from web public folder

export interface VeloxCatalogItem extends TrackSummary {
  url?: string;
}

export async function loadVeloxCatalog(): Promise<VeloxCatalogItem[]> {
  try {
    const res = await fetch('/velox-music.json');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export const veloxLibrarySource: MusicSource = {
  id: 'veloxLib',
  label: 'Velox Library',
  async listByTempo(bpm: number) {
    const catalog = await loadVeloxCatalog();
    const tolerance = 6; // bpm
    return catalog
      .filter(item => Math.abs(item.bpm - bpm) <= tolerance)
      .map(item => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        bpm: item.bpm,
        energy: item.energy,
        vibes: item.vibes,
        durationMs: item.durationMs,
      }));
  },
  async loadById(id: string) {
    const catalog = await loadVeloxCatalog();
    const item = catalog.find(t => t.id === id) || catalog[0];
    const audio = new Audio(item?.url || '');
    const controls = {
      play: () => audio.play(),
      pause: () => audio.pause(),
      seek: (ms: number) => { audio.currentTime = ms / 1000; },
      getPositionMs: () => audio.currentTime * 1000,
      getDurationMs: () => (isFinite(audio.duration) ? audio.duration * 1000 : null),
    };
    const meta: TrackSummary = {
      id: item?.id || 'unknown',
      title: item?.title || 'Unknown',
      artist: item?.artist || 'Unknown',
      bpm: item?.bpm || 120,
      energy: item?.energy,
      vibes: item?.vibes,
      durationMs: item?.durationMs,
    };
    return { controls, bpm: meta.bpm, meta };
  }
};


