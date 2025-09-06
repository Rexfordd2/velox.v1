import { test, expect } from '@playwright/test';

test.describe('Lift-to-the-Beat MVP smoke', () => {
  test('page renders, source picker visible, BPM or metronome present', async ({ page }) => {
    await page.goto('/modes/LiftToBeat');
    // Basic elements (adjust selectors to your components)
    const source = page.locator('[data-testid="source-picker"]');
    const bpm = page.locator('[data-testid="bpm-display"], [data-testid="metronome"]');
    await expect(source).toBeVisible();
    await expect(bpm).toBeVisible();
  });
});


