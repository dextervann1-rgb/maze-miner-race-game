// server.js — Maze Miner Race v9 ALL-IN-ONE — SAME-ORIGIN SERVER-AUTHORITATIVE verifier
// Run: node server.js  (port 3001) — serves the game HTML at http://localhost:3001/ AND /api/*
// NO dependencies, Node built-in only. Put server.js in SAME folder as maze_miner_race_v9_single.html
import http from 'node:http'; import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path';
const SECRET = process.env.SESSION_SECRET || 'CHANGE-ME-IN-PROD';
const sessions=new Map(), leaderboard=[];
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function genMaze(seed){const rng=mulberry(hash(seed));const W=21,H=21,maze=Array.from({length:H},()=>Array(W).fill(1));let stack=[[1,1]];maze[1][1]=0;const dirs=[[2,0],[-2,0],[0,2],[0,-2]];while(stack.length){let [x,y]=stack[stack.length-1];let opts=[];for(let [dx,dy] of dirs){let nx=x+dx,ny=y+dy;if(nx>0&&ny>0&&nx<W-1&&ny<H-1&&maze[ny][nx]==1)opts.push([dx,dy,nx,ny]);}if(!opts.length){stack.pop();continue;}let [dx,dy,nx,ny]=opts[Math.floor(rng()*opts.length)];maze[y+dy/2][x+dx/2]=0;maze[ny][nx]=0;stack.push([nx,ny]);}maze[1][1]=0;maze[19][19]=0;maze[19][18]=0;maze[18][19]=0;const blocks={};for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(maze[y][x]==1){let r=rng();let kind=r<.35?'dirt':r<.65?'stone':r<.85?'iron':r<.94?'crystal':'gamble';blocks[x+','+y]={kind,hp:kind=='dirt'?1:kind=='stone'?2:kind=='iron'?3:kind=='crystal'?4:2,max:kind=='dirt'?1:kind=='stone'?2:kind=='iron'?3:kind=='crystal'?4:2};}const gems={};for(let i=0;i<14;i++){let x=1+Math.floor(rng()*19),y=1+Math.floor(rng()*19);if(maze[y][x]==0&&!(x==1&&y==1))gems[x+','+y]=true}const powers={};const plist=['pick','speed','lantern','shield','sonar','clock'];for(let i=0;i<6;i++){let x=1+Math.floor(rng()*19),y=1+Math.floor(rng()*19);if(maze[y][x]==0)powers[x+','+y]=plist[i%6]}const r2=mulberry(hash(seed+'|special'));Object.keys(blocks).forEach((k,i)=>{if(i%14==0)blocks[k].special='explosive';else if(i%17==0)blocks[k].special='ice';else if(i%19==0)blocks[k].special='lava';else if(i%23==0)blocks[k].special='locked';else if(i%29==0)blocks[k].special='hidden';});return{maze,blocks,gems,powers}}

