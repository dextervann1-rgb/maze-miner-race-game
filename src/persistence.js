const KEY = 'mmr_v4_progress';
export function loadProgress(storage = globalThis.localStorage) { try { return JSON.parse(storage.getItem(KEY) || '{}'); } catch { return {}; } }
export function saveProgress(progress, storage = globalThis.localStorage) { storage.setItem(KEY, JSON.stringify(progress)); return progress; }
