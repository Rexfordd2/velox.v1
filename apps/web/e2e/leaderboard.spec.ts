import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../packages/core/types/database';

// Test users (should be configured in your test environment)
const TEST_USER_A = {
  email: 'test.user.a@example.com',
  password: 'test123!',
  id: '', // Will be set during login
};

const TEST_USER_B = {
  email: 'test.user.b@example.com',
  password: 'test123!',
  id: '', // Will be set during login
};

const SQUAT_MOVEMENT_ID = 'movement-id-for-squat'; // Replace with actual ID from your test DB

test.describe('Leaderboard Tests', () => {
  let supabase: ReturnType<typeof createClient<Database>>;

  test.beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  });

  test.beforeEach(async ({ page }) => {
    // Clean up existing test data
    await supabase
      .from('vbt_sets')
      .delete()
      .in('user_id', [TEST_USER_A.id, TEST_USER_B.id]);
  });

  async function loginUser(page: any, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for login to complete
    await page.waitForURL('/dashboard');

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }

  async function createWorkoutSet(userId: string, velocity: number) {
    // Create a workout first
    const { data: workout } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        title: 'Test Workout',
      })
      .select()
      .single();

    // Create workout set
    const { data: workoutSet } = await supabase
      .from('workout_sets')
      .insert({
        workout_id: workout!.id,
        movement_id: SQUAT_MOVEMENT_ID,
        set_number: 1,
      })
      .select()
      .single();

    // Create VBT set with velocity
    await supabase
      .from('vbt_sets')
      .insert({
        workout_set_id: workoutSet!.id,
        user_id: userId,
        peak_velocity: velocity,
      });
  }

  test('should rank User A above User B when score is higher', async ({ page }) => {
    // Login as User A and store ID
    TEST_USER_A.id = await loginUser(page, TEST_USER_A.email, TEST_USER_A.password);
    
    // Create test data - User A has higher velocity
    await createWorkoutSet(TEST_USER_A.id, 2.5); // Higher score
    
    // Login as User B and store ID
    const context = await page.context().newPage();
    TEST_USER_B.id = await loginUser(context, TEST_USER_B.email, TEST_USER_B.password);
    await createWorkoutSet(TEST_USER_B.id, 2.0); // Lower score
    await context.close();

    // Navigate to leaderboard
    await page.goto('/leaderboard/squat');
    
    // Wait for leaderboard to load
    await page.waitForSelector('[data-testid="leaderboard-entry"]');

    // Get all leaderboard entries
    const entries = await page.locator('[data-testid="leaderboard-entry"]').all();
    
    // Get usernames from entries
    const firstPlace = await entries[0].locator('[data-testid="username"]').textContent();
    const secondPlace = await entries[1].locator('[data-testid="username"]').textContent();

    // Verify ranking
    expect(firstPlace).toContain('User A'); // Assuming username contains "User A"
    expect(secondPlace).toContain('User B');
  });

  test('should update rankings when scores change', async ({ page }) => {
    // Similar test but update scores and verify ranks change
    TEST_USER_A.id = await loginUser(page, TEST_USER_A.email, TEST_USER_A.password);
    await createWorkoutSet(TEST_USER_A.id, 2.0);

    const context = await page.context().newPage();
    TEST_USER_B.id = await loginUser(context, TEST_USER_B.email, TEST_USER_B.password);
    await createWorkoutSet(TEST_USER_B.id, 2.5);
    await context.close();

    await page.goto('/leaderboard/squat');
    await page.waitForSelector('[data-testid="leaderboard-entry"]');

    const entries = await page.locator('[data-testid="leaderboard-entry"]').all();
    const firstPlace = await entries[0].locator('[data-testid="username"]').textContent();
    const secondPlace = await entries[1].locator('[data-testid="username"]').textContent();

    expect(firstPlace).toContain('User B');
    expect(secondPlace).toContain('User A');
  });

  test('should handle tied scores correctly', async ({ page }) => {
    // Test equal scores
    TEST_USER_A.id = await loginUser(page, TEST_USER_A.email, TEST_USER_A.password);
    await createWorkoutSet(TEST_USER_A.id, 2.0);

    const context = await page.context().newPage();
    TEST_USER_B.id = await loginUser(context, TEST_USER_B.email, TEST_USER_B.password);
    await createWorkoutSet(TEST_USER_B.id, 2.0);
    await context.close();

    await page.goto('/leaderboard/squat');
    await page.waitForSelector('[data-testid="leaderboard-entry"]');

    const entries = await page.locator('[data-testid="leaderboard-entry"]').all();
    const firstRank = await entries[0].locator('[data-testid="rank"]').textContent();
    const secondRank = await entries[1].locator('[data-testid="rank"]').textContent();

    // Both should have rank 1 for a tie
    expect(firstRank).toBe('1');
    expect(secondRank).toBe('1');
  });
}); 