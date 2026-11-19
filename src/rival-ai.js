import { shortestPath } from './maze.js';

export const RIVAL_PERSONALITIES = {
  rubble: { name: 'Rubble', aggression: 0.6, mood: '😤' },
  goldie: { name: 'Goldie', aggression: 0.45, mood: '💎' },
  vex: { name: 'Vex', aggression: 0.85, mood: '😈' },
};

export function createRival(type = 'rubble') {
  const profile = RIVAL_PERSONALITIES[type] ?? RIVAL_PERSONALITIES.rubble;
  return { ...profile, type, position: [1, 2], taunt: 0 };
}

export function nextRivalMove(grid, rival, goal, random = Math.random) {
  const path = shortestPath(grid, rival.position, goal);
  if (!path[1] || random() > rival.aggression) return rival.position;
  return path[1];
}
