import { useState, useEffect } from 'react';
import { Exercise } from '@velox/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DumbbellIcon } from '@heroicons/react/24/outline';

interface ExercisePickerProps {
  onSelect: (exerciseId: string) => void;
}

export function ExercisePicker({ onSelect }: ExercisePickerProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/exercises.json')
      .then(res => res.json())
      .then(data => {
        setExercises(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load exercises');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading exercises...</div>;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map(exercise => (
        <Card
          key={exercise.id}
          className="cursor-pointer hover:bg-accent/5 transition-colors"
          onClick={() => onSelect(exercise.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DumbbellIcon className="w-6 h-6" />
                {exercise.name}
              </CardTitle>
              <Badge variant="outline">
                {exercise.difficulty}
              </Badge>
            </div>
            <CardDescription>{exercise.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" className="w-full">
              Select
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 