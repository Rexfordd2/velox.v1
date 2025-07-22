export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseCategory {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  name: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  primary_muscle: string;
  secondary_muscles: string[];
  video_demo_url?: string;
  equipment: string[];
  instructions: string[];
  exercise_to_category: {
    category: ExerciseCategory;
  }[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseQuery {
  search?: string;
  difficulty?: Difficulty;
  primary_muscle?: string;
  category_id?: number;
  page?: number;
  limit?: number;
}

export interface ExerciseResponse {
  exercises: Exercise[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
} 