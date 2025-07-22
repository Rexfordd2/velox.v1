import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface SampleVideoPlayerProps {
  exerciseId: string;
  videoUrl: string;
  onVideoComplete: () => void;
}

export function SampleVideoPlayer({
  exerciseId,
  videoUrl,
  onVideoComplete
}: SampleVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
      
      if (progress >= 100) {
        onVideoComplete();
      }
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative">
      {/* Video Player */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Play/Pause Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isPlaying ? 0 : 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer"
          onClick={togglePlayback}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center"
          >
            {isPlaying ? (
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
                  d="M10 9v6m4-6v6"
                />
              </svg>
            ) : (
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
            )}
          </motion.button>
        </motion.div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <motion.div
            className="h-full bg-purple-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Video Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlayback}
            className="hover:text-purple-400 transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span>|</span>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play();
              }
            }}
            className="hover:text-purple-400 transition-colors"
          >
            Restart
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = Math.max(0.5, videoRef.current.playbackRate - 0.5);
              }
            }}
            className="hover:text-purple-400 transition-colors"
          >
            Slower
          </button>
          <span>|</span>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = Math.min(2, videoRef.current.playbackRate + 0.5);
              }
            }}
            className="hover:text-purple-400 transition-colors"
          >
            Faster
          </button>
        </div>
      </div>
    </div>
  );
} 