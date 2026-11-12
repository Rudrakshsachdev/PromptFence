import { test, expect } from '@playwright/test';

test.describe('Navigation and Protected Routes', () => {
  test('redirect unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/overview');
    await expect(page).toHaveURL(/.*login/);

    await page.goto('/profile');
    await expect(page).toHaveURL(/.*login/);

    await page.goto('/scenarios');
    await expect(page).toHaveURL(/.*login/);
  });
});