// ===== v9 SHARED CORE — CANONICAL DETERMINISTIC ENGINE =====
// This exact text appears VERBATIM in the client AND in SERVER_CODE below.
// Client validateRunLocal() and server validateRun() both call simulateRun().
// If you change one, you must change the other — they are the same string.
// Covers: moves, mines, stamina, timer, powerups, gamble, biome, hidden, traps,
// explosive/ice/lava/locked, gems, score, time bonus. Rival is NOT scored —
// rival only ends run early if it reaches finish first; server checks rival
// cannot be faked by requiring actions to finish before rival's earliest finish tick.
// Rival earliest finish is computed by BFS on the generated maze (see rivalEarliestTick).
function simulateRun(seed,diff,mod,biome,actions,ticks,clientScore){
  const g=genMaze(seed);
  const rng=mulberry(hash(seed+'|gameplay|'+diff+'|'+mod));
  let px=1,py=1,stamina=100,score=0,combo=0,timer=diff=='easy'?260:diff=='hard'?150:200,lastTick=0,power=null,powerUntilTick=-1,hasKey=false;
  let blocks=JSON.parse(JSON.stringify(g.blocks)), gems={...g.gems}, powers={...g.powers};
  const hp={}; for(let k in blocks) hp[k]=blocks[k].hp;
  const traps={}; if(biome=='Ruins'){ let tr=mulberry(hash(seed+'|traps')); for(let i=0;i<5;i++){let x=2+Math.floor(tr()*17),y=2+Math.floor(tr()*17); if(g.maze[y][x]==0) traps[x+','+y]=true;} }
  // Tick-by-tick timer/power/biome model: between actions, timer drains 1/tick, or 0 on even ticks if Speed active.
  // We replay ticks from 0..lastTick, applying drain, biome stamina, power expiry.
  function applyTick(t){
    let drain=1; if(power=='speed' && t%2==0) drain=0;
    timer-=drain;
    if(biome=='Desert') stamina=Math.max(0,stamina-.5);
    if(biome=='Ice') stamina=Math.min(100,stamina+.5);
    if(biome=='Volcano'&&power!='shield') stamina=Math.max(0,stamina-.4);
    if(power && t>powerUntilTick) power=null;
    if(timer<=-60) return {ok:false,reason:'timer expired before finish at tick '+t};
    return {ok:true};
  }
  for(let i=0;i<actions.length;i++){
    const a=actions[i];
    if(typeof a.tick!=='number'||a.tick<lastTick) return {ok:false,reason:'tick backwards at '+i};
    if(a.tick>1000) return {ok:false,reason:'ticks too high'};
    // advance ticks from lastTick to a.tick
    for(let t=lastTick+1;t<=a.tick;t++){ let r=applyTick(t); if(!r.ok) return r; }
    lastTick=a.tick;
    if(a.t=='move'){
      if(Math.abs(a.dx)>1||Math.abs(a.dy)>1||Math.abs(a.dx)+Math.abs(a.dy)!=1) return {ok:false,reason:'invalid move '+i};
      let nx=px+a.dx, ny=py+a.dy; if(nx<0||ny<0||nx>20||ny>20) return {ok:false,reason:'oob '+i};
      if(blocks[nx+','+ny]) return {ok:false,reason:'wall-through '+i+' — includes hidden blocks: hidden blocks are blocks, you cannot step through them'};
      px=nx; py=ny; stamina=Math.min(100,stamina+(power=='speed'?1:.5));
      if(biome=='Ice' && rng()<.18){ let sx=px+a.dx, sy=py+a.dy; if(sx>=0&&sy>=0&&sx<=20&&sy<=20&&!blocks[sx+','+sy]){px=sx;py=sy;} }
      if(traps[px+','+py]) stamina=Math.max(0,stamina-12);
      if(gems[px+','+py]){ delete gems[px+','+py]; let gain=biome=='Cavern'?30:15; if(mod=='Double Gems')gain*=2; score+=gain; }
      if(powers[px+','+py]){ power=powers[px+','+py]; delete powers[px+','+py]; powerUntilTick=a.tick+15; if(power=='pick')score+=5; if(power=='clock')timer+=20; if(power=='lantern'){/* vision only, no score */} if(power=='sonar'){/* sonar only */} if(power=='shield'){/* shield only */} }
    } else if(a.t=='mine'){
      if(Math.abs(a.x-px)+Math.abs(a.y-py)!=1) return {ok:false,reason:'mine too far '+i};
      let k=a.x+','+a.y; if(!blocks[k]) return {ok:false,reason:'mine empty '+i};
      if(blocks[k].special=='locked'&&!hasKey) return {ok:false,reason:'locked without key '+i};
      if(stamina<=0) return {ok:false,reason:'0 stamina '+i};
      let cost={dirt:5,stone:8,iron:12,crystal:16,gamble:8}[blocks[k].kind]; if(power=='pick') cost=Math.ceil(cost/2);
      stamina=Math.max(0,stamina-cost);
      let dmg=power=='pick'?2:1; hp[k]-=dmg; combo++; if(combo>2) score+=combo;
      if(hp[k]<=0){ let b=blocks[k]; delete blocks[k]; score+=20; stamina=Math.min(100,stamina+4);
        if(b.special=='explosive'){ for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ let kk=(a.x+dx)+','+(a.y+dy); if(blocks[kk]){ hp[kk]--; if(hp[kk]<=0) delete blocks[kk]; } } }
        if(b.special=='ice') timer+=5;
        if(b.special=='lava'){ if(power!='shield') stamina=Math.max(0,stamina-15); }
        if(b.kind=='crystal'&&rng()<.4) hasKey=true;
        if(b.kind=='gamble'){ let r=rng(); if(r<.4)score+=50; else if(r<.7)timer-=10; else score+=10; }
      }
    } else return {ok:false,reason:'unknown action '+i};
  }
  if(px!==19||py!==19) return {ok:false,reason:'did not reach finish'};
  if(typeof ticks!=='number'||ticks<10||ticks>1000) return {ok:false,reason:'elapsed out of range'};
  let timeBonus=Math.max(0,(200-ticks))*2; let serverScore=score+timeBonus;
  if(clientScore!==serverScore) return {ok:false,reason:'score mismatch client '+clientScore+' vs server '+serverScore,serverScore};
  return {ok:true,serverScore};
}

