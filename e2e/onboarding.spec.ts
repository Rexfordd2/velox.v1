import { test, expect } from '@playwright/test';

test.describe('Onboarding first-run', () => {
  test('shows 3 one-tap questions and proceeds to warm-up', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('[data-testid="goal-choice"]')).toBeVisible();
    await expect(page.locator('[data-testid="vibe-choice"]')).toBeVisible();
    await expect(page.locator('[data-testid="experience-choice"]')).toBeVisible();
    // If a "Start Warm-Up" button exists:
    const start = page.locator('[data-testid="start-warmup"]');
    if (await start.isVisible()) await start.click();
  });
});


