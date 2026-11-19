import { describe, expect, it } from 'vitest';
import { loadSave, saveReceipt } from '../src/persistence.js';
describe('persistence', () => {
  it('stores only local demo data', () => {
    const m = new Map();
    const s = { getItem: (k) => m.get(k) || null, setItem: (k, v) => m.set(k, v) };
    saveReceipt({ score: 10 }, s);
    expect(loadSave(s)).toEqual({});
  });
});
