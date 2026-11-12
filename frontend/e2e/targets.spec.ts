import { test, expect } from '@playwright/test';

test.describe('Targets E2E Flow', () => {
  test('unauthenticated user is redirected from targets', async ({ page }) => {
    await page.goto('/targets');
    await expect(page).toHaveURL(/.*login/);
  });
});

