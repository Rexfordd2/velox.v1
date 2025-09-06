import { test, expect } from '@playwright/test';

test.describe('Route + Selector Sanity', () => {
  test('onboarding selectors', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.locator('[data-testid="goal-choice"]')).toBeVisible();
    await expect(page.locator('[data-testid="vibe-choice"]')).toBeVisible();
    await expect(page.locator('[data-testid="experience-choice"]')).toBeVisible();
    // optional warmup
    // visibility not strictly required
  });

  test('privacy selectors', async ({ page }) => {
    await page.goto('/settings/privacy');
    await expect(page.locator('[data-testid="toggle-private"]')).toBeVisible();
    await expect(page.locator('[data-testid="toggle-cloud-video"]')).toBeVisible();
  });

  test('LiftToBeat selectors', async ({ page }) => {
    await page.goto('/modes/LiftToBeat');
    await expect(page.locator('[data-testid="source-picker"]')).toBeVisible();
    const bpmDisplay = page.locator('[data-testid="bpm-display"], [data-testid="metronome"]');
    await expect(bpmDisplay).toBeVisible();
  });

  test('leaderboards filters', async ({ page }) => {
    await page.goto('/leaderboards');
    await expect(page.locator('[data-testid="filter-age"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-weight"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-region"]')).toBeVisible();
  });

  test('debug status metrics appear and update', async ({ page }) => {
    await page.goto('/debug/status');
    const fps = page.locator('[data-testid="metric-fps"]');
    const inf = page.locator('[data-testid="metric-inference-ms"]');
    const drop = page.locator('[data-testid="metric-dropped-frames"]');
    const q = page.locator('[data-testid="metric-upload-queue"]');
    const conf = page.locator('[data-testid="metric-pose-confidence"]');

    // SSR placeholders: expect "--" initially; allow either -- or numeric after hydration
    await expect(fps).toHaveText(/--|\d+(\.\d+)?/, { timeout: 3000 });
    await expect(inf).toHaveText(/--|\d+(\.\d+)?/, { timeout: 3000 });
    await expect(drop).toHaveText(/--|\d+(\.\d+)?/, { timeout: 3000 });
    await expect(q).toHaveText(/--|\d+(\.\d+)?/, { timeout: 3000 });
    await expect(conf).toHaveText(/--|\d+(\.\d+)?/, { timeout: 3000 });

    // Wait for live updates from ObsProvider (1s tick)
    await page.waitForTimeout(1200);
    await expect(fps).toHaveText(/\d/);
    await expect(inf).toHaveText(/\d/);
    await expect(conf).toHaveText(/\d/);

    // Manual mock tick via page context
    await page.evaluate(() => {
      // dynamic import if not global
      // @ts-ignore
      if (typeof window.mockObsTick !== 'function') {
        return import('/_next/static/chunks/pages/debug/status/page.js').catch(() => null);
      }
      return null;
    });

    // Try to call the global function exposed by frontend lib
    await page.evaluate(() => {
      // @ts-ignore
      const fn = (window as any).mockObsTick || (globalThis as any).mockObsTick;
      if (typeof fn === 'function') {
        fn({ fps: 99, inferenceMs: 9, poseConfidence: 0.99 });
        return true;
      }
      // fallback: dispatch event expected by the page
      try {
        window.dispatchEvent(new CustomEvent('velox:obs:update'));
      } catch {}
      return false;
    });
    await page.waitForTimeout(600);
    await expect(fps).toHaveText(/99|9\d/);
    await expect(inf).toHaveText(/9(\.\d+)?/);
    await expect(conf).toHaveText(/0\.9\d/);

    await page.screenshot({ path: 'spec-report/debug-status.png', fullPage: true });
  });
});


