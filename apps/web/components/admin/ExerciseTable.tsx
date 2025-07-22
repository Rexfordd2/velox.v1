import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Exercise } from '@/lib/types/exercise';
import { ExerciseFormModal } from './ExerciseFormModal';
import { useExercises, deleteExercise } from '@/lib/hooks/useExercises';
import { toast } from 'sonner';

export function ExerciseTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { exercises, isLoading, mutate } = useExercises();

  const handleEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleDelete = async (slug: string) => {
    try {
      await deleteExercise(slug);
      await mutate();
      toast.success('Exercise deleted successfully');
    } catch (error) {
      toast.error('Failed to delete exercise');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExercise(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exercises</h2>
        <Button onClick={() => setIsModalOpen(true)}>New Exercise</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Primary Muscle</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell>{exercise.name}</TableCell>
                <TableCell>{exercise.slug}</TableCell>
                <TableCell className="capitalize">{exercise.difficulty}</TableCell>
                <TableCell>{exercise.primary_muscle}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(exercise)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(exercise.slug)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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