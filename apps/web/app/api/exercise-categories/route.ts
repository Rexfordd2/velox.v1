import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exerciseCategorySchema, exerciseCategoryQuerySchema } from '@/lib/validations/exercise-category';
import { withAdminAuth } from '@/lib/withAdminAuth';

// GET /api/exercise-categories - Get all categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      search: searchParams.get('search') || undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10
    };

    const validatedQuery = exerciseCategoryQuerySchema.parse(query);
    const supabase = createRouteHandlerClient({ cookies });

    let categoriesQuery = supabase
      .from('exercise_categories')
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    // Apply search filter
    if (validatedQuery.search) {
      categoriesQuery = categoriesQuery.ilike('name', `%${validatedQuery.search}%`);
    }

    // Apply pagination
    const from = (validatedQuery.page - 1) * validatedQuery.limit;
    const to = from + validatedQuery.limit - 1;

    const { data: categories, error, count } = await categoriesQuery
      .range(from, to)
      .order('name');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories,
      pagination: {
        total: count,
        page: validatedQuery.page,
        limit: validatedQuery.limit
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/exercise-categories - Create a new category
export const POST = withAdminAuth(async (request: Request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const validatedCategory = exerciseCategorySchema.parse(body);

    const { data: category, error } = await supabase
      .from('exercise_categories')
      .insert([validatedCategory])
      .select('id, name')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PATCH /api/exercise-categories/:id - Update a category
export const PATCH = withAdminAuth(async (request: Request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const validatedCategory = exerciseCategorySchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('exercise_categories')
      .update(validatedCategory)
      .eq('id', id)
      .select('id, name')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/exercise-categories/:id - Soft delete a category
export const DELETE = withAdminAuth(async (request: Request) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('exercise_categories')
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
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 