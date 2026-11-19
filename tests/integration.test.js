import { expect, it } from 'vitest';
import { genMaze } from '../src/maze.js';
it('generates a playable board', () => expect(genMaze('integration')).toHaveLength(11));
