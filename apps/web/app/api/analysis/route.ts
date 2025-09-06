import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { calcVelocity } from '@velox/ai-analysis/src/utils/velocity';
import { gradeFrame } from '@velox/ai-analysis/src/utils/formGrader';
import { syncRepsToBeats, calculateTimingScore } from '@velox/music-sync/src/bpmSync';
import { downloadVideo } from '@/lib/utils/video';
import { detectPose } from '@/lib/utils/pose';

export async function POST(request: Request) {
  try {
    const { exerciseId, videoUrl, fps, bpm } = await request.json();
    const requestId = request.headers.get('x-request-id') || request.headers.get('x-trace-id') || undefined;

    // Download and process video
    const videoBuffer = await downloadVideo(videoUrl);
    const poses = await detectPose(videoBuffer, fps);

    // Extract vertical positions for velocity calculation
    const ySeries = poses.map(pose => {
      // Use first available hip landmark key if present
      const lm: any = pose.landmarks as any;
      const hip = lm?.left_hip ?? lm?.right_hip ?? lm?.hip ?? null;
      return hip && typeof hip.y === 'number' ? hip.y : 0;
    });

    // Calculate velocity metrics
    const velocity = calcVelocity(ySeries, fps);

    // Grade form for each frame
    const formFeedback = poses.flatMap(pose => 
      gradeFrame(pose as any, String(exerciseId))
    );

    // Calculate form score
    const majorErrors = formFeedback.reduce((sum, f: any) => sum + (Array.isArray(f.majorErrors) ? f.majorErrors.length : 0), 0);
    const minorErrors = formFeedback.reduce((sum, f: any) => sum + (Array.isArray(f.minorErrors) ? f.minorErrors.length : 0), 0);
    const formScore = Math.max(0, 100 - (majorErrors * 5 + minorErrors * 1));

    // Sync reps to beats if BPM provided
    const beatTiming = bpm ? syncRepsToBeats(
      velocity.map(v => ({
        concentric: v.repIdx * (1000 / fps),
        eccentric: (v.repIdx + 0.5) * (1000 / fps)
      })),
      bpm
    ) : [];

    const timingScore = bpm ? calculateTimingScore(beatTiming) : null;

    return NextResponse.json({
      formScore,
      formFeedback,
      velocity,
      beatTiming,
      timingScore
    }, { headers: requestId ? { 'x-request-id': String(requestId) } : undefined });
  } catch (error) {
    const requestId = request.headers.get('x-request-id') || request.headers.get('x-trace-id') || undefined;
    logger.error('analysis_route_error', { requestId, route: '/api/analysis', error: (error as Error)?.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: requestId ? { 'x-request-id': String(requestId) } : undefined }
    );
  }
} 