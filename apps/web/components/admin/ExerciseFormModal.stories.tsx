import type { Meta, StoryObj } from '@storybook/react';
import { ExerciseFormModal } from './ExerciseFormModal';

const meta: Meta<typeof ExerciseFormModal> = {
  title: 'Admin/ExerciseFormModal',
  component: ExerciseFormModal,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ExerciseFormModal>;

export const Create: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    exercise: null,
    onSuccess: () => {},
  },
};

export const Edit: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    exercise: {
      id: 1,
      name: 'Push Up',
      slug: 'push-up',
      description: 'A classic bodyweight exercise',
      difficulty: 'beginner',
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
    },
    onSuccess: () => {},
  },
}; 