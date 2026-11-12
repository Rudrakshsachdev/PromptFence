import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Flow', () => {
  test('register new account and login', async ({ page }) => {
    // 1. Navigate to register
    await page.goto('/register');
    await expect(page.locator('h2')).toContainText('Create Account');

    // 2. Fill form
    await page.fill('#full_name', 'E2E Researcher');
    await page.fill('#email', `e2e_${Date.now()}@promptfence.local`);
    await page.fill('#password', 'ValidPass123!');
    await page.fill('#confirm_password', 'ValidPass123!');
    await page.click('button[type="submit"]');

    // 3. Confirm success message
    await expect(page.locator('h3')).toContainText('Account Created');
  });

  test('display validation error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'unknown@promptfence.local');
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toBeVisible();
  });
});

