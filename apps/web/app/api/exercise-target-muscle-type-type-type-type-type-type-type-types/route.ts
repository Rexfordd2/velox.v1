import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: targetMuscleTypeTypeTypeTypeTypeTypeTypeTypes, error } = await supabase
      .from('exercise_target_muscle_type_type_type_type_type_type_type_types')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(targetMuscleTypeTypeTypeTypeTypeTypeTypeTypes);
  } catch (error) {
    console.error('Error fetching target muscle type type type type type type type types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 