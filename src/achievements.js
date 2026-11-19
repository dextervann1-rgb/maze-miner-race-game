export const ACHIEVEMENTS = { firstWin: 'Finish a run', gemHunter: 'Collect 10 gems', combo5: 'Reach combo 5', streak3: 'Win 3 days' };
export function unlockAchievement(progress, id) { if (!ACHIEVEMENTS[id]) return progress; return { ...progress, achievements: { ...(progress.achievements || {}), [id]: true } }; }
