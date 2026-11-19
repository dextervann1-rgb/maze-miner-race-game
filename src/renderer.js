export function renderBoard({ element, grid, position }) {
  if (!element) return;
  element.style.gridTemplateColumns = `repeat(${grid[0].length}, 1fr)`;
  element.replaceChildren();
  grid.forEach((row, y) => row.forEach((cell, x) => {
    const node = document.createElement('div');
    node.className = `cell ${cell ? 'wall' : 'path'}`;
    if (x === position[0] && y === position[1]) { node.className = 'cell player'; node.textContent = '⛏️'; }
    element.appendChild(node);
  }));
}
