const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env.local') })

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.error('\nPlease create a .env.local file in the frontend directory with these variables.')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const exercises = [
  {
    id: 1,
    name: 'Barbell Back Squat',
    description: 'A compound lower body exercise targeting quads, glutes, and hamstrings',
    category: 'Strength',
    difficulty: 'intermediate',
    muscle_groups: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    equipment: ['Barbell', 'Squat Rack'],
    instructions: 'Position the barbell on your upper back. Keep your core tight and chest up. Descend by bending at the hips and knees until thighs are parallel to the floor. Drive through your heels to return to starting position.'
  },
  {
    id: 2,
    name: 'Bench Press',
    description: 'Classic chest exercise for building upper body strength',
    category: 'Strength',
    difficulty: 'intermediate',
    muscle_groups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['Barbell', 'Bench'],
    instructions: 'Lie on bench with eyes under the bar. Grip the bar slightly wider than shoulder width. Lower the bar to your chest with control. Press the bar back up to starting position.'
  },
  {
    id: 3,
    name: 'Deadlift',
    description: 'Full body compound movement focusing on posterior chain',
    category: 'Strength',
    difficulty: 'advanced',
    muscle_groups: ['Hamstrings', 'Glutes', 'Lower Back', 'Traps'],
    equipment: ['Barbell'],
    instructions: 'Stand with feet hip-width apart. Bend at hips and knees to grip the bar. Keep back straight and chest up. Drive through heels and extend hips to lift the bar. Stand tall with shoulders back.'
  },
  {
    id: 4,
    name: 'Pull-ups',
    description: 'Bodyweight exercise for back and bicep development',
    category: 'Strength',
    difficulty: 'intermediate',
    muscle_groups: ['Lats', 'Biceps', 'Middle Back', 'Core'],
    equipment: ['Pull-up Bar'],
    instructions: 'Hang from bar with overhand grip, hands shoulder-width apart. Pull your body up until chin clears the bar. Lower with control to full arm extension.'
  },
  {
    id: 5,
    name: 'Push-ups',
    description: 'Classic bodyweight exercise for chest and triceps',
    category: 'Strength',
    difficulty: 'beginner',
    muscle_groups: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    equipment: [],
    instructions: 'Start in plank position with hands shoulder-width apart. Lower your body until chest nearly touches the floor. Push back up to starting position.'
  },
  {
    id: 6,
    name: 'Overhead Press',
    description: 'Shoulder press for building upper body strength',
    category: 'Strength',
    difficulty: 'intermediate',
    muscle_groups: ['Shoulders', 'Triceps', 'Core'],
    equipment: ['Barbell'],
    instructions: 'Stand with feet shoulder-width apart. Clean the bar to shoulder height. Press the bar overhead until arms are fully extended. Lower with control.'
  },
  {
    id: 7,
    name: 'Romanian Deadlift',
    description: 'Hip hinge movement targeting hamstrings and glutes',
    category: 'Strength',
    difficulty: 'intermediate',
    muscle_groups: ['Hamstrings', 'Glutes', 'Lower Back'],
    equipment: ['Barbell'],
    instructions: 'Hold bar at hip level with overhand grip. Keep knees slightly bent. Push hips back and lower the bar while maintaining straight back. Return to starting position by driving hips forward.'
  },
  {
    id: 8,
    name: 'Dumbbell Row',
    description: 'Unilateral back exercise for muscle balance',
    category: 'Strength',
    difficulty: 'beginner',
    muscle_groups: ['Lats', 'Middle Back', 'Biceps'],
    equipment: ['Dumbbell', 'Bench'],
    instructions: 'Place one knee and hand on bench. Keep back parallel to floor. Row dumbbell to your side, squeezing shoulder blade. Lower with control.'
  }
]

async function seedExercises() {
  console.log('🌱 Seeding exercises...\n')
  
  // First check if the table exists and what columns it has
  const { data: tableInfo, error: tableError } = await supabase
    .from('exercises')
    .select('*')
    .limit(1)
  
  if (tableError && tableError.code !== 'PGRST116') {
    console.error('❌ Error checking table:', tableError.message)
    console.log('\n💡 Make sure you have run the database migrations in Supabase.')
    process.exit(1)
  }
  
  for (const exercise of exercises) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .upsert(exercise, { onConflict: 'id' })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error inserting ${exercise.name}:`, error.message)
      } else {
        console.log(`✅ Inserted ${exercise.name}`)
      }
    } catch (err) {
      console.error(`❌ Unexpected error with ${exercise.name}:`, err)
    }
  }
  
  console.log('\n🎉 Seeding complete!')
  process.exit(0)
}

seedExercises().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
}) 