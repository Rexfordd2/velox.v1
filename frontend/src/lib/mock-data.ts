export type Exercise = {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  formCues: string[];
  videoUrl?: string;
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  reps: number;
  weight?: number;
  score?: number;
  feedback?: string[];
  timestamp: string;
};

export type UserProgress = {
  exerciseId: string;
  bestScore: number;
  totalSets: number;
  averageScore: number;
  lastAttempt: string;
};

// Mock Exercises
export const mockExercises: Exercise[] = [
  {
    id: 'squat-001',
    name: 'Barbell Squat',
    description: 'A compound exercise that primarily targets the legs and core.',
    difficulty: 'intermediate',
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'core'],
    formCues: [
      'Keep chest up',
      'Knees tracking over toes',
      'Hip crease below parallel',
      'Maintain neutral spine'
    ]
  },
  {
    id: 'deadlift-001',
    name: 'Conventional Deadlift',
    description: 'A fundamental compound movement for building overall strength.',
    difficulty: 'intermediate',
    muscleGroups: ['back', 'hamstrings', 'glutes', 'forearms'],
    formCues: [
      'Bar against shins',
      'Chest up, hips back',
      'Neutral spine throughout',
      'Push through the floor'
    ]
  },
  {
    id: 'bench-001',
    name: 'Bench Press',
    description: 'The classic upper body strength exercise.',
    difficulty: 'intermediate',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    formCues: [
      'Retract shoulder blades',
      'Feet planted firmly',
      'Bar path straight up and down',
      'Full range of motion'
    ]
  }
];

// Mock Workout Sets
export const mockWorkoutSets: WorkoutSet[] = [
  {
    id: 'set-001',
    exerciseId: 'squat-001',
    reps: 5,
    weight: 225,
    score: 92,
    feedback: ['Great depth', 'Maintain tighter core'],
    timestamp: new Date(Date.now() - 86400000).toISOString() // Yesterday
  },
  {
    id: 'set-002',
    exerciseId: 'deadlift-001',
    reps: 3,
    weight: 315,
    score: 88,
    feedback: ['Good hip hinge', 'Keep bar closer to shins'],
    timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];

// Mock User Progress
export const mockUserProgress: UserProgress[] = [
  {
    exerciseId: 'squat-001',
    bestScore: 95,
    totalSets: 12,
    averageScore: 87,
    lastAttempt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    exerciseId: 'deadlift-001',
    bestScore: 91,
    totalSets: 8,
    averageScore: 85,
    lastAttempt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    exerciseId: 'bench-001',
    bestScore: 89,
    totalSets: 15,
    averageScore: 82,
    lastAttempt: new Date(Date.now() - 259200000).toISOString()
  }
]; 