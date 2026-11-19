// packages/simulation/scoring.js — CANONICAL scoring. v11.0.0
export const BLOCK_COST={dirt:5,stone:8,iron:12,crystal:16,gamble:8};
export const BLOCK_HP={dirt:1,stone:2,iron:3,crystal:4,gamble:2};
export function timeBonus(ticks){ return Math.max(0,(200-ticks))*2; }
export function gemGain(biome,modifier){ let g=biome==='Cavern'?30:15; if(modifier==='Double Gems') g*=2; return g; }
