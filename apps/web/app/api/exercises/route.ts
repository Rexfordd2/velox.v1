import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exerciseQuerySchema, exerciseSchema } from '@/lib/validations/exercise';
import { withAdminAuth } from '@/lib/withAdminAuth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      search: searchParams.get('search') || undefined,
      difficulty: searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' || undefined,
      primary_muscle: searchParams.get('primary_muscle') || undefined,
      category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10
    };

    const validatedQuery = exerciseQuerySchema.parse(query);
    const supabase = createRouteHandlerClient({ cookies });

    let exercisesQuery = supabase
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
      .is('deleted_at', null);

    // Apply filters
    if (validatedQuery.search) {
      exercisesQuery = exercisesQuery.ilike('name', `%${validatedQuery.search}%`);
    }
    if (validatedQuery.difficulty) {
      exercisesQuery = exercisesQuery.eq('difficulty', validatedQuery.difficulty);
    }
    if (validatedQuery.primary_muscle) {
      exercisesQuery = exercisesQuery.eq('primary_muscle', validatedQuery.primary_muscle);
    }
    if (validatedQuery.category_id) {
      exercisesQuery = exercisesQuery.contains('exercise_to_category.category_id', [validatedQuery.category_id]);
    }

    // Apply pagination
    const from = (validatedQuery.page - 1) * validatedQuery.limit;
    const to = from + validatedQuery.limit - 1;

    const { data: exercises, error, count } = await exercisesQuery
      .range(from, to)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      exercises,
      pagination: {
        total: count,
        page: validatedQuery.page,
        limit: validatedQuery.limit
      }
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(async (request: Request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const validatedExercise = exerciseSchema.parse(body);

    // Start a transaction
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .insert({
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
      .select()
      .single();

    if (exerciseError) {
      return NextResponse.json(
        { error: exerciseError.message },
        { status: 500 }
      );
    }

    // Create category relationships
    const categoryRelations = validatedExercise.category_ids.map(categoryId => ({
      exercise_id: exercise.id,
      category_id: categoryId
    }));

    const { error: categoryError } = await supabase
      .from('exercise_to_category')
      .insert(categoryRelations);

    if (categoryError) {
      // Rollback exercise creation
      await supabase
        .from('exercises')
        .delete()
        .eq('id', exercise.id);

      return NextResponse.json(
        { error: categoryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PATCH = withAdminAuth(async (request: Request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const validatedExercise = exerciseSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    // Update exercise
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
      .eq('id', id)
      .select()
      .single();

    if (exerciseError) {
      return NextResponse.json(
        { error: exerciseError.message },
        { status: 500 }
      );
    }

    // Update category relationships
    await supabase
      .from('exercise_to_category')
      .delete()
      .eq('exercise_id', id);

    const categoryRelations = validatedExercise.category_ids.map(categoryId => ({
      exercise_id: id,
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
});

export const DELETE = withAdminAuth(async (request: Request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Exercise ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('exercises')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 