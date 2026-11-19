import { describe, expect, it } from 'vitest';
import { genMaze, bfs } from '../src/maze.js';
describe('maze', () => {
  it('is deterministic', () => expect(genMaze('same')).toEqual(genMaze('same')));
  it('has a route', () => expect(bfs(genMaze('same'), [1, 1], [9, 9]).length).toBeGreaterThan(0));
});
