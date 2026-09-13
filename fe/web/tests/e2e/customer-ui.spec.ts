import { expect, test } from '@playwright/test';

test.describe('customer UI smoke coverage', () => {
  test('login exposes accessible form and demo account entry point', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Mật khẩu' })).toBeVisible();
    await expect(page.getByRole('button', { name: /demo accounts/i })).toBeVisible();
    await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
  });

  test('home stays usable on mobile and supports keyboard focus', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main#main-content')).toBeVisible();
    await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow-x', 'hidden');
  });
});
