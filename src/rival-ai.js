import { bfs } from './maze.js';
export const RIVALS = {
  Rubble: { aggression: 0.6 },
  Goldie: { aggression: 0.45 },
  Vex: { aggression: 0.85 },
  Moss: { aggression: 0.35 },
};
export function nextRivalMove(grid, position, goal, name = 'Rubble', random = Math.random) {
  const path = bfs(grid, position, goal);
  return path[1] && random() < RIVALS[name].aggression ? path[1] : position;
}
