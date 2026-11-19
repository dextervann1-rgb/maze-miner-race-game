export function renderBoard(el, grid, player, goal) {
  el.replaceChildren();
  el.style.gridTemplateColumns = `repeat(${grid[0].length},36px)`;
  grid.forEach((row, y) =>
    row.forEach((cell, x) => {
      const n = document.createElement('div');
      n.className = `cell ${cell ? 'wall' : 'path'}`;
      n.setAttribute('role', 'gridcell');
      if (x === goal[0] && y === goal[1]) {
        n.className = 'cell finish';
        n.textContent = '🏁';
      }
      if (x === player[0] && y === player[1]) {
        n.className = 'cell player';
        n.textContent = '⛏️';
      }
      el.append(n);
    }),
  );
}
