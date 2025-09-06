"use client";
import { useState, useEffect } from 'react';
// Fallback simple table markup (ui/table not present)
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Exercise } from '@/lib/types/exercise';
import { ExerciseFormModal } from './ExerciseFormModal';
import { useExercises, deleteExercise } from '@/lib/hooks/useExercises';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
// Replace missing toaster with window.alert

export function ExerciseTable() {
  const supabase = getSupabaseBrowserClient();
  const [role, setRole] = useState<string | null>(null);

  // Determine role client-side to hide admin-only controls if not admin
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const r = (data.user?.user_metadata as any)?.role || null;
      setRole(r);
    });
  }, [supabase]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { exercises, isLoading, isError, mutate } = useExercises();

  const handleEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleDelete = async (slug: string) => {
    try {
      await deleteExercise(slug);
      await mutate();
      if (typeof window !== 'undefined') window.alert('Exercise deleted successfully');
    } catch (error) {
      if (typeof window !== 'undefined') window.alert('Failed to delete exercise');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  if (isLoading) return <LoadingState lines={6} />;
  if (isError) return <ErrorState onRetry={() => void mutate()} />;
  if (!exercises || exercises.length === 0) return (
    <EmptyState
      title="No exercises yet"
      description="Create your first exercise to get started."
      actionLabel={role === 'admin' ? 'New Exercise' : undefined}
      onAction={role === 'admin' ? () => setIsModalOpen(true) : undefined}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exercises</h2>
        {role === 'admin' && (
          <Button onClick={() => setIsModalOpen(true)}>New Exercise</Button>
        )}
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Slug</th>
                <th className="py-2 px-3">Difficulty</th>
                <th className="py-2 px-3">Primary Muscle</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise) => (
                <tr key={exercise.id} className="border-b">
                  <td className="py-2 px-3">{exercise.name}</td>
                  <td className="py-2 px-3">{exercise.slug}</td>
                  <td className="py-2 px-3 capitalize">{exercise.difficulty}</td>
                  <td className="py-2 px-3">{exercise.primary_muscle}</td>
                  <td className="py-2 px-3">
                    <div className="flex space-x-2">
                      {role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(exercise)}
                        >
                          Edit
                        </Button>
                      )}
                      {role === 'admin' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDelete(exercise.slug)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExerciseFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        exercise={selectedExercise}
        onSuccess={() => {
          handleModalClose();
          mutate();
        }}
      />
    </div>
  );
} 