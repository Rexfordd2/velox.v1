import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.SPEC_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: '.',
  testMatch: [
    'apps/web/e2e/**/*.ts',
  ],
  reporter: [
    ['list'],
    ['html', { outputFolder: 'spec-report/html', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    // Admin/web app on 3001 for CRUD flows
    {
      command: 'cd apps/web && npx cross-env PLAYWRIGHT_E2E=1 PORT=3001 npm run start:prod',
      url: 'http://localhost:3001',
      // Increase timeout for CI cold starts and production build
      timeout: 600_000,
      reuseExistingServer: true,
    },
  ],
  retries: 1,
});


