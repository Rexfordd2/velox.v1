import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { exerciseId, videoPath, durationMs, score, reps } = await request.json();

    // Insert session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: session.user.id,
        exercise_id: exerciseId,
        video_path: videoPath,
        duration_ms: durationMs,
        score
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    // Insert reps if provided
    if (reps?.length) {
      const { error: repsError } = await supabase
        .from('reps')
        .insert(
          reps.map((rep: any, idx: number) => ({
            session_id: sessionData.id,
            rep_idx: idx,
            peak_velocity: rep.peakVelocity,
            form_errors: rep.formErrors
          }))
        );

      if (repsError) throw repsError;
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
} 