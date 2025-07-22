import { NextResponse } from 'next/server';
import { FormScore } from '@velox/types';

// TODO: Replace with real AI analysis service after DB layer
function analyzeMock(exerciseId: string): FormScore {
  const scores: Record<string, FormScore> = {
    squat: {
      score: 0.85,
      feedback: [
        "Good depth achieved",
        "Maintain neutral spine",
        "Keep chest up"
      ],
      extra: {
        hip_depth: 110,
        knee_valgus: 3,
        back_angle: 40
      }
    },
    deadlift: {
      score: 0.75,
      feedback: [
        "Keep back straight",
        "Hinge at hips",
        "Bar path is good"
      ],
      extra: {
        back_angle: 45,
        hip_angle: 85,
        bar_path: 2
      }
    },
    bench_press: {
      score: 0.80,
      feedback: [
        "Good bar path",
        "Elbows at 45°",
        "Maintain shoulder stability"
      ],
      extra: {
        elbow_angle: 90,
        shoulder_angle: 45,
        bar_path: 1.5
      }
    },
    pushup: {
      score: 0.90,
      feedback: [
        "Excellent form",
        "Full range of motion",
        "Good core stability"
      ],
      extra: {
        elbow_angle: 90,
        body_line: 2,
        depth_ratio: 0.8
      }
    }
  };

  return scores[exerciseId] || {
    score: 0.5,
    feedback: ["No specific feedback available"],
    extra: {}
  };
}

export async function POST(request: Request) {
  try {
    const { url, exerciseId } = await request.json();

    if (!url || !exerciseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Replace with real AI analysis
    const formScore = analyzeMock(exerciseId);

    return NextResponse.json(formScore);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze video' },
      { status: 500 }
    );
  }
} 