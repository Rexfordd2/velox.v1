import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: targetMuscleGroupTypeTypes, error } = await supabase
      .from('exercise_target_muscle_group_type_types')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(targetMuscleGroupTypeTypes);
  } catch (error) {
    console.error('Error fetching target muscle group type types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 