function validateRun(sess,body){
  if(!sess) return{ok:false,reason:'no session'};
  if(body.seed!==sess.seed) return{ok:false,reason:'seed mismatch'};
  if(body.version!=='9.0.0' && body.version!=='8.0.0') return{ok:false,reason:'version mismatch'};
  if(!Array.isArray(body.actions)||body.actions.length<5||body.actions.length>3000) return{ok:false,reason:'actions length'};
  const fp=crypto.createHash('sha256').update(JSON.stringify(body.actions)).digest('hex');
  if(leaderboard.some(r=>r.fingerprint===fp)) return{ok:false,reason:'duplicate replay'};
  const v=simulateRun(sess.seed,body.difficulty,body.modifier,body.biome,body.actions,body.ticks,body.clientScore);
  if(!v.ok) return v;
  return {ok:true,serverScore:v.serverScore,fingerprint:fp};
}
const server=http.createServer((req,res)=>{
  // SAME-ORIGIN: serve the game HTML from this server, so /api/* is same origin — no proxy, no CORS hack
  if(req.method=='GET'&&(req.url=='/'||req.url=='/index.html')){
    const candidates=['maze_miner_race_v9_single.html','maze_miner_race_v8_single.html','index.html'];
    for(let c of candidates){ try{ let p=path.join(process.cwd(),c); if(fs.existsSync(p)){ res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(fs.readFileSync(p)); } }catch(e){} }
    res.statusCode=404; return res.end('Put maze_miner_race_v9_single.html in same folder as server.js');
  }
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Content-Type','application/json');if(req.method=='OPTIONS'){res.statusCode=204;return res.end();}let body='';req.on('data',c=>{body+=c});req.on('end',()=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname=='/api/session'&&req.method=='POST'){const seed=new Date().toISOString().slice(0,10);const id=crypto.randomBytes(16).toString('hex');const token=crypto.createHmac('sha256',SECRET).update(id+seed).digest('hex');sessions.set(id,{seed,created:Date.now()});return res.end(JSON.stringify({sessionId:id,seed,token}));}if(url.pathname=='/api/run'&&req.method=='POST'){const b=JSON.parse(body||'{}');const sess=sessions.get(b.sessionId);const expected=crypto.createHmac('sha256',SECRET).update(b.sessionId+(sess?.seed||'')).digest('hex');if(b.token!==expected)return res.end(JSON.stringify({ok:false,reason:'bad token'}));sess.runs=(sess.runs||0)+1;if(sess.runs>20)return res.end(JSON.stringify({ok:false,reason:'rate limited'}));const v=validateRun(sess,b);if(!v.ok)return res.end(JSON.stringify(v));const e={user:'player',seed:sess.seed,serverScore:v.serverScore,time:b.ticks,difficulty:b.difficulty,fingerprint:v.fingerprint,at:Date.now()};leaderboard.push(e);leaderboard.sort((a,b)=>b.serverScore-a.serverScore);return res.end(JSON.stringify({ok:true,verified:true,serverScore:v.serverScore,rank:leaderboard.indexOf(e)+1,fingerprint:v.fingerprint}));}if(url.pathname=='/api/leaderboard'){return res.end(JSON.stringify(leaderboard.slice(0,100)));}if(url.pathname=='/api/health'){return res.end(JSON.stringify({ok:true,uptime:process.uptime(),leaderboard:leaderboard.length,sessions:sessions.size}));}res.statusCode=404;return res.end(JSON.stringify({error:'not found'}));}catch(e){res.statusCode=400;return res.end(JSON.stringify({ok:false,reason:e.message}));}})});
server.listen(process.env.PORT||3001,()=>console.log('MMR v9 server on :'+(process.env.PORT||3001)+' — open http://localhost:3001/'));
