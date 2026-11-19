export const ACHIEVEMENTS = {
  firstWin: 'First Win',
  speedRun: 'Speed Runner',
  gemHunter: 'Gem Hunter',
};
export function unlock(progress, id) {
  return { ...progress, achievements: { ...(progress.achievements || {}), [id]: true } };
}
