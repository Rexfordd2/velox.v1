import fs from 'fs';
import path from 'path';

const EXERCISES = [
  {
    id: 'squat',
    name: 'Squat',
    icon: 'DumbbellIcon',
    description: 'A compound exercise that targets the lower body',
    difficulty: 'beginner'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    icon: 'DumbbellIcon',
    description: 'A compound exercise that targets the posterior chain',
    difficulty: 'intermediate'
  },
  {
    id: 'bench_press',
    name: 'Bench Press',
    icon: 'DumbbellIcon',
    description: 'A compound exercise that targets the chest and triceps',
    difficulty: 'intermediate'
  },
  {
    id: 'pushup',
    name: 'Push-Up',
    icon: 'DumbbellIcon',
    description: 'A bodyweight exercise that targets the chest and triceps',
    difficulty: 'beginner'
  },
  {
    id: 'pullup',
    name: 'Pull-Up',
    icon: 'DumbbellIcon',
    description: 'A bodyweight exercise that targets the back and biceps',
    difficulty: 'intermediate'
  },
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    icon: 'DumbbellIcon',
    description: 'A compound exercise that targets the shoulders',
    difficulty: 'intermediate'
  },
  {
    id: 'row',
    name: 'Row',
    icon: 'DumbbellIcon',
    description: 'A compound exercise that targets the back',
    difficulty: 'beginner'
  },
  {
    id: 'lunge',
    name: 'Lunge',
    icon: 'DumbbellIcon',
    description: 'A unilateral exercise that targets the legs',
    difficulty: 'beginner'
  }
];

const outputPath = path.join(process.cwd(), 'apps/web/public/exercises.json');

fs.writeFileSync(outputPath, JSON.stringify(EXERCISES, null, 2));
console.log(`Exercise list generated at ${outputPath}`); 