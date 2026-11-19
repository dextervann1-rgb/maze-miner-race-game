export function bindInput({ onMove, onMine, onPause }) {
  const handler = event => {
    const moves = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    if (moves[event.code]) { event.preventDefault(); onMove?.(...moves[event.code]); }
    if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); onMine?.(); }
    if (event.code === 'Escape') onPause?.();
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
