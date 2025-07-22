'use client'

import { useState } from 'react'

export interface Exercise {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  muscle_groups?: string[]
  equipment?: string[]
  instructions?: string
  primary_muscle?: string
  secondary_muscles?: string[]
}

interface ExercisePickerProps {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
}

export function ExercisePicker({ exercises, onSelect }: ExercisePickerProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        type="text"
        placeholder="Search exercises..."
        className="input-field w-full mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="space-y-2">
        {filteredExercises.map((exercise) => (
          <button
            key={exercise.id}
            className="w-full p-4 text-left bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            onClick={() => onSelect(exercise)}
          >
            <h3 className="font-semibold text-white">{exercise.name}</h3>
            {exercise.description && (
              <p className="text-sm text-gray-400 mt-1">{exercise.description}</p>
            )}
            <div className="mt-2 flex gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded ${
                exercise.difficulty === 'beginner' 
                  ? 'bg-green-500/20 text-green-400'
                  : exercise.difficulty === 'intermediate'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {exercise.difficulty}
              </span>
              {exercise.category && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                  {exercise.category}
                </span>
              )}
              {exercise.primary_muscle && (
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                  {exercise.primary_muscle}
                </span>
              )}
            </div>
          </button>
        ))}
        {filteredExercises.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            No exercises found matching "{searchTerm}"
          </p>
        )}
      </div>
    </div>
  )
} 