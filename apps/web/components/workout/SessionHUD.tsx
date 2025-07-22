import { useEffect, useState } from 'react';
import { MusicSync } from '@velox/music-sync';

interface SessionHUDProps {
  isSpotifyActive: boolean;
  currentBpm: number;
  onBeat?: () => void;
}

export function SessionHUD({ isSpotifyActive, currentBpm, onBeat }: SessionHUDProps) {
  const [musicSync, setMusicSync] = useState<MusicSync | null>(null);
  const [beatCount, setBeatCount] = useState(0);

  useEffect(() => {
    const sync = new MusicSync({
      defaultBpm: currentBpm,
      onBeat: () => {
        setBeatCount(count => (count + 1) % 4);
        onBeat?.();
      }
    });

    setMusicSync(sync);
    sync.setSpotifyActive(isSpotifyActive);
    sync.start();

    return () => {
      sync.stop();
    };
  }, [isSpotifyActive, currentBpm, onBeat]);

  useEffect(() => {
    if (musicSync) {
      musicSync.setSpotifyActive(isSpotifyActive);
    }
  }, [isSpotifyActive, musicSync]);

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
      <div className="bg-gray-800 rounded-full px-8 py-4 flex items-center gap-4">
        <span className="text-gray-400">
          Sync Source: {isSpotifyActive ? 'Spotify' : 'Metronome'}
        </span>
        <span className="text-gray-400">BPM: {currentBpm}</span>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                beatCount === i ? 'bg-purple-400 scale-150' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 