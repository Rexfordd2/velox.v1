import { describe, it, expect } from 'vitest';
import { exerciseSchema } from './exercise';

describe('exerciseSchema', () => {
  it('validates a correct exercise', () => {
    const valid = {
      name: 'Push Up',
      slug: 'push-up',
      description: 'desc',
      difficulty: 'beginner',
      primary_muscle: 'chest',
      secondary_muscles: ['triceps'],
      video_demo_url: 'https://example.com',
      category_ids: [1],
      equipment: ['none'],
      instructions: ['Do it']
    };
    expect(() => exerciseSchema.parse(valid)).not.toThrow();
  });
  it('fails on missing name', () => {
    const invalid = {
      slug: 'push-up',
      description: 'desc',
      difficulty: 'beginner',
      primary_muscle: 'chest',
      secondary_muscles: ['triceps'],
      video_demo_url: 'https://example.com',
      category_ids: [1],
      equipment: ['none'],
      instructions: ['Do it']
    };
    expect(() => exerciseSchema.parse(invalid)).toThrow();
  });
  it('fails on invalid difficulty', () => {
    const invalid = {
      name: 'Push Up',
      slug: 'push-up',
      description: 'desc',
      difficulty: 'expert',
      primary_muscle: 'chest',
      secondary_muscles: ['triceps'],
      video_demo_url: 'https://example.com',
      category_ids: [1],
      equipment: ['none'],
      instructions: ['Do it']
    };
    expect(() => exerciseSchema.parse(invalid)).toThrow();
  });
}); 