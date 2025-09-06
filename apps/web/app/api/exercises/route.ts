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
      cursor: searchParams.get('cursor') || undefined,
      limit: Number(searchParams.get('limit')) || 24,
      sortBy: (searchParams.get('sortBy') as 'created_at' | 'name' | 'difficulty' | 'primary_muscle') || 'created_at',
      sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc',
    };

    const validatedQuery = exerciseQuerySchema.parse(query);
    const supabase = createRouteHandlerClient({ cookies });

    const selectWithJoin = `
        *,
        exercise_to_category ${validatedQuery.category_id ? '!inner' : ''} (
          category:exercise_categories (
            id,
            name
          )
        )
      `;

    let exercisesQuery = supabase
      .from('exercises')
      .select(selectWithJoin)
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
      exercisesQuery = exercisesQuery.eq('exercise_to_category.category_id', validatedQuery.category_id);
    }

    // Sorting
    exercisesQuery = exercisesQuery.order(validatedQuery.sortBy, { ascending: validatedQuery.sortDir === 'asc' });

    // Cursor pagination (by created_at fallback if sortBy isn't created_at)
    if (validatedQuery.cursor) {
      if (validatedQuery.sortDir === 'asc') {
        exercisesQuery = exercisesQuery.gt('created_at', validatedQuery.cursor);
      } else {
        exercisesQuery = exercisesQuery.lt('created_at', validatedQuery.cursor);
      }
    }

    const { data: rows, error } = await exercisesQuery.limit(validatedQuery.limit + 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = rows ?? [];
    let nextCursor: string | undefined = undefined;
    if (items.length > validatedQuery.limit) {
      const next: any = items.pop();
      nextCursor = (next && (next.created_at as string | undefined)) || undefined;
    }

    return NextResponse.json({ items, nextCursor });
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