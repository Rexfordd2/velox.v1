import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

// Emulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env from frontend/.env.local if present (common in this repo)
const frontendEnvPath = path.join(__dirname, '../frontend/.env.local')
if (fs.existsSync(frontendEnvPath)) {
  dotenv.config({ path: frontendEnvPath })
} else {
  dotenv.config()
}

// Gate running via env flags
const runDbSeed = process.env.RUN_DB_SEED === 'true'
const allowProdSeed = process.env.ALLOW_PROD_SEED === 'true'
const nodeEnv = process.env.NODE_ENV || 'development'

if (!runDbSeed) {
  console.log('RUN_DB_SEED not set to true. Skipping seed.')
  process.exit(0)
}

if (['production', 'prod'].includes(nodeEnv) && !allowProdSeed) {
  console.error('Refusing to seed in production without ALLOW_PROD_SEED=true')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing required env: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

async function ensureAdminUser() {
  // Admin credentials configured via env, with safe defaults for local
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'

  const auth = (supabase as any).auth.admin
  if (!auth) {
    throw new Error('Supabase admin auth API unavailable. Ensure service role key is used.')
  }

  // Look up user by email directly in auth schema (service role required)
  let userId: string | undefined
  let existingMetadata: Record<string, any> | undefined
  try {
    const { data: userRow, error: findErr } = await (supabase as any)
      .schema('auth')
      .from('users')
      .select('id, email, user_metadata')
      .eq('email', adminEmail)
      .maybeSingle()
    if (findErr && (findErr as any).code !== 'PGRST116') {
      throw findErr
    }
    if (userRow) {
      userId = userRow.id
      existingMetadata = userRow.user_metadata || {}
    }
  } catch (e) {
    // If schema read fails for any reason, fall back to listing users
    const { data: list } = await auth.listUsers({ page: 1, perPage: 200 })
    userId = list?.users?.find((u: any) => u.email === adminEmail)?.id
  }

  if (!userId) {
    const { data: created, error: createErr } = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'admin', is_admin: true }
    })
    if (createErr) {
      // If email already exists, try to find by listing
      const { data: list, error: listErr } = await auth.listUsers({ page: 1, perPage: 200 })
      if (listErr) throw listErr
      userId = list.users.find((u: any) => u.email === adminEmail)?.id
      if (!userId) throw createErr
    } else {
      userId = created?.user?.id
    }
  }

  if (!userId) throw new Error('Failed to find or create admin user id')

  // Ensure admin metadata flags are present
  try {
    const merged = { ...(existingMetadata || {}), role: 'admin', is_admin: true }
    await auth.updateUserById(userId, { user_metadata: merged })
  } catch {
    // Non-fatal
  }

  // Idempotently upsert into admin_users
  try {
    const { error: adminInsertErr } = await supabase
      .from('admin_users')
      .upsert({ id: userId }, { onConflict: 'id' })
    if (adminInsertErr) throw adminInsertErr
  } catch (e: any) {
    // If admin_users table is missing (migrations not applied), continue
    console.warn('Could not upsert into admin_users; ensure migrations are applied. Details:', e?.message || e)
  }

  console.log(`Admin user ready: ${adminEmail} (${userId})`)
  return userId
}

async function ensureAdminProfile(userId: string) {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle()
    if (profileErr && (profileErr as any).code !== 'PGRST116') throw profileErr

    if (!profile) {
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: userId, username: 'admin' })
      if (insertErr) throw insertErr
      console.log('Created admin profile')
    } else if (!profile.username) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ username: 'admin' })
        .eq('id', userId)
      if (updateErr) throw updateErr
      console.log('Updated admin profile username')
    }
  } catch (e: any) {
    if (e?.code === 'PGRST116') {
      console.warn('profiles table not found; skipping admin profile ensure.')
    } else {
      console.warn('Skipping profile ensure due to error:', e?.message || e)
    }
  }
}

async function seedReferenceData() {
  // Ensure exercises table exists before upserting
  const { error: exercisesProbeErr } = await supabase
    .from('exercises')
    .select('id')
    .limit(1)
  if (exercisesProbeErr) {
    if ((exercisesProbeErr as any).code === 'PGRST116') {
      console.warn('Exiting seed: exercises table not found (run migrations first).')
      return
    }
    throw exercisesProbeErr
  }

  const minimalExercises = [
    { id: 1, name: 'Barbell Back Squat', category: 'Strength', difficulty: 'intermediate', description: 'Compound lower body', muscle_groups: ['Quadriceps','Glutes','Hamstrings','Core'], equipment: ['Barbell','Squat Rack'], instructions: 'Keep core tight; squat to parallel; drive up.' },
    { id: 2, name: 'Bench Press', category: 'Strength', difficulty: 'intermediate', description: 'Upper body push', muscle_groups: ['Chest','Shoulders','Triceps'], equipment: ['Barbell','Bench'], instructions: 'Lower to chest; press to lockout.' },
    { id: 3, name: 'Deadlift', category: 'Strength', difficulty: 'advanced', description: 'Posterior chain pull', muscle_groups: ['Hamstrings','Glutes','Lower Back','Traps'], equipment: ['Barbell'], instructions: 'Hinge; brace; stand tall with bar.' }
  ]

  for (const ex of minimalExercises) {
    const { error } = await supabase
      .from('exercises')
      .upsert(ex, { onConflict: 'id' })
    if (error) throw error
  }

  // Optional categories baseline if table exists
  try {
    const { error: catProbe } = await supabase
      .from('exercise_categories')
      .select('id')
      .limit(1)
    if (!catProbe) {
      const categories = ['Strength', 'Hypertrophy', 'Mobility']
      for (const name of categories) {
        const { error } = await supabase
          .from('exercise_categories')
          .upsert({ name }, { onConflict: 'name' })
        if (error) throw error
      }
    }
  } catch (e: any) {
    if (e?.code === 'PGRST116') {
      console.warn('exercise_categories table not found; skipping categories seed.')
    } else {
      // Non-fatal
      console.warn('Skipping categories seed due to error:', e?.message || e)
    }
  }

  console.log('Reference data seeded')
}

async function main() {
  console.log('Seeding database...')
  const adminId = await ensureAdminUser()
  await ensureAdminProfile(adminId)
  await seedReferenceData()
  console.log('Seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


