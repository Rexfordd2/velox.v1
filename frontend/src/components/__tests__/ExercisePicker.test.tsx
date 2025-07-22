import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExercisePicker, Exercise } from '../ExercisePicker';
import React from 'react';

const mockExercises: Exercise[] = [
  {
    id: '1',
    name: 'Push-up',
    description: 'A basic bodyweight exercise',
    category: 'strength',
    difficulty: 'beginner',
    muscle_groups: ['chest', 'shoulders'],
    equipment: ['none'],
    instructions: 'Start in a plank position...',
    primary_muscle: 'chest',
    secondary_muscles: ['shoulders', 'triceps']
  },
  {
    id: '2',
    name: 'Squat',
    description: 'A fundamental lower body exercise',
    category: 'strength',
    difficulty: 'beginner',
    muscle_groups: ['legs'],
    equipment: ['none'],
    instructions: 'Stand with feet shoulder-width apart...',
    primary_muscle: 'quadriceps',
    secondary_muscles: ['glutes', 'hamstrings']
  }
];

describe('ExercisePicker', () => {
  it('renders the list of exercises', () => {
    const onSelect = vi.fn();
    render(<ExercisePicker exercises={mockExercises} onSelect={onSelect} />);

    expect(screen.getByText('Push-up')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
  });

  it('calls onSelect when an exercise is clicked', () => {
    const onSelect = vi.fn();
    render(<ExercisePicker exercises={mockExercises} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Push-up'));
    expect(onSelect).toHaveBeenCalledWith(mockExercises[0]);
  });

  it('filters exercises by search term', () => {
    const onSelect = vi.fn();
    render(<ExercisePicker exercises={mockExercises} onSelect={onSelect} />);

    const searchInput = screen.getByPlaceholderText('Search exercises...');
    fireEvent.change(searchInput, { target: { value: 'push' } });

    expect(screen.getByText('Push-up')).toBeInTheDocument();
    expect(screen.queryByText('Squat')).not.toBeInTheDocument();
  });
}); 