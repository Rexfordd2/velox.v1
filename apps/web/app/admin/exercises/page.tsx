import { ExerciseTable } from '@/components/admin/ExerciseTable';

export default function AdminExercisesPage() {
  // TODO: Add useSession() and admin guard
  return (
    <div className="max-w-5xl mx-auto py-8">
      <ExerciseTable />
    </div>
  );
} 