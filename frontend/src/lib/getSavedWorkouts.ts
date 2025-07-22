export interface SavedWorkout {
  id: string;
  title: string;
  description?: string;
  created_at: string;
}

const mockWorkouts: SavedWorkout[] = [
  {
    id: 'workout-1',
    title: 'Full Body Strength',
    description: 'Compound movements focusing on form',
    created_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
  },
  {
    id: 'workout-2',
    title: 'Lower Body Power',
    description: 'Squats and deadlifts with perfect form',
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    id: 'workout-3',
    title: 'Upper Body Focus',
    description: 'Bench press and overhead press',
    created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  }
];

export default async function getSavedWorkouts(limit?: number): Promise<SavedWorkout[]> {
  // Return mock workouts for development
  return limit ? mockWorkouts.slice(0, limit) : mockWorkouts;
} 