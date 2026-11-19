import { expect, test } from '@playwright/test';

test('loads the v9 game and starts a run', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Maze Miner Race v9/);
  await expect(page.locator('#board')).toBeVisible();
  await page.locator('#playBtn').click();
  await expect(page.locator('#feed')).toContainText('Pos');
  await expect(page.locator('#serverStatus')).toContainText('Not connected');
});

test('pause and resume work', async ({ page }) => {
  await page.goto('/');
  await page.locator('#playBtn').click();
  await page.locator('#pauseBtn').click();
  await expect(page.locator('#pauseBtn')).toContainText('Resume');
  await page.locator('#pauseBtn').click();
  await expect(page.locator('#pauseBtn')).toContainText('Pause');
});

test('Arabic switches the document to RTL and translates primary controls', async ({ page }) => {
  await page.goto('/');
  await page.selectOption('#lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#playBtn')).toContainText('العب');
  await expect(page.locator('#lScore')).toHaveText('النقاط');
});
