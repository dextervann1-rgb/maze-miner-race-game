import { describe, expect, it } from 'vitest';
import { generateMaze, shortestPath } from '../src/maze.js';

describe('seeded maze', () => {
  it('is deterministic', () => expect(generateMaze('2026-11-18')).toEqual(generateMaze('2026-11-18')));
  it('has a route to the finish', () => expect(shortestPath(generateMaze('2026-11-18'), [1, 1], [19, 19]).length).toBeGreaterThan(0));
});
