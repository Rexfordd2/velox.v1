import type { Meta, StoryObj } from '@storybook/react';
import { ExerciseCard } from './ExerciseCard';

const meta: Meta<typeof ExerciseCard> = {
  title: 'Admin/ExerciseCard',
  component: ExerciseCard,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ExerciseCard>;

const baseExercise = {
  id: 1,
  name: 'Push Up',
  slug: 'push-up',
  description: 'A classic bodyweight exercise',
  primary_muscle: 'chest',
  secondary_muscles: ['triceps', 'shoulders'],
  video_demo_url: 'https://example.com',
  equipment: ['none'],
  instructions: ['Start in plank position', 'Lower body', 'Push up'],
  exercise_to_category: [
    { category: { id: 1, name: 'Strength' } }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const Beginner: Story = {
  args: {
    exercise: {
      ...baseExercise,
      difficulty: 'beginner',
    },
  },
};

export const Intermediate: Story = {
  args: {
    exercise: {
      ...baseExercise,
      difficulty: 'intermediate',
    },
  },
};

export const Advanced: Story = {
  args: {
    exercise: {
      ...baseExercise,
      difficulty: 'advanced',
    },
  },
}; 