// tests/e2e.spec.mjs — live server, verified replay, mobile, accessibility, and tamper checks
import { test, expect, devices } from '@playwright/test';
import { genMaze } from '../packages/simulation/maze.js';
import { simulateRun } from '../packages/simulation/replay.js';

function openPath(seed, tickOffset = 1) {
  const g = genMaze(seed);
  const queue = [[1, 1]];
  const previous = new Map([['1,1', null]]);
  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx > 20 || ny > 20 || g.maze[ny][nx] !== 0 || previous.has(key)) continue;
      previous.set(key, [x, y]);
      queue.push([nx, ny]);
    }
  }
  const cells = [];
  let current = [19, 19];
  while (current) {
    cells.unshift(current);
    current = previous.get(`${current[0]},${current[1]}`);
  }
  return cells.slice(1).map((cell, index) => ({
    t: 'move', dx: cell[0] - cells[index][0], dy: cell[1] - cells[index][1], tick: index + tickOffset,
  }));
}

test('live server serves game and accessible shell', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await expect(page.locator('#board')).toBeVisible();
  await expect(page.locator('#liveRegion')).toHaveCount(1);
});

test('live server verifies a legal replay', async ({ request }) => {
  const session = await (await request.post('http://localhost:3001/api/session')).json();
  const actions = openPath(session.seed, 1 + (Date.now() % 200));
  const simulation = simulateRun(session.seed, 'normal', 'Normal', 'Desert', actions, 60, 0);
  const response = await request.post('http://localhost:3001/api/run', { data: {
    sessionId: session.sessionId, token: session.token, seed: session.seed, version: '10.0.0',
    difficulty: 'normal', modifier: 'Normal', biome: 'Desert', actions, ticks: 60,
    clientScore: simulation.serverScore,
  } });
  await expect(response).toBeOK();
  const result = await response.json();
  expect(result).toMatchObject({ verified: true, serverScore: simulation.serverScore });
});

test('mobile viewport', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 14'] });
  const page = await context.newPage();
  await page.goto('http://localhost:3001/');
  await expect(page.locator('#board')).toBeVisible();
  await context.close();
});

test('escape closes tutorial', async ({ page }) => {
  await page.goto('http://localhost:3001/');
  await page.click('#tutorialBtn');
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal')).toBeHidden();
});

test('tamper: bad HMAC rejected', async ({ request }) => {
  const response = await request.post('http://localhost:3001/api/run', { data: {
    sessionId: 'fake', token: 'bad', seed: '2026-11-18', version: '10.0.0', difficulty: 'normal',
    modifier: 'Normal', biome: 'Desert', actions: [], ticks: 10, clientScore: 999,
  } });
  expect((await response.json()).ok).toBe(false);
});
