// server/index.js — Maze Miner Race v10.0.0 — Production-hardened, same-origin
// Run: SESSION_SECRET=<long-random> node server/index.js  (or: npm start)
// Requires Node 20+. No external deps. Serves game at / + /api/* same origin.
// Security: timingSafeEqual HMAC, session expiry 1h, body limit 100KB, CORS allowlist,
// rate limit per IP+session, security headers, structured JSON logs, graceful shutdown.
// Durability: leaderboard persisted to data/leaderboard.json (swap for SQLite/Postgres via LEADERBOARD_FILE / DATABASE_URL).
import http from 'node:http'; import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { simulateRun } from '../packages/simulation/replay.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSION='10.0.0'; const COMMIT=process.env.COMMIT_SHA||'dev';
const SECRET=process.env.SESSION_SECRET;
if(process.env.NODE_ENV==='production' && !SECRET){ console.error(JSON.stringify({level:'error',msg:'SESSION_SECRET required in production'})); process.exit(1); }
const SECRET_BUF=Buffer.from(SECRET||'dev-only-change-me-do-not-use-in-prod');
const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGINS||'http://localhost:3001').split(',').map(s=>s.trim());
const MAX_BODY=100*1024; const SESSION_TTL=60*60*1000;
const sessions=new Map(); const ipHits=new Map();
const DATA_FILE=process.env.LEADERBOARD_FILE||path.join(__dirname,'..','data','leaderboard.json');
let leaderboard=[]; try{ if(fs.existsSync(DATA_FILE)) leaderboard=JSON.parse(fs.readFileSync(DATA_FILE,'utf-8')); }catch(e){ leaderboard=[]; }
function log(level,msg,extra={}){ console.log(JSON.stringify({ts:new Date().toISOString(),level,version:VERSION,commit:COMMIT,msg,...extra})); }
function persist(){ try{ fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true}); fs.writeFileSync(DATA_FILE,JSON.stringify(leaderboard,null,2)); }catch(e){ log('error','persist failed',{error:e.message}); } }
function timingEqual(a,b){ try{ const ab=Buffer.from(a), bb=Buffer.from(b); if(ab.length!==bb.length) return false; return crypto.timingSafeEqual(ab,bb); }catch{ return false; } }
function rateLimit(ip){ const now=Date.now(); const arr=(ipHits.get(ip)||[]).filter(t=>now-t<60000); arr.push(now); ipHits.set(ip,arr); return arr.length<=60; }
function securityHeaders(res,origin){ res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"); res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('X-Frame-Options','DENY'); if(origin&&ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin',origin); }
const server=http.createServer((req,res)=>{
  const origin=req.headers.origin||''; const ip=req.socket.remoteAddress||'unknown';
  if(!rateLimit(ip)){ securityHeaders(res,origin); res.statusCode=429; return res.end(JSON.stringify({ok:false,reason:'rate limited'})); }
  if(req.method==='GET'&&(req.url==='/'||req.url==='/index.html')){
    securityHeaders(res,origin);
    const cand=[path.join(__dirname,'..','public','index.html'), path.join(__dirname,'..','maze_miner_race_v10_single.html')];
    for(let c of cand){ try{ if(fs.existsSync(c)){ res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(fs.readFileSync(c)); } }catch{} }
    res.statusCode=404; return res.end('Game HTML not found — put public/index.html next to server/');
  }
  securityHeaders(res,origin); res.setHeader('Content-Type','application/json');
  if(req.method==='OPTIONS'){ res.statusCode=204; return res.end(); }
  let body=''; let tooBig=false; req.on('data',c=>{ body+=c; if(body.length>MAX_BODY){ tooBig=true; req.destroy(); } }); req.on('end',()=>{
    try{
      if(tooBig) { res.statusCode=413; return res.end(JSON.stringify({ok:false,reason:'body too large'})); }
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/api/health') return res.end(JSON.stringify({ok:true,version:VERSION,commit:COMMIT,uptime:process.uptime(),leaderboard:leaderboard.length,sessions:sessions.size}));
      if(url.pathname==='/api/session'&&req.method==='POST'){
        const seed=new Date().toISOString().slice(0,10); const id=crypto.randomBytes(16).toString('hex');
        const token=crypto.createHmac('sha256',SECRET_BUF).update(id+seed+VERSION).digest('hex');
        sessions.set(id,{seed,created:Date.now()}); log('info','session created',{sessionId:id.slice(0,8)});
        return res.end(JSON.stringify({sessionId:id,seed,token}));
      }
      if(url.pathname==='/api/run'&&req.method==='POST'){
        const b=JSON.parse(body||'{}'); const sess=sessions.get(b.sessionId);
        if(!sess||Date.now()-sess.created>SESSION_TTL) return res.end(JSON.stringify({ok:false,reason:'session expired or unknown'}));
        const expected=crypto.createHmac('sha256',SECRET_BUF).update(b.sessionId+(sess?.seed||'')+VERSION).digest('hex');
        if(!timingEqual(b.token||'',expected)) { log('warn','bad HMAC',{ip}); return res.end(JSON.stringify({ok:false,reason:'bad token'})); }
        sess.runs=(sess.runs||0)+1; if(sess.runs>20) return res.end(JSON.stringify({ok:false,reason:'rate limited'}));
        if(!Array.isArray(b.actions)||b.actions.length<5||b.actions.length>3000) return res.end(JSON.stringify({ok:false,reason:'actions length'}));
        const fp=crypto.createHash('sha256').update(JSON.stringify(b.actions)).digest('hex');
        if(leaderboard.some(r=>r.fingerprint===fp)) return res.end(JSON.stringify({ok:false,reason:'duplicate replay'}));
        if(b.seed!==sess.seed) return res.end(JSON.stringify({ok:false,reason:'seed mismatch'}));
        if(b.version!==VERSION) return res.end(JSON.stringify({ok:false,reason:'version mismatch'}));
        // Server derives EVERYTHING from replay — never trusts client score/gems/streak/rank/time/powerup/biome/rival
        const v=simulateRun(sess.seed,b.difficulty,b.modifier,b.biome,b.actions,b.ticks,b.clientScore);
        if(!v.ok){ log('warn','replay rejected',{reason:v.reason}); return res.end(JSON.stringify({ok:false,reason:v.reason})); }
        const rec={fingerprint:fp,seed:sess.seed,serverScore:v.serverScore,time:b.ticks,difficulty:b.difficulty,createdAt:Date.now(),season:process.env.SEASON||'season-1'};
        leaderboard.push(rec); leaderboard.sort((a,b)=>b.serverScore-a.serverScore); persist();
        log('info','run verified',{serverScore:v.serverScore,rank:leaderboard.indexOf(rec)+1});
        return res.end(JSON.stringify({ok:true,verified:true,serverScore:v.serverScore,rank:leaderboard.indexOf(rec)+1,fingerprint:fp}));
      }
      if(url.pathname==='/api/leaderboard') return res.end(JSON.stringify(leaderboard.slice(0,100)));
      res.statusCode=404; return res.end(JSON.stringify({error:'not found'}));
    }catch(e){ log('error','request failed',{error:e.message}); res.statusCode=400; return res.end(JSON.stringify({ok:false,reason:'bad request'})); }
  });
});
const PORT=process.env.PORT||3001;
server.listen(PORT,()=>log('info','listening',{port:PORT}));
function shutdown(){ log('info','shutting down'); server.close(()=>{ persist(); process.exit(0); }); setTimeout(()=>process.exit(1),5000).unref(); }
process.on('SIGTERM',shutdown); process.on('SIGINT',shutdown);
