import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useExercises } from '../../lib/hooks/useExercises';
import { Exercise } from '../../lib/types/exercise';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Plus, Trash2, GripVertical, Clock, Save } from 'lucide-react';

interface WorkoutExercise extends Exercise {
  sets: number;
  reps: number;
  restTime: number;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'power';
  exercises: WorkoutExercise[];
}

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'strength-basic',
    name: 'Basic Strength',
    description: 'Fundamental compound movements for building strength',
    goal: 'strength',
    exercises: []
  },
  {
    id: 'hypertrophy-push',
    name: 'Push Day',
    description: 'Upper body pushing movements for muscle growth',
    goal: 'hypertrophy',
    exercises: []
  }
];

export function WorkoutBuilder() {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { exercises, isLoading } = useExercises({ search: searchQuery });

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises(prev => [
      ...prev,
      {
        ...exercise,
        sets: 3,
        reps: 10,
        restTime: 90
      }
    ]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, updates: Partial<WorkoutExercise>) => {
    setSelectedExercises(prev => 
      prev.map((exercise, i) => 
        i === index ? { ...exercise, ...updates } : exercise
      )
    );
  };

  const saveWorkout = () => {
    // TODO: Implement workout saving
    console.log('Saving workout:', {
      name: workoutName,
      exercises: selectedExercises
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Create Workout</h1>
        <Input
          type="text"
          placeholder="Workout Name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exercise Search */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          <div className="bg-gray-800 rounded-xl p-4 h-[calc(100vh-300px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {exercises?.map(exercise => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => addExercise(exercise)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{exercise.name}</h3>
                      <Plus className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{exercise.difficulty}</Badge>
                      <Badge variant="outline">{exercise.primary_muscle}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workout Builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <Reorder.Group
              axis="y"
              values={selectedExercises}
              onReorder={setSelectedExercises}
              className="space-y-4"
            >
              {selectedExercises.map((exercise, index) => (
                <Reorder.Item
                  key={`${exercise.id}-${index}`}
                  value={exercise}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <div className="flex-grow">
                      <h3 className="font-semibold mb-2">{exercise.name}</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Sets</label>
                          <Input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, { sets: parseInt(e.target.value) })}
                            min={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Reps</label>
                          <Input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(index, { reps: parseInt(e.target.value) })}
                            min={1}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Rest (sec)</label>
                          <Input
                            type="number"
                            value={exercise.restTime}
                            onChange={(e) => updateExercise(index, { restTime: parseInt(e.target.value) })}
                            min={0}
                            step={15}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeExercise(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {selectedExercises.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Add exercises to build your workout
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Workout Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORKOUT_TEMPLATES.map(template => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer"
                >
                  <h3 className="font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                  <Badge variant="secondary">{template.goal}</Badge>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveWorkout}
              disabled={!workoutName || selectedExercises.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Workout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 