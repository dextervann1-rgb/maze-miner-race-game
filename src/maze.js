export function hashSeed(value) {
  let h = 2166136261;
  for (const c of value) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function seededRng(seed) {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function genMaze(seed, w = 11, h = 11) {
  const r = seededRng(seed),
    g = Array.from({ length: h }, () => Array(w).fill(1)),
    stack = [[1, 1]];
  g[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack.at(-1),
      o = [
        [2, 0],
        [-2, 0],
        [0, 2],
        [0, -2],
      ].filter(
        ([dx, dy]) =>
          x + dx > 0 && y + dy > 0 && x + dx < w - 1 && y + dy < h - 1 && g[y + dy][x + dx],
      );
    if (!o.length) {
      stack.pop();
      continue;
    }
    const [dx, dy] = o[Math.floor(r() * o.length)],
      nx = x + dx,
      ny = y + dy;
    g[y + dy / 2][x + dx / 2] = 0;
    g[ny][nx] = 0;
    stack.push([nx, ny]);
  }
  g[h - 2][w - 2] = 0;
  return g;
}
export function bfs(grid, start, goal) {
  const q = [start],
    prev = new Map([[start.join(','), null]]);
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (x === goal[0] && y === goal[1]) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = `${nx},${ny}`;
      if (
        nx < 0 ||
        ny < 0 ||
        ny >= grid.length ||
        nx >= grid[0].length ||
        grid[ny][nx] ||
        prev.has(k)
      )
        continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
  }
  const out = [],
    end = goal.join(',');
  if (!prev.has(end)) return out;
  let c = goal;
  while (c) {
    out.unshift(c);
    c = prev.get(c.join(','));
  }
  return out;
}
