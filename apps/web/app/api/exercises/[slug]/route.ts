import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exerciseSchema } from '@/lib/validations/exercise';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: exercise, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_to_category (
          category:exercise_categories (
            id,
            name
          )
        )
      `)
      .eq('slug', params.slug)
      .is('deleted_at', null)
      .single();

    if (error || !exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedExercise = exerciseSchema.parse(body);

    // Only update if not deleted
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .update({
        name: validatedExercise.name,
        slug: validatedExercise.slug,
        description: validatedExercise.description,
        difficulty: validatedExercise.difficulty,
        primary_muscle: validatedExercise.primary_muscle,
        secondary_muscles: validatedExercise.secondary_muscles,
        video_demo_url: validatedExercise.video_demo_url,
        equipment: validatedExercise.equipment,
        instructions: validatedExercise.instructions
      })
      .eq('slug', params.slug)
      .is('deleted_at', null)
      .select()
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json(
        { error: exerciseError?.message || 'Exercise not found or deleted' },
        { status: 404 }
      );
    }

    // Update category relationships
    // First, delete existing relationships
    await supabase
      .from('exercise_to_category')
      .delete()
      .eq('exercise_id', exercise.id);

    // Then, create new relationships
    const categoryRelations = validatedExercise.category_ids.map(categoryId => ({
      exercise_id: exercise.id,
      category_id: categoryId
    }));

    const { error: categoryError } = await supabase
      .from('exercise_to_category')
      .insert(categoryRelations);

    if (categoryError) {
      return NextResponse.json(
        { error: categoryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(exercise);
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', session.user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('exercises')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('slug', params.slug)
      .is('deleted_at', null);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 