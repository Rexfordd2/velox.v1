import { test as base, expect } from '@playwright/test';

type AuthFixtures = {
  loginAsAdmin: () => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  loginAsAdmin: async ({ page }, use) => {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/');
    await use(async () => {});
  },
});

export { expect };


