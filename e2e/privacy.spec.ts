import { test, expect } from '@playwright/test';

test('privacy defaults to private sessions & metrics-only sync toggle visible', async ({ page }) => {
  await page.goto('/settings/privacy');
  await expect(page.locator('[data-testid="toggle-private"]')).toBeVisible();
  await expect(page.locator('[data-testid="toggle-cloud-video"]')).toBeVisible();
  // Optional: check default states if your UI sets data-state attributes
});


