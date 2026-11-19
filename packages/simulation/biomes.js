// packages/simulation/biomes.js — CANONICAL biome rules. Single source of truth. v10.0.0
export const BIOMES = {
  Desert:{vision:-1, staminaPerTick:-0.5, desc:'Desert — vision -1, stamina drains'},
  Ice:{vision:0, staminaPerTick:0.5, slideChance:0.18, desc:'Ice — slippery slide, stamina regens'},
  Volcano:{vision:0, staminaPerTick:-0.4, shieldBlocks:true, desc:'Volcano — heat drains unless Shield'},
  Cavern:{vision:-1, staminaPerTick:0, gemMultiplier:2, desc:'Cavern — gems worth double, vision -1'},
  Ruins:{vision:0, staminaPerTick:0, trapDamage:12, trapCount:5, desc:'Ruins — hidden traps -12 stamina'},
};
export function biomeForSeed(seed){ const names=Object.keys(BIOMES); let h=0; for(let c of seed) h=(h*31+c.charCodeAt(0))>>>0; return names[h%names.length]; }
