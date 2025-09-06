'use client';

import { useState } from 'react';
import { trpc } from '@/app/_trpc/client';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkoutSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function WorkoutSelect({ value, onChange }: WorkoutSelectProps) {
  const { data: workouts, isLoading, error, refetch } = trpc.workouts.getRecent.useQuery();

  if (isLoading) return <LoadingState variant="inline" />;
  if (error) return <ErrorState onRetry={() => void refetch()} />;
  if (!workouts || workouts.length === 0) return <EmptyState title="No recent workouts" description="Create a workout to see it here." />;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a workout" />
      </SelectTrigger>
      <SelectContent>
        {workouts?.map((workout) => (
          <SelectItem key={workout.id} value={workout.id}>
            {String((workout as any).title ?? (workout as any).exercise_type ?? 'Workout')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 