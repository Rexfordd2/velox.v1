import { NextResponse } from 'next/server';
import { calcVelocity } from '@velox/ai-analysis/src/utils/velocity';
import { gradeFrame } from '@velox/ai-analysis/src/utils/formGrader';
import { syncRepsToBeats, calculateTimingScore } from '@velox/music-sync/src/bpmSync';
import { downloadVideo } from '@/lib/utils/video';
import { detectPose } from '@/lib/utils/pose';

export async function POST(request: Request) {
  try {
    const { exerciseId, videoUrl, fps, bpm } = await request.json();

    // Download and process video
    const videoBuffer = await downloadVideo(videoUrl);
    const poses = await detectPose(videoBuffer, fps);

    // Extract vertical positions for velocity calculation
    const ySeries = poses.map(pose => {
      // Use hip position as reference point
      const hip = pose.landmarks.hip;
      return hip ? hip.y : 0;
    });

    // Calculate velocity metrics
    const velocity = calcVelocity(ySeries, fps);

    // Grade form for each frame
    const formFeedback = poses.flatMap(pose => 
      gradeFrame(exerciseId, pose)
    );

    // Calculate form score
    const majorErrors = formFeedback.filter(f => !f.passed && f.label.includes('max')).length;
    const minorErrors = formFeedback.filter(f => !f.passed && !f.label.includes('max')).length;
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
    });
  } catch (error) {
    console.error('Error in analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 