import { useState, useEffect, useCallback } from 'react';
import { RepData } from '@velox/types';

interface SessionPlaybackProps {
  reps: RepData[];
  onRepSelect: (repIndex: number) => void;
}

export function SessionPlayback({ reps, onRepSelect }: SessionPlaybackProps) {
  const [currentRepIndex, setCurrentRepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const currentRep = reps[currentRepIndex];

  // Auto-advance playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentRepIndex((prev) => {
        const next = prev + 1;
        if (next >= reps.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, 2000 / playbackSpeed); // 2 seconds per rep, adjusted by speed

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, reps.length]);

  const handleRepClick = useCallback((index: number) => {
    setCurrentRepIndex(index);
    onRepSelect(index);
  }, [onRepSelect]);

  const togglePlayback = () => setIsPlaying(!isPlaying);

  const nextRep = () => {
    if (currentRepIndex < reps.length - 1) {
      setCurrentRepIndex(currentRepIndex + 1);
      onRepSelect(currentRepIndex + 1);
    }
  };

  const previousRep = () => {
    if (currentRepIndex > 0) {
      setCurrentRepIndex(currentRepIndex - 1);
      onRepSelect(currentRepIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Rep Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2">Rep {currentRepIndex + 1}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Velocity</p>
            <p className="font-medium">{currentRep.velocity.calibrated.toFixed(2)} m/s</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ROM</p>
            <p className="font-medium">{currentRep.rom.toFixed(2)} cm</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Confidence</p>
            <p className="font-medium">{(currentRep.confidenceScore * 100).toFixed(1)}%</p>
          </div>
          {currentRep.feedback && currentRep.feedback.length > 0 && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Feedback</p>
              <ul className="list-disc list-inside">
                {currentRep.feedback.map((item, i) => (
                  <li key={i} className="text-sm">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex">
          {reps.map((rep, index) => {
            const confidence = rep.confidenceScore;
            const velocity = rep.velocity.calibrated;
            const maxVelocity = Math.max(...reps.map(r => r.velocity.calibrated));
            const height = `${(velocity / maxVelocity) * 100}%`;
            
            return (
              <button
                key={index}
                onClick={() => handleRepClick(index)}
                className={`flex-1 flex items-end transition-all ${
                  index === currentRepIndex ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{ height: '100%' }}
              >
                <div
                  className={`w-full transition-all ${
                    confidence > 0.8
                      ? 'bg-green-500'
                      : confidence > 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ height }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={previousRep}
            disabled={currentRepIndex === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            ⬅️
          </button>
          <button
            onClick={togglePlayback}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={nextRep}
            disabled={currentRepIndex === reps.length - 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
          >
            ➡️
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-white border rounded px-2 py-1"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>
    </div>
  );
} 