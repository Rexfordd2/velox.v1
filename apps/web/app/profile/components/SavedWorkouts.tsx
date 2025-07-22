'use client';

import { trpc } from '@/app/_trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export function SavedWorkouts() {
  const { data: savedWorkouts, isLoading } = trpc.profile.getSavedWorkouts.useQuery();

  if (isLoading) {
    return <div>Loading saved workouts...</div>;
  }

  if (!savedWorkouts?.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No saved workouts yet</p>
      </Card>
    );
  }

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