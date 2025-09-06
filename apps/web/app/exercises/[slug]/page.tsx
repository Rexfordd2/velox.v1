'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExercise } from '../../../lib/hooks/useExercises';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Video, Book, Target, Award, ChevronRight } from 'lucide-react';

interface FormCheckpoint {
  id: string;
  name: string;
  description: string;
  correctForm: string;
  commonMistakes: string[];
  cues: string[];
}

interface ExerciseProgression {
  level: 'beginner' | 'intermediate' | 'advanced';
  variation: string;
  description: string;
  requirements: string[];
}

const FORM_CHECKPOINTS: Record<string, FormCheckpoint[]> = {
  squat: [
    {
      id: 'hip-hinge',
      name: 'Hip Hinge',
      description: 'Proper hip hinge movement initiating the squat',
      correctForm: 'Push hips back while maintaining neutral spine',
      commonMistakes: [
        'Bending forward at waist instead of hips',
        'Rounding lower back',
        'Knees traveling too far forward'
      ],
      cues: [
        'Sit back as if reaching for a chair',
        'Keep chest up and proud',
        'Push knees out slightly'
      ]
    },
    {
      id: 'depth',
      name: 'Squat Depth',
      description: 'Achieving proper depth while maintaining form',
      correctForm: 'Thighs parallel to ground or slightly below',
      commonMistakes: [
        'Not reaching parallel depth',
        'Butt wink at bottom',
        'Heels lifting off ground'
      ],
      cues: [
        'Break parallel with thighs',
        'Keep weight in heels',
        'Maintain neutral spine throughout'
      ]
    }
  ],
  deadlift: [
    {
      id: 'setup',
      name: 'Setup Position',
      description: 'Proper starting position for the deadlift',
      correctForm: 'Bar over mid-foot, shoulders over bar, hips high',
      commonMistakes: [
        'Bar too far from shins',
        'Shoulders behind or too far over bar',
        'Hips too low'
      ],
      cues: [
        'Bar touching shins',
        'Shoulders slightly ahead of bar',
        'Feel hamstrings loaded'
      ]
    }
  ]
};

const PROGRESSIONS: Record<string, ExerciseProgression[]> = {
  squat: [
    {
      level: 'beginner',
      variation: 'Bodyweight Squat',
      description: 'Master the basic movement pattern',
      requirements: ['Balance', 'Basic mobility']
    },
    {
      level: 'intermediate',
      variation: 'Goblet Squat',
      description: 'Add weight to build strength',
      requirements: ['Perfect bodyweight form', 'Core stability']
    },
    {
      level: 'advanced',
      variation: 'Barbell Back Squat',
      description: 'Maximum strength development',
      requirements: ['Strong core', 'Good mobility', 'Previous lifting experience']
    }
  ]
};

export default function ExerciseDetailPage({ params }: { params: { slug: string } }) {
  const { exercise, isLoading } = useExercise(params.slug);
  const [selectedTab, setSelectedTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Exercise not found</h1>
        <a href="/exercises" className="text-purple-400 hover:underline">Back to Exercise Library</a>
      </div>
    );
  }

  const formCheckpoints = FORM_CHECKPOINTS[exercise.slug] || [];
  const progressions = PROGRESSIONS[exercise.slug] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold">{exercise.name}</h1>
          <Badge variant="secondary">{exercise.difficulty}</Badge>
        </div>
        <p className="text-gray-400 text-lg">{exercise.description}</p>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Form Analysis
          </TabsTrigger>
          <TabsTrigger value="progression" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Progression
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Video Demo */}
            {exercise.video_demo_url && (
              <div className="bg-gray-800 rounded-xl aspect-video">
                <video
                  src={exercise.video_demo_url}
                  controls
                  className="w-full h-full rounded-xl"
                />
              </div>
            )}

            {/* Instructions */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {exercise.instructions.map((instruction, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>

              {/* Muscles */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Muscles Worked</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">{exercise.primary_muscle}</Badge>
                  {exercise.secondary_muscles.map(muscle => (
                    <Badge key={muscle} variant="outline">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <h2 className="text-2xl font-semibold mb-4">Equipment Needed</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.equipment.map(item => (
                    <Badge key={item} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="form">
          <div className="space-y-8">
            {formCheckpoints.map((checkpoint, index) => (
              <motion.div
                key={checkpoint.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold mb-2">{checkpoint.name}</h3>
                <p className="text-gray-400 mb-4">{checkpoint.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Correct Form */}
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">Correct Form</h4>
                    <p>{checkpoint.correctForm}</p>
                  </div>

                  {/* Common Mistakes */}
                  <div>
                    <h4 className="font-semibold text-red-400 mb-2">Common Mistakes</h4>
                    <ul className="space-y-2">
                      {checkpoint.commonMistakes.map((mistake, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Coaching Cues */}
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-purple-400 mb-2">Coaching Cues</h4>
                    <ul className="space-y-2">
                      {checkpoint.cues.map((cue, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full" />
                          {cue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progression">
          <div className="space-y-8">
            {progressions.map((progression, index) => (
              <motion.div
                key={progression.level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">{progression.variation}</h3>
                  <Badge variant="secondary">{progression.level}</Badge>
                </div>

                <p className="text-gray-400 mb-4">{progression.description}</p>

                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <ul className="space-y-2">
                    {progression.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-purple-500" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 