export function bindInput({ move, mine, pause }) {
  const key = (e) => {
    const m = {
      ArrowUp: [0, -1],
      KeyW: [0, -1],
      ArrowDown: [0, 1],
      KeyS: [0, 1],
      ArrowLeft: [-1, 0],
      KeyA: [-1, 0],
      ArrowRight: [1, 0],
      KeyD: [1, 0],
    };
    if (m[e.code]) {
      e.preventDefault();
      move(...m[e.code]);
    }
    if (e.code === 'Space' || e.code === 'Enter') mine();
    if (e.code === 'Escape') pause();
  };
  addEventListener('keydown', key);
  return () => removeEventListener('keydown', key);
}
export function bindDpad(root, { move, mine }) {
  root
    .querySelectorAll('[data-move]')
    .forEach((b) => (b.onclick = () => move(...b.dataset.move.split(',').map(Number))));
  root.querySelector('[data-mine]').onclick = mine;
}
