// packages/simulation/types.d.ts — v10.0.0 — Replay protocol types
export type Biome = 'Desert'|'Ice'|'Volcano'|'Cavern'|'Ruins';
export type Difficulty = 'easy'|'normal'|'hard';
export type Powerup = 'pick'|'speed'|'lantern'|'shield'|'sonar'|'clock';
export type ReplayAction =
  | { t:'move'; dx:-1|0|1; dy:-1|0|1; tick:number }
  | { t:'mine'; x:number; y:number; tick:number };
export interface RunSubmission { sessionId:string; token:string; seed:string; version:'10.0.0'; difficulty:Difficulty; modifier:string; biome:Biome; actions:ReplayAction[]; ticks:number; clientScore:number; }
export interface VerifyResult { ok:boolean; verified?:boolean; serverScore?:number; rank?:number; fingerprint?:string; reason?:string; }
export interface LeaderboardRecord { fingerprint:string; seed:string; serverScore:number; time:number; difficulty:Difficulty; createdAt:number; season:string; }
