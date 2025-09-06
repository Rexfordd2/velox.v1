import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Exercise, ExerciseQuery, ExerciseResponse } from '../types/exercise';

interface UseExercisesOptions {
  search?: string;
  difficulty?: string;
  category_id?: number;
  primary_muscle?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function useExercises(options: UseExercisesOptions = {}) {
  const { search, difficulty, category_id, primary_muscle } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (difficulty) queryParams.set('difficulty', difficulty);
  if (category_id) queryParams.set('category_id', category_id.toString());
  if (primary_muscle) queryParams.set('primary_muscle', primary_muscle);

  const { data, error, isLoading, refetch } = useQuery<ExerciseResponse, Error>({
    queryKey: ['exercises', Object.fromEntries(queryParams.entries())],
    queryFn: () => fetcher(`/api/exercises?${queryParams.toString()}`),
    placeholderData: (prev) => prev,
  });

  return {
    exercises: data?.items,
    isLoading,
    isError: error,
    mutate: refetch,
  };
}

export function useExercise(slug: string) {
  const { data, error, isLoading, refetch } = useQuery<Exercise, Error>({
    queryKey: ['exercise', slug],
    queryFn: () => fetcher(`/api/exercises/${slug}`),
    enabled: Boolean(slug),
    placeholderData: (prev) => prev,
  });

  return {
    exercise: data,
    isLoading,
    isError: error,
    mutate: refetch,
  };
}

export function useExercisesInfinite(options: UseExercisesOptions & { limit?: number; sortBy?: string; sortDir?: 'asc' | 'desc' } = {}) {
  const { search, difficulty, category_id, primary_muscle, limit = 24, sortBy = 'created_at', sortDir = 'desc' } = options;

  const buildParams = (cursor?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (difficulty) params.set('difficulty', difficulty);
    if (category_id) params.set('category_id', String(category_id));
    if (primary_muscle) params.set('primary_muscle', primary_muscle);
    params.set('limit', String(limit));
    params.set('sortBy', sortBy);
    params.set('sortDir', sortDir);
    if (cursor) params.set('cursor', cursor);
    return params;
  };

  const query = useInfiniteQuery<ExerciseResponse, Error>({
    queryKey: ['exercises-infinite', { search, difficulty, category_id, primary_muscle, limit, sortBy, sortDir }],
    queryFn: ({ pageParam }) => fetcher(`/api/exercises?${buildParams(pageParam as string | undefined).toString()}`),
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    initialPageParam: undefined,
  });

  const items = (query.data?.pages ?? []).flatMap((p) => p.items);
  const hasMore = Boolean(query.data?.pages && query.data.pages.length > 0 && query.data.pages[query.data.pages.length - 1]?.nextCursor);

  return {
    exercises: items,
    isLoading: query.isLoading,
    isError: query.error,
    mutate: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasMore,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export async function createExercise(exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>) {
  const response = await fetch('/api/exercises', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(exercise)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

export async function updateExercise(slug: string, exercise: Partial<Exercise>) {
  const response = await fetch(`/api/exercises/${slug}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(exercise)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

export async function deleteExercise(slug: string) {
  const response = await fetch(`/api/exercises/${slug}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
} 