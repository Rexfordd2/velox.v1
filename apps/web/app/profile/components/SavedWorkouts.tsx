'use client';

import { trpc } from '@/app/_trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDistanceToNow } from 'date-fns';

export function SavedWorkouts() {
  const { data: savedWorkouts, isLoading, error, refetch } = trpc.profile.getSavedWorkouts.useQuery();

  if (isLoading) return <LoadingState lines={3} />;
  if (error) return <ErrorState onRetry={() => void refetch()} />;
  if (!savedWorkouts?.length) return <EmptyState title="No saved workouts yet" description="Save workouts to access them quickly here." />;

  return (
    <div className="space-y-4">
      {savedWorkouts.map((saved) => (
        <Card key={saved.id} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{saved.workout.title}</h3>
              <p className="text-sm text-gray-500">
                Saved {formatDistanceToNow(new Date(saved.created_at), { addSuffix: true })}
              </p>
            </div>
            <Button variant="outline">View Workout</Button>
          </div>

          {/* Workout Details */}
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">{saved.workout.description}</p>
            <div className="flex gap-2 flex-wrap">
              {saved.workout.workout_sets.map((set) => (
                <span
                  key={set.movement.id}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {set.movement.name}
                </span>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 