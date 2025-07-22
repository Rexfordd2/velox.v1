import React from 'react';
import { useExercise } from '@/lib/hooks/useExercises';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function ExerciseDetailPage() {
  const { slug } = useParams();
  const { exercise, isLoading } = useExercise(slug as string);

  if (isLoading) return <div>Loading...</div>;
  if (!exercise) return <div>Not found</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">{exercise.name}</h1>
      <div className="flex gap-2">
        <span className="chip">{exercise.difficulty}</span>
        <span className="chip">{exercise.primary_muscle}</span>
        {exercise.secondary_muscles.map(m => (
          <span key={m} className="chip chip-secondary">{m}</span>
        ))}
      </div>
      <div className="prose">
        <ReactMarkdown>{exercise.description}</ReactMarkdown>
      </div>
      {exercise.video_demo_url && (
        <div>
          <iframe
            src={exercise.video_demo_url}
            title="Demo Video"
            className="w-full aspect-video rounded"
            allowFullScreen
          />
        </div>
      )}
      <button className="btn btn-disabled" disabled>Add to Workout (coming soon)</button>
    </div>
  );
} 