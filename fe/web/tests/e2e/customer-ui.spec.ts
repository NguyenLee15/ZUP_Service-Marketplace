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
    await expect(page.getByRole('heading', { name: /dịch vụ gia đình/i })).toBeVisible();
    await expect(page.locator('#hero-search-form')).toBeVisible();
    await expect(page.locator('#chat-widget-btn')).toBeVisible();
    await expect(page.getByText(/chào bạn/i)).toHaveCount(0);
    await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow-x', 'hidden');
  });

  test('home hero keeps heading and search in the desktop viewport', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop evidence only');
    await page.goto('/');

    const heading = page.getByRole('heading', { name: /dịch vụ gia đình/i });
    const search = page.locator('#hero-search-form');
    await expect(heading).toBeVisible();
    await expect(search).toBeVisible();

    const [headingBox, searchBox] = await Promise.all([heading.boundingBox(), search.boundingBox()]);
    expect(headingBox?.y).toBeLessThan(650);
    expect(searchBox?.y).toBeLessThan(650);
    await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  });
});
