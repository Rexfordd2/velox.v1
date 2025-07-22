import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Calendar, Target, Trophy, Activity, ArrowRight } from 'lucide-react';

interface ProgramWeek {
  weekNumber: number;
  workouts: {
    day: number;
    name: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
      intensity: string;
    }[];
  }[];
}

interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  focus: 'strength' | 'hypertrophy' | 'endurance' | 'sport-specific' | 'rehabilitation';
  schedule: ProgramWeek[];
}

const SAMPLE_PROGRAMS: TrainingProgram[] = [
  {
    id: 'beginner-strength',
    name: 'Beginner Strength Foundation',
    description: 'Build a solid foundation of strength with fundamental movements',
    duration: 12,
    level: 'beginner',
    focus: 'strength',
    schedule: [
      {
        weekNumber: 1,
        workouts: [
          {
            day: 1,
            name: 'Full Body A',
            exercises: [
              { name: 'Squat', sets: 3, reps: '8-10', intensity: '60-70%' },
              { name: 'Bench Press', sets: 3, reps: '8-10', intensity: '60-70%' },
              { name: 'Row', sets: 3, reps: '10-12', intensity: 'moderate' }
            ]
          },
          {
            day: 3,
            name: 'Full Body B',
            exercises: [
              { name: 'Deadlift', sets: 3, reps: '8-10', intensity: '60-70%' },
              { name: 'Overhead Press', sets: 3, reps: '8-10', intensity: '60-70%' },
              { name: 'Pull-ups', sets: 3, reps: 'max', intensity: 'bodyweight' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'sport-basketball',
    name: 'Basketball Performance',
    description: 'Enhance explosiveness and agility for basketball',
    duration: 8,
    level: 'intermediate',
    focus: 'sport-specific',
    schedule: [
      {
        weekNumber: 1,
        workouts: [
          {
            day: 1,
            name: 'Lower Body Power',
            exercises: [
              { name: 'Box Jumps', sets: 4, reps: '5', intensity: 'explosive' },
              { name: 'Split Squats', sets: 3, reps: '8 each', intensity: 'moderate' },
              { name: 'Calf Raises', sets: 4, reps: '15-20', intensity: 'moderate' }
            ]
          },
          {
            day: 2,
            name: 'Upper Body & Core',
            exercises: [
              { name: 'Medicine Ball Throws', sets: 4, reps: '6-8', intensity: 'explosive' },
              { name: 'Push-ups', sets: 3, reps: '12-15', intensity: 'moderate' },
              { name: 'Planks', sets: 3, reps: '45s', intensity: 'hold' }
            ]
          }
        ]
      }
    ]
  }
];

export function TrainingProgram() {
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Training Programs</h1>
        <p className="text-gray-400">
          Structured programs for specific goals and skill levels
        </p>
      </div>

      {!selectedProgram ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_PROGRAMS.map(program => (
            <motion.div
              key={program.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-xl p-6 cursor-pointer"
              onClick={() => setSelectedProgram(program)}
            >
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary">{program.focus}</Badge>
                <Badge>{program.level}</Badge>
              </div>
              <h2 className="text-xl font-semibold mb-2">{program.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{program.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {program.duration} weeks
                </div>
                <Button variant="link" className="text-purple-400">
                  View Program
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Program Header */}
          <div className="flex items-start justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => setSelectedProgram(null)}
                className="mb-4"
              >
                ← Back to Programs
              </Button>
              <h2 className="text-2xl font-bold mb-2">{selectedProgram.name}</h2>
              <p className="text-gray-400">{selectedProgram.description}</p>
            </div>
            <div className="flex flex-col items-end">
              <Badge className="mb-2">{selectedProgram.level}</Badge>
              <Badge variant="secondary">{selectedProgram.focus}</Badge>
            </div>
          </div>

          {/* Week Selection */}
          <div className="flex items-center gap-4 bg-gray-800 rounded-xl p-4">
            <span className="text-sm text-gray-400">Week:</span>
            <div className="flex gap-2">
              {Array.from({ length: selectedProgram.duration }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentWeek(i + 1)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentWeek === i + 1
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedProgram.schedule
              .find(week => week.weekNumber === currentWeek)
              ?.workouts.map(workout => (
                <motion.div
                  key={workout.day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{workout.name}</h3>
                    <Badge>Day {workout.day}</Badge>
                  </div>

                  <div className="space-y-4">
                    {workout.exercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-semibold mb-1">{exercise.name}</h4>
                          <div className="text-sm text-gray-400">
                            {exercise.sets} sets × {exercise.reps}
                          </div>
                        </div>
                        <Badge variant="outline">{exercise.intensity}</Badge>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Progress Tracking */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Progress Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold">Completion</h4>
                </div>
                <div className="text-2xl font-bold">25%</div>
                <div className="text-sm text-gray-400">3 of 12 workouts done</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold">Achievement</h4>
                </div>
                <div className="text-2xl font-bold">2/5</div>
                <div className="text-sm text-gray-400">Program milestones</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h4 className="font-semibold">Consistency</h4>
                </div>
                <div className="text-2xl font-bold">85%</div>
                <div className="text-sm text-gray-400">Workout adherence</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 