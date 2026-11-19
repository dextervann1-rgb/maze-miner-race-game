import { describe, expect, it } from 'vitest';
import { createRunState, resetRunState } from '../src/game-state.js';
import { createRival } from '../src/rival-ai.js';

describe('run state', () => {
  it('creates a clean normal run', () => {
    const state = createRunState({ seed: 'test' });
    expect(state.timer).toBe(200);
    expect(state.stamina).toBe(100);
    expect(state.state).toBe('READY');
  });
  it('resets state for hard mode', () => {
    const state = createRunState({ seed: 'test' });
    state.score = 99;
    resetRunState(state, { difficulty: 'hard' });
    expect(state.timer).toBe(150);
    expect(state.score).toBe(0);
  });
  it('creates a named rival', () => expect(createRival('vex').name).toBe('Vex'));
});
