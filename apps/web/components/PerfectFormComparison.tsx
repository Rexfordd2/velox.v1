import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PerfectFormComparisonProps {
  exerciseId: string;
  userVideo: string;
  perfectVideo: string;
  metrics: {
    label: string;
    userScore: number;
    perfectScore: number;
  }[];
}

export function PerfectFormComparison({
  exerciseId,
  userVideo,
  perfectVideo,
  metrics
}: PerfectFormComparisonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    // Sync video playback
    const userVid = document.getElementById('user-video') as HTMLVideoElement;
    const perfectVid = document.getElementById('perfect-video') as HTMLVideoElement;

    if (userVid && perfectVid) {
      userVid.onplay = () => {
        perfectVid.play();
        setIsPlaying(true);
      };
      userVid.onpause = () => {
        perfectVid.pause();
        setIsPlaying(false);
      };
      perfectVid.onloadeddata = () => setIsSynced(true);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Video Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Your Form</h3>
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              id="user-video"
              src={userVideo}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center"
                  onClick={() => {
                    const video = document.getElementById('user-video') as HTMLVideoElement;
                    video?.play();
                  }}
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                  </svg>
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Perfect Form</h3>
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              id="perfect-video"
              src={perfectVideo}
              className="w-full h-full object-cover"
              playsInline
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <p className="font-semibold">Videos will play in sync</p>
                  <p className="text-sm text-gray-400">Click play on your video to start</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Form Analysis Comparison</h3>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{metric.label}</span>
                <span className="font-semibold">
                  {(metric.userScore * 100).toFixed(0)}% vs {(metric.perfectScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.userScore * 100}%` }}
                  className="absolute h-full bg-purple-500 rounded-full"
                />
                <div
                  className="absolute h-full bg-green-500 rounded-full opacity-25"
                  style={{ width: `${metric.perfectScore * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {!isSynced && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Syncing videos...</p>
          </div>
        </div>
      )}
    </div>
  );
} 