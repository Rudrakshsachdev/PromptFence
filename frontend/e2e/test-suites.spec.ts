import { test, expect } from '@playwright/test';

test.describe('Test Suites E2E Flow', () => {
  test('unauthenticated user is redirected from test suites', async ({ page }) => {
    await page.goto('/test-suites');
    await expect(page).toHaveURL(/.*login/);
  });
});

