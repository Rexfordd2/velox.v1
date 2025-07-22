import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExercises } from '../../lib/hooks/useExercises';
import { Exercise } from '../../lib/types/exercise';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Heart, Search, Filter, Dumbbell, Activity, StretchHorizontal } from 'lucide-react';
import { useLocalStorage } from '../../lib/hooks/useLocalStorage';

// Exercise categories with icons
const CATEGORIES = [
  { id: 'strength', name: 'Strength', icon: Dumbbell },
  { id: 'cardio', name: 'Cardio', icon: Activity },
  { id: 'flexibility', name: 'Flexibility', icon: StretchHorizontal }
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const EQUIPMENT = [
  'none',
  'dumbbell',
  'barbell',
  'kettlebell',
  'resistance bands',
  'pull-up bar',
  'bench',
  'squat rack'
];

const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'quads',
  'hamstrings',
  'glutes',
  'calves'
];

export function ExerciseLibrary() {
  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useLocalStorage<string[]>('favoriteExercises', []);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch exercises
  const { exercises, isLoading } = useExercises({
    search: searchQuery,
    difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
    category_id: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined
  });

  // Filter exercises based on selected criteria
  const filteredExercises = exercises?.filter(exercise => {
    if (selectedEquipment.length > 0 && !exercise.equipment.some(e => selectedEquipment.includes(e))) {
      return false;
    }
    if (selectedMuscles.length > 0 && !selectedMuscles.includes(exercise.primary_muscle) && 
        !exercise.secondary_muscles.some(m => selectedMuscles.includes(m))) {
      return false;
    }
    return true;
  });

  // Toggle favorite status
  const toggleFavorite = (exerciseId: number) => {
    setFavorites((prev: string[]) => 
      prev.includes(exerciseId.toString())
        ? prev.filter(id => id !== exerciseId.toString())
        : [...prev, exerciseId.toString()]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Exercise Library</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800 rounded-lg p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Difficulty */}
              <div>
                <h3 className="font-semibold mb-2">Difficulty</h3>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map(difficulty => (
                    <Badge
                      key={difficulty}
                      variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedDifficulty(
                        selectedDifficulty === difficulty ? 'all' : difficulty
                      )}
                    >
                      {difficulty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <h3 className="font-semibold mb-2">Equipment</h3>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map(equipment => (
                    <Badge
                      key={equipment}
                      variant={selectedEquipment.includes(equipment) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedEquipment(prev =>
                        prev.includes(equipment)
                          ? prev.filter(e => e !== equipment)
                          : [...prev, equipment]
                      )}
                    >
                      {equipment}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Muscle Groups */}
              <div className="lg:col-span-2">
                <h3 className="font-semibold mb-2">Muscle Groups</h3>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map(muscle => (
                    <Badge
                      key={muscle}
                      variant={selectedMuscles.includes(muscle) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedMuscles(prev =>
                        prev.includes(muscle)
                          ? prev.filter(m => m !== muscle)
                          : [...prev, muscle]
                      )}
                    >
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map(category => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center space-x-2"
            >
              <category.icon className="w-4 h-4" />
              <span>{category.name}</span>
            </TabsTrigger>
          ))}
          <TabsTrigger value="favorites" className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span>Favorites</span>
          </TabsTrigger>
        </TabsList>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-lg p-6 animate-pulse h-48"
              />
            ))
          ) : filteredExercises?.map(exercise => (
            <motion.div
              key={exercise.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 relative group"
            >
              {/* Favorite button */}
              <button
                onClick={() => toggleFavorite(exercise.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    favorites.includes(exercise.id.toString()) ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
              </button>

              {/* Exercise content */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">{exercise.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">
                  {exercise.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{exercise.difficulty}</Badge>
                  <Badge variant="outline">{exercise.primary_muscle}</Badge>
                  {exercise.equipment.map(item => (
                    <Badge key={item} variant="outline">{item}</Badge>
                  ))}
                </div>

                <Button
                  variant="link"
                  className="text-purple-400 hover:text-purple-300 p-0"
                  onClick={() => {/* TODO: Navigate to exercise detail */}}
                >
                  View Details →
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </Tabs>
    </div>
  );
} 