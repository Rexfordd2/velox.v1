import { test, expect } from '@playwright/test';

test('leaderboards page loads with filters', async ({ page }) => {
  await page.goto('/leaderboards');
  await expect(page.locator('[data-testid="filter-age"]')).toBeVisible();
  await expect(page.locator('[data-testid="filter-weight"]')).toBeVisible();
  await expect(page.locator('[data-testid="filter-region"]')).toBeVisible();
});


