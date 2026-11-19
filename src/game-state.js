import { seededRng } from './maze.js';
export function resetRunState(seed = new Date().toISOString().slice(0, 10), difficulty = 'normal') {
  return {
    seed,
    difficulty,
    rng: seededRng(seed),
    status: 'READY',
    timer: difficulty === 'hard' ? 90 : difficulty === 'easy' ? 180 : 120,
    score: 0,
    player: [1, 1],
    target: null,
    paused: false,
  };
}
export function migrateSave(value = {}) {
  return {
    version: 2,
    gems: Number(value.gems) || 0,
    streak: Number(value.streak) || 0,
    achievements: value.achievements || {},
  };
}
