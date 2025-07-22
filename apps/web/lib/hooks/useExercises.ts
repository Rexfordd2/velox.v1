import useSWR from 'swr';
import { Exercise, ExerciseQuery, ExerciseResponse } from '../types/exercise';

interface UseExercisesOptions {
  search?: string;
  difficulty?: string;
  category_id?: number;
  primary_muscle?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useExercises(options: UseExercisesOptions = {}) {
  const { search, difficulty, category_id, primary_muscle } = options;

  // Build query string
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (difficulty) queryParams.set('difficulty', difficulty);
  if (category_id) queryParams.set('category_id', category_id.toString());
  if (primary_muscle) queryParams.set('primary_muscle', primary_muscle);

  const { data, error, isLoading, mutate } = useSWR<Exercise[]>(
    `/api/exercises?${queryParams.toString()}`,
    fetcher
  );

  return {
    exercises: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useExercise(slug: string) {
  const { data, error, isLoading, mutate } = useSWR<Exercise>(
    `/api/exercises/${slug}`,
    fetcher
  );

  return {
    exercise: data,
    isLoading,
    isError: error,
    mutate
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