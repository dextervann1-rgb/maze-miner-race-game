import './style.css';
import { genMaze } from './maze.js';
import { resetRunState } from './game-state.js';
import { renderBoard } from './renderer.js';
import { bindInput, bindDpad } from './input.js';
import { I18N, applyLanguage } from './i18n.js';
import { track } from './telemetry.js';

const $ = (id) => document.getElementById(id),
  board = $('board');
let state = resetRunState(),
  grid = genMaze(state.seed),
  goal = [grid[0].length - 2, grid.length - 2],
  targetTimer;
function setFeed(text) {
  $('feed').textContent = text;
}
function paint() {
  renderBoard(board, grid, state.player, goal);
  $('state').textContent = state.status;
  $('timer').textContent = state.timer;
  $('score').textContent = state.score;
}
function start() {
  state = resetRunState();
  state.status = 'PLAYING';
  grid = genMaze(state.seed);
  goal = [grid[0].length - 2, grid.length - 2];
  setFeed('Reach the flag. Mine adjacent blocks with Space.');
  track('run_start', { seed: state.seed });
  paint();
}
function move(dx, dy) {
  if (state.status !== 'PLAYING' || state.paused) return;
  const [x, y] = state.player,
    nx = x + dx,
    ny = y + dy;
  if (nx < 0 || ny < 0 || ny >= grid.length || nx >= grid[0].length) return;
  if (grid[ny][nx]) {
    state.target = [nx, ny];
    state.score += 1;
    setFeed('Mining target selected. Press Space.');
  } else {
    state.player = [nx, ny];
    state.score += 2;
    if (nx === goal[0] && ny === goal[1]) {
      state.status = 'WON';
      clearInterval(targetTimer);
      setFeed('🏆 Finished!');
      track('run_win', { score: state.score });
    }
  }
  paint();
}
function mine() {
  if (state.status !== 'PLAYING' || !state.target) {
    setFeed('Move next to a wall first.');
    return;
  }
  const [x, y] = state.target;
  grid[y][x] = 0;
  state.target = null;
  state.score += 10;
  setFeed('Block mined!');
  paint();
}
function pause() {
  if (!['PLAYING', 'PAUSED'].includes(state.status)) return;
  state.paused = state.status === 'PLAYING';
  state.status = state.paused ? 'PAUSED' : 'PLAYING';
  setFeed(state.paused ? 'Paused' : 'Resumed');
  paint();
}
$('start').onclick = start;
$('pause').onclick = pause;
bindInput({ move, mine, pause });
bindDpad(document, { move, mine });
$('lang').onchange = (e) => {
  const d = I18N[e.target.value] || I18N.en;
  $('start').textContent = d.play;
  $('pause').textContent = d.pause;
  document.querySelector('[data-mine]')?.replaceChildren(d.mine);
  applyLanguage(e.target.value);
};
targetTimer = setInterval(() => {
  if (state.status === 'PLAYING' && !state.paused) {
    state.timer--;
    if (state.timer <= 0) {
      state.status = 'LOST';
      setFeed('Time expired.');
    }
    paint();
  }
}, 1000);
paint();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.__MMR_TEST__ = { start, move, mine, pause, getState: () => state };
