"use client";
import React, { useState, useEffect } from 'react';
import { useExercisesInfinite } from '@/lib/hooks/useExercises';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { useSearchParams, useRouter } from 'next/navigation';
// TODO: Replace with real ExerciseCard
function ExerciseCard({ exercise }: any) {
  return (
    <div className="border rounded p-4">
      <h3 className="font-bold">{exercise.name}</h3>
      <div className="text-xs text-gray-500">{exercise.difficulty}</div>
      <div className="text-xs">{exercise.primary_muscle}</div>
    </div>
  );
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const PRIMARY_MUSCLES = [
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'calves'
];
const CATEGORIES = [
  { id: 1, name: 'Strength' },
  { id: 2, name: 'Cardio' },
  { id: 3, name: 'Flexibility' },
  { id: 4, name: 'Balance' },
  { id: 5, name: 'Core' }
];

export default function ExercisesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [primaryMuscle, setPrimaryMuscle] = useState(searchParams.get('primary_muscle') || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined);
  const { exercises, isLoading, isError, fetchNextPage, hasMore } = useExercisesInfinite({ search, difficulty, primary_muscle: primaryMuscle, category_id: categoryId, limit: 36, sortBy: 'name', sortDir: 'asc' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (search) params.set('search', search); else params.delete('search');
    if (difficulty) params.set('difficulty', difficulty); else params.delete('difficulty');
    if (primaryMuscle) params.set('primary_muscle', primaryMuscle); else params.delete('primary_muscle');
    if (categoryId) params.set('category_id', String(categoryId)); else params.delete('category_id');
    router.replace(`${window.location.pathname}?${params.toString()}`);
  }, [search, difficulty, primaryMuscle, categoryId, router]);

  return (
    <div className="flex gap-8 max-w-7xl mx-auto py-8">
      <aside className="w-64 space-y-4">
        <input
          className="input w-full"
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div>
          <div className="font-semibold mb-1">Difficulty</div>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`chip ${difficulty === d ? 'chip-active' : ''}`}
                onClick={() => setDifficulty(difficulty === d ? '' : d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">Primary Muscle</div>
          <div className="flex flex-wrap gap-2">
            {PRIMARY_MUSCLES.map(m => (
              <button
                key={m}
                className={`chip ${primaryMuscle === m ? 'chip-active' : ''}`}
                onClick={() => setPrimaryMuscle(primaryMuscle === m ? '' : m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">Category</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`chip ${categoryId === cat.id ? 'chip-active' : ''}`}
                onClick={() => setCategoryId(categoryId === cat.id ? undefined : cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading && <LoadingState lines={6} />}
        {isError && <ErrorState onRetry={() => void fetchNextPage()} />}
        {!isLoading && !isError && (!exercises || exercises.length === 0) && (
          <EmptyState title="No exercises found" description="Try changing filters or search terms." />
        )}
        {!isLoading && !isError && exercises?.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
      </main>
      <div className="w-full flex justify-center py-6">
        <button className="btn" disabled={!hasMore} onClick={() => void fetchNextPage()}>{hasMore ? 'Load more' : 'No more'}</button>
      </div>
    </div>
  );
} 