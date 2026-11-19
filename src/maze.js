export function hashSeed(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateMaze(seed, width = 21, height = 21) {
  const random = mulberry32(hashSeed(seed));
  const grid = Array.from({ length: height }, () => Array(width).fill(1));
  const stack = [[1, 1]];
  grid[1][1] = 0;
  const directions = [[2, 0], [-2, 0], [0, 2], [0, -2]];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = directions.filter(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx > 0 && ny > 0 && nx < width - 1 && ny < height - 1 && grid[ny][nx] === 1;
    });
    if (!options.length) { stack.pop(); continue; }
    const [dx, dy] = options[Math.floor(random() * options.length)];
    const nx = x + dx, ny = y + dy;
    grid[y + dy / 2][x + dx / 2] = 0;
    grid[ny][nx] = 0;
    stack.push([nx, ny]);
  }
  grid[height - 2][width - 2] = 0;
  grid[height - 2][width - 3] = 0;
  grid[height - 3][width - 2] = 0;
  return grid;
}

export function shortestPath(grid, start, goal) {
  const height = grid.length, width = grid[0].length;
  const queue = [start], previous = new Map([[start.join(','), null]]);
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index];
    if (x === goal[0] && y === goal[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height || grid[ny][nx] || previous.has(key)) continue;
      previous.set(key, [x, y]);
      queue.push([nx, ny]);
    }
  }
  const path = [], goalKey = goal.join(',');
  if (!previous.has(goalKey)) return path;
  let cursor = goal;
  while (cursor) { path.unshift(cursor); cursor = previous.get(cursor.join(',')); }
  return path;
}
