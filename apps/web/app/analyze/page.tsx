import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionStore } from '@/store/sessionStore';
import { FormScore } from '@velox/types';

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { video, exerciseId, formScore, setFormScore } = useSessionStore();

  useEffect(() => {
    if (!video?.url || !exerciseId) {
      setError('Missing video or exercise selection');
      return;
    }

    const analyzeVideo = async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: video.url, exerciseId })
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const score: FormScore = await response.json();
        setFormScore(score);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
      } finally {
        setLoading(false);
      }
    };

    analyzeVideo();
  }, [video?.url, exerciseId, setFormScore]);

  // Mock joint visualization
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawJoints = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw random joint points (mock)
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    };

    const interval = setInterval(drawJoints, 100);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div>Analyzing video...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={video?.url}
          controls
          className="w-full rounded-lg"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      </div>

      {formScore && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="10%"
                    outerRadius="100%"
                    data={[
                      {
                        name: 'Score',
                        value: formScore.score * 100,
                        fill: '#29ABE2'
                      }
                    ]}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise={true}
                      dataKey="value"
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {formScore.feedback.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button disabled>Save Session</Button>
      </div>
    </div>
  );
} 