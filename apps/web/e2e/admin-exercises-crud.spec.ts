import { test, expect } from '../../../e2e/fixtures/auth';

test.describe('Admin Exercises CRUD', () => {
  test.beforeEach(async ({ loginAsAdmin }) => {
    await loginAsAdmin();
  });

  test('create, list, edit, and delete an exercise', async ({ page }) => {
    await page.goto('/admin/exercises');

    // Create
    await page.getByRole('button', { name: /new exercise/i }).click();
    const unique = Math.random().toString(36).slice(2, 8);
    const name = `E2E Test Exercise ${unique}`;
    const slug = `e2e-ex-${unique}`;
    await page.getByLabel('Name').fill(name);
    await page.getByLabel('Slug').fill(slug);
    await page.getByLabel('Description').fill('E2E description');
    await page.getByLabel('Difficulty').selectOption('beginner');
    await page.getByLabel('Primary Muscle').selectOption('legs');

    const catFirst = page.locator('label.chip input[type="checkbox"]').first();
    if (await catFirst.isVisible().catch(() => false)) {
      await catFirst.check().catch(() => {});
    }

    await page.getByRole('button', { name: /^create$/i }).click();

    await expect(page.getByRole('row', { name: new RegExp(`${name}\\s+${slug}`, 'i') })).toBeVisible();

    const editButton = page.getByRole('row', { name: new RegExp(`${name}\\s+${slug}`, 'i') }).getByRole('button', { name: /edit/i });
    await editButton.click();
    await page.getByLabel('Description').fill('E2E updated');
    await page.getByRole('button', { name: /^update$/i }).click();

    const deleteButton = page.getByRole('row', { name: new RegExp(`${name}\\s+${slug}`, 'i') }).getByRole('button', { name: /delete/i });
    await deleteButton.click();

    await page.reload();
    await expect(page.getByRole('row', { name: new RegExp(`${name}\\s+${slug}`, 'i') })).toHaveCount(0);
  });
});


