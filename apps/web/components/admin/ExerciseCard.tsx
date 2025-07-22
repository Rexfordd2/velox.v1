import React from 'react';
import { Exercise } from '@/lib/types/exercise';

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="border rounded p-4 space-y-2">
      <h3 className="font-bold text-lg">{exercise.name}</h3>
      <div className="flex gap-2 text-xs">
        <span className="chip">{exercise.difficulty}</span>
        <span className="chip">{exercise.primary_muscle}</span>
        {exercise.secondary_muscles.map(m => (
          <span key={m} className="chip chip-secondary">{m}</span>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap mt-2">
        {exercise.exercise_to_category?.map(rel => (
          <span key={rel.category.id} className="chip chip-category">{rel.category.name}</span>
        ))}
      </div>
    </div>
  );
} 