// packages/simulation/replay.js — CANONICAL deterministic replay. v10.0.0
// Browser AND Node import this exact file. Client validateRunLocal() and server validateRun() both call simulateRun() here.
// Covers: timer + Speed half-speed, powerups, gamble, crystal key, explosive/ice/lava/locked, hidden, traps, Ice slide, Cavern gems, stamina, combo, time bonus.
import {hash,mulberry,genMaze} from './maze.js';
import {BIOMES} from './biomes.js';
import {BLOCK_COST,timeBonus,gemGain} from './scoring.js';
export function simulateRun(seed,diff,mod,biome,actions,ticks,clientScore){
  const g=genMaze(seed); const rng=mulberry(hash(seed+'|gameplay|'+diff+'|'+mod));
  let px=1,py=1,stamina=100,score=0,combo=0,timer=diff==='easy'?260:diff==='hard'?150:200,lastTick=0,power=null,powerUntilTick=-1,hasKey=false;
  let blocks=JSON.parse(JSON.stringify(g.blocks)), gems={...g.gems}, powers={...g.powers};
  const hp={}; for(let k in blocks) hp[k]=blocks[k].hp;
  const traps={}; if(biome==='Ruins'){ let tr=mulberry(hash(seed+'|traps')); for(let i=0;i<5;i++){let x=2+Math.floor(tr()*17),y=2+Math.floor(tr()*17); if(g.maze[y][x]==0) traps[x+','+y]=true;} }
  const B=BIOMES[biome]||BIOMES.Desert;
  function applyTick(t){ let drain=1; if(power==='speed' && t%2===0) drain=0; timer-=drain; stamina=Math.max(0,Math.min(100,stamina+(B.staminaPerTick||0))); if(biome==='Volcano'&&power==='shield') stamina=Math.min(100,stamina+0.4); if(power && t>powerUntilTick) power=null; if(timer<=-60) return {ok:false,reason:'timer expired before finish at tick '+t}; return {ok:true}; }
  for(let i=0;i<actions.length;i++){
    const a=actions[i];
    if(typeof a.tick!=='number'||a.tick<lastTick) return {ok:false,reason:'tick backwards at '+i};
    if(a.tick>1000) return {ok:false,reason:'ticks too high'};
    for(let t=lastTick+1;t<=a.tick;t++){ let r=applyTick(t); if(!r.ok) return r; }
    lastTick=a.tick;
    if(a.t==='move'){
      if(Math.abs(a.dx)>1||Math.abs(a.dy)>1||Math.abs(a.dx)+Math.abs(a.dy)!==1) return {ok:false,reason:'invalid move '+i};
      let nx=px+a.dx, ny=py+a.dy; if(nx<0||ny<0||nx>20||ny>20) return {ok:false,reason:'oob '+i};
      if(blocks[nx+','+ny]) return {ok:false,reason:'wall-through '+i+' — includes hidden blocks'};
      px=nx; py=ny; stamina=Math.min(100,stamina+(power==='speed'?1:.5));
      if(biome==='Ice' && rng()<0.18){ let sx=px+a.dx, sy=py+a.dy; if(sx>=0&&sy>=0&&sx<=20&&sy<=20&&!blocks[sx+','+sy]){px=sx;py=sy;} }
      if(traps[px+','+py]) stamina=Math.max(0,stamina-12);
      if(gems[px+','+py]){ delete gems[px+','+py]; score+=gemGain(biome,mod); }
      if(powers[px+','+py]){ power=powers[px+','+py]; delete powers[px+','+py]; powerUntilTick=a.tick+15; if(power==='pick')score+=5; if(power==='clock')timer+=20; }
    } else if(a.t==='mine'){
      if(Math.abs(a.x-px)+Math.abs(a.y-py)!==1) return {ok:false,reason:'mine too far '+i};
      let k=a.x+','+a.y; if(!blocks[k]) return {ok:false,reason:'mine empty '+i};
      if(blocks[k].special==='locked'&&!hasKey) return {ok:false,reason:'locked without key '+i};
      if(stamina<=0) return {ok:false,reason:'0 stamina '+i};
      let cost=BLOCK_COST[blocks[k].kind]; if(power==='pick') cost=Math.ceil(cost/2);
      stamina=Math.max(0,stamina-cost);
      let dmg=power==='pick'?2:1; hp[k]-=dmg; combo++; if(combo>2) score+=combo;
      if(hp[k]<=0){ let b=blocks[k]; delete blocks[k]; score+=20; stamina=Math.min(100,stamina+4);
        if(b.special==='explosive'){ for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ let kk=(a.x+dx)+','+(a.y+dy); if(blocks[kk]){ hp[kk]--; if(hp[kk]<=0) delete blocks[kk]; } } }
        if(b.special==='ice') timer+=5;
        if(b.special==='lava'){ if(power!=='shield') stamina=Math.max(0,stamina-15); }
        if(b.kind==='crystal'&&rng()<.4) hasKey=true;
        if(b.kind==='gamble'){ let r=rng(); if(r<.4)score+=50; else if(r<.7)timer-=10; else score+=10; }
      }
    } else return {ok:false,reason:'unknown action '+i};
  }
  if(px!==19||py!==19) return {ok:false,reason:'did not reach finish'};
  if(typeof ticks!=='number'||ticks<10||ticks>1000) return {ok:false,reason:'elapsed out of range'};
  let serverScore=score+timeBonus(ticks);
  if(clientScore!==serverScore) return {ok:false,reason:'score mismatch client '+clientScore+' vs server '+serverScore,serverScore};
  return {ok:true,serverScore};
}
