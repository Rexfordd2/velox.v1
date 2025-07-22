import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { VideoCapture } from './VideoCapture';
import { VideoMetadata } from '@velox/types';

interface VideoUploaderProps {
  onComplete: (metadata: VideoMetadata) => void;
}

export function VideoUploader({ onComplete }: VideoUploaderProps) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = (metadata: VideoMetadata) => {
    setProgress(100);
    setTimeout(() => {
      onComplete(metadata);
    }, 500); // Small delay to show 100% progress
  };

  const handleError = (error: Error) => {
    setError(error.message);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      <VideoCapture
        onComplete={handleComplete}
        onError={handleError}
      />
      
      {progress > 0 && (
        <Progress value={progress} className="w-full" />
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
} 