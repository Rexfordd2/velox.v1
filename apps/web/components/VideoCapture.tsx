import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VideoMetadata } from '@velox/types';
import { uploadVideo } from '@velox/storage';
import { useAuth } from '@/hooks/useAuth';
import { usePerformanceMonitor } from '@/lib/performance-monitoring';

interface VideoCaptureProps {
  onComplete: (metadata: VideoMetadata) => void;
  onError: (error: Error) => void;
}

export function VideoCapture({ onComplete, onError }: VideoCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { user } = useAuth();
  const performance = usePerformanceMonitor();

  useEffect(() => {
    // Check if camera is available
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => setHasCamera(true))
        .catch((error) => {
          setHasCamera(false);
          performance.logError(error, { context: 'camera_check' });
        });
    }
  }, [performance]);

  const startRecording = async () => {
    try {
      performance.mark('uploadStart');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Log video settings
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      performance.updateVideoMetrics({
        size: 0, // Will be updated when recording ends
        duration: 0, // Will be updated when recording ends
        frameRate: settings.frameRate || 30,
        resolution: `${settings.width}x${settings.height}`
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      performance.mark('recordingStart');

    } catch (error) {
      performance.logError(error as Error, { context: 'startRecording' });
      onError(error as Error);
    }
  };

  const stopRecording = async () => {
    try {
      performance.mark('recordingEnd');
      
      if (mediaRecorderRef.current && videoRef.current) {
        mediaRecorderRef.current.stop();
        const tracks = videoRef.current.srcObject instanceof MediaStream 
          ? videoRef.current.srcObject.getTracks() 
          : [];
        tracks.forEach(track => track.stop());
      }

      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      // Update video metrics
      performance.updateVideoMetrics({
        size: videoBlob.size,
        duration: videoRef.current?.duration || 0,
        frameRate: performance.computeMetrics().frameRate || 30,
        resolution: `${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`
      });

      performance.mark('uploadEnd');
      performance.mark('processingStart');

      // Upload and process video
      const metadata = await uploadVideo(videoBlob, user?.id);
      
      performance.mark('processingEnd');
      performance.mark('analysisStart');

      // Additional processing or analysis here
      
      performance.mark('analysisEnd');
      
      // Send performance metrics
      await performance.sendMetrics();

      setIsRecording(false);
      onComplete(metadata);

    } catch (error) {
      performance.logError(error as Error, { context: 'stopRecording' });
      onError(error as Error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      performance.mark('uploadStart');
      const file = event.target.files?.[0];
      if (!file) return;

      // Update video metrics
      performance.updateVideoMetrics({
        size: file.size,
        duration: 0, // Will be updated after processing
        frameRate: 30, // Default assumption
        resolution: 'unknown' // Will be updated after processing
      });

      performance.mark('uploadEnd');
      performance.mark('processingStart');

      const metadata = await uploadVideo(file, user?.id);

      performance.mark('processingEnd');
      performance.mark('analysisStart');

      // Additional processing or analysis here

      performance.mark('analysisEnd');
      
      // Send performance metrics
      await performance.sendMetrics();

      onComplete(metadata);

    } catch (error) {
      performance.logError(error as Error, { context: 'fileUpload' });
      onError(error as Error);
    }
  };

  return (
    <div className="space-y-4">
      {hasCamera ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video bg-black rounded-lg"
          />
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button onClick={startRecording} variant="default">
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive">
                Stop Recording
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Camera not available. Please upload a video file instead.
          </p>
          <input
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleFileUpload}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/90"
          />
        </div>
      )}
    </div>
  );
} 