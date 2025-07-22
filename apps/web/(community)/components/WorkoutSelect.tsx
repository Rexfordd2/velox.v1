'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
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
  const { data: workouts, isLoading } = trpc.workouts.getRecent.useQuery();

  if (isLoading) {
    return <div>Loading workouts...</div>;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a workout" />
      </SelectTrigger>
      <SelectContent>
        {workouts?.map((workout) => (
          <SelectItem key={workout.id} value={workout.id}>
            {workout.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 