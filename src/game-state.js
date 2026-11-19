import { hashSeed, mulberry32 } from './maze.js';

export function createRunState({ seed, difficulty = 'normal', practice = false } = {}) {
  const timer = difficulty === 'easy' ? 260 : difficulty === 'hard' ? 150 : 200;
  return {
    seed,
    rng: mulberry32(hashSeed(seed)),
    difficulty,
    practice,
    state: 'READY',
    timer,
    score: 0,
    gems: 0,
    stamina: 100,
    position: [1, 1],
    target: null,
    power: { type: null, until: 0, charges: 0 },
    combo: 0,
    blocksBroken: 0,
    gemsCollected: 0,
    paused: false,
  };
}

export function resetRunState(state, options = {}) {
  return Object.assign(state, createRunState({ seed: options.seed ?? state.seed, difficulty: options.difficulty ?? state.difficulty, practice: options.practice ?? state.practice }));
}
