import { test, expect } from '@playwright/test';
test('loads the game and starts a run', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Maze Miner Race v5/);
  await expect(page.locator('#board')).toBeVisible();
  await page.locator('#start').click();
  await expect(page.locator('#state')).toHaveText('PLAYING');
});
test('pause works', async ({ page }) => {
  await page.goto('/');
  await page.locator('#start').click();
  await page.locator('#pause').click();
  await expect(page.locator('#state')).toHaveText('PAUSED');
});
test('language selector changes document direction', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
