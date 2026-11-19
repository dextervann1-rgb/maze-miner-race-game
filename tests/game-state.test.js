import { describe, expect, it } from 'vitest';
import { resetRunState, migrateSave } from '../src/game-state.js';
describe('game state', () => {
  it('resets hard mode', () => expect(resetRunState('x', 'hard').timer).toBe(90));
  it('migrates saves', () => expect(migrateSave({ gems: 4 }).version).toBe(2));
});
