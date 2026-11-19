// server/index.js — Maze Miner Race v11.0.0 — Production
// FIXES v10 gaps: (1) serves /packages/simulation/* as ES modules so browser imports SAME package, no duplicate
// (2) transactional leaderboard: atomic write via temp + rename + file lock, unique fingerprint
// (3) env validation at startup, expired-session cleanup, request IDs, metrics
// (4) TypeScript-checked via tsc --noEmit (see tsconfig.json, checkJs)
import http from 'node:http'; import crypto from 'node:crypto'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { simulateRun } from '../packages/simulation/replay.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSION='11.0.0'; const COMMIT=process.env.COMMIT_SHA||'dev';
// ENV VALIDATION at startup — fail fast if production config is bad
const REQUIRED_ENV = process.env.NODE_ENV==='production' ? ['SESSION_SECRET'] : [];
for(let k of REQUIRED_ENV){ if(!process.env[k]){ console.error(JSON.stringify({level:'error',msg:`Missing required env ${k}`})); process.exit(1); } }
if(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length<16) console.warn('SESSION_SECRET should be >=16 chars');
const SECRET_BUF=Buffer.from(process.env.SESSION_SECRET||'dev-only-change-me-do-not-use-in-prod');
const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGINS||'http://localhost:3001').split(',').map(s=>s.trim());
const MAX_BODY=100*1024; const SESSION_TTL=60*60*1000;
const sessions=new Map(); const ipHits=new Map();
let metrics={requests:0, verified:0, rejected:0, rejectionsByReason:{}, avgLatencyMs:0};
const DATA_FILE=process.env.LEADERBOARD_FILE||path.join(__dirname,'..','data','leaderboard.json');
const LOCK_FILE=DATA_FILE+'.lock';
let leaderboard=[]; try{ if(fs.existsSync(DATA_FILE)) leaderboard=JSON.parse(fs.readFileSync(DATA_FILE,'utf-8')); }catch{ leaderboard=[]; }
function log(level,msg,extra={}){ console.log(JSON.stringify({ts:new Date().toISOString(),level,version:VERSION,commit:COMMIT,requestId:extra.requestId||'-',msg,...extra})); }
// TRANSACTIONAL persist: write temp + fsync + rename (atomic), with simple lock file
function persistTransactional(){
  if(fs.existsSync(LOCK_FILE)) return false; // another write in progress — caller retries
  try{
    fs.mkdirSync(path.dirname(DATA_FILE),{recursive:true});
    fs.writeFileSync(LOCK_FILE, String(Date.now()));
    const tmp=DATA_FILE+'.tmp.'+process.pid;
    fs.writeFileSync(tmp, JSON.stringify(leaderboard,null,2));
    const fd=fs.openSync(tmp,'r'); fs.fsyncSync(fd); fs.closeSync(fd);
    fs.renameSync(tmp, DATA_FILE); // atomic on POSIX
    fs.unlinkSync(LOCK_FILE); return true;
  }catch(e){ try{ if(fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE); }catch{} log('error','persist failed',{error:e.message}); return false; }
}
// Periodic expired-session cleanup (every 5 min)
setInterval(()=>{ const now=Date.now(); let n=0; for(let [k,v] of sessions){ if(now-v.created>SESSION_TTL){ sessions.delete(k); n++; } } if(n) log('info','expired sessions cleaned',{count:n}); }, 5*60*1000).unref();
function timingEqual(a,b){ try{ const ab=Buffer.from(a), bb=Buffer.from(b); if(ab.length!==bb.length) return false; return crypto.timingSafeEqual(ab,bb); }catch{ return false; } }
function rateLimit(ip){ const now=Date.now(); const arr=(ipHits.get(ip)||[]).filter(t=>now-t<60000); arr.push(now); ipHits.set(ip,arr); return arr.length<=60; }
function securityHeaders(res,origin){ res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"); res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Referrer-Policy','no-referrer'); res.setHeader('X-Frame-Options','DENY'); if(origin&&ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin',origin); }
const server=http.createServer((req,res)=>{
  const start=Date.now(); const requestId=crypto.randomBytes(8).toString('hex'); metrics.requests++;
  res.setHeader('X-Request-Id', requestId);
  const origin=req.headers.origin||''; const ip=req.socket.remoteAddress||'unknown';
  if(!rateLimit(ip)){ securityHeaders(res,origin); res.statusCode=429; return res.end(JSON.stringify({ok:false,reason:'rate limited',requestId})); }
  // v11 FIX #1: Serve canonical simulation as ES modules — browser imports SAME files as server
  if(req.method==='GET' && req.url.startsWith('/packages/simulation/')){
    securityHeaders(res,origin);
    const rel=req.url.replace('/packages/',''); const p=path.join(__dirname,'..','packages',rel);
    // Prevent path traversal
    if(!p.startsWith(path.join(__dirname,'..','packages'))){ res.statusCode=403; return res.end('forbidden'); }
    if(fs.existsSync(p)){ res.setHeader('Content-Type','text/javascript; charset=utf-8'); return res.end(fs.readFileSync(p)); }
    res.statusCode=404; return res.end('not found');
  }
  if(req.method==='GET'&&(req.url==='/'||req.url==='/index.html')){
    securityHeaders(res,origin);
    const cand=[path.join(__dirname,'..','public','index.html')];
    for(let c of cand){ try{ if(fs.existsSync(c)){ res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(fs.readFileSync(c)); } }catch{} }
    res.statusCode=404; return res.end('Game HTML not found');
  }
  securityHeaders(res,origin); res.setHeader('Content-Type','application/json');
  if(req.method==='OPTIONS'){ res.statusCode=204; return res.end(); }
  let body=''; let tooBig=false; req.on('data',c=>{ body+=c; if(body.length>MAX_BODY){ tooBig=true; req.destroy(); } }); req.on('end',()=>{
    const latency=Date.now()-start; metrics.avgLatencyMs=Math.round((metrics.avgLatencyMs*(metrics.requests-1)+latency)/metrics.requests);
    try{
      if(tooBig){ res.statusCode=413; return res.end(JSON.stringify({ok:false,reason:'body too large',requestId})); }
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/api/health') return res.end(JSON.stringify({ok:true,version:VERSION,commit:COMMIT,uptime:process.uptime(),leaderboard:leaderboard.length,sessions:sessions.size,metrics,requestId}));
      if(url.pathname==='/api/metrics') return res.end(JSON.stringify({metrics,requestId}));
      if(url.pathname==='/api/session'&&req.method==='POST'){
        const seed=new Date().toISOString().slice(0,10); const id=crypto.randomBytes(16).toString('hex');
        const token=crypto.createHmac('sha256',SECRET_BUF).update(id+seed+VERSION).digest('hex');
        sessions.set(id,{seed,created:Date.now()}); log('info','session created',{requestId,sessionId:id.slice(0,8)});
        return res.end(JSON.stringify({sessionId:id,seed,token,requestId}));
      }
      if(url.pathname==='/api/run'&&req.method==='POST'){
        const b=JSON.parse(body||'{}'); const sess=sessions.get(b.sessionId);
        if(!sess||Date.now()-sess.created>SESSION_TTL) return res.end(JSON.stringify({ok:false,reason:'session expired or unknown',requestId}));
        const expected=crypto.createHmac('sha256',SECRET_BUF).update(b.sessionId+(sess?.seed||'')+VERSION).digest('hex');
        if(!timingEqual(b.token||'',expected)){ metrics.rejected++; log('warn','bad HMAC',{requestId,ip}); return res.end(JSON.stringify({ok:false,reason:'bad token',requestId})); }
        sess.runs=(sess.runs||0)+1; if(sess.runs>20) return res.end(JSON.stringify({ok:false,reason:'rate limited',requestId}));
        if(!Array.isArray(b.actions)||b.actions.length<5||b.actions.length>3000) return res.end(JSON.stringify({ok:false,reason:'actions length',requestId}));
        const fp=crypto.createHash('sha256').update(JSON.stringify(b.actions)).digest('hex');
        if(leaderboard.some(r=>r.fingerprint===fp)){ metrics.rejected++; metrics.rejectionsByReason.duplicate=(metrics.rejectionsByReason.duplicate||0)+1; return res.end(JSON.stringify({ok:false,reason:'duplicate replay',requestId})); }
        if(b.seed!==sess.seed) return res.end(JSON.stringify({ok:false,reason:'seed mismatch',requestId}));
        if(b.version!==VERSION) return res.end(JSON.stringify({ok:false,reason:'version mismatch',requestId}));
        const v=simulateRun(sess.seed,b.difficulty,b.modifier,b.biome,b.actions,b.ticks,b.clientScore);
        if(!v.ok){ metrics.rejected++; metrics.rejectionsByReason[v.reason]=(metrics.rejectionsByReason[v.reason]||0)+1; log('warn','replay rejected',{requestId,reason:v.reason}); return res.end(JSON.stringify({ok:false,reason:v.reason,requestId})); }
        const rec={fingerprint:fp,seed:sess.seed,serverScore:v.serverScore,time:b.ticks,difficulty:b.difficulty,createdAt:Date.now(),season:process.env.SEASON||'season-1'};
        leaderboard.push(rec); leaderboard.sort((a,b)=>b.serverScore-a.serverScore);
        // Transactional persist with retry
        let ok=persistTransactional(); if(!ok){ setTimeout(persistTransactional,50); }
        metrics.verified++; log('info','run verified',{requestId,serverScore:v.serverScore,rank:leaderboard.indexOf(rec)+1});
        return res.end(JSON.stringify({ok:true,verified:true,serverScore:v.serverScore,rank:leaderboard.indexOf(rec)+1,fingerprint:fp,requestId}));
      }
      if(url.pathname==='/api/leaderboard') return res.end(JSON.stringify(leaderboard.slice(0,100)));
      res.statusCode=404; return res.end(JSON.stringify({error:'not found',requestId}));
    }catch(e){ log('error','request failed',{requestId,error:e.message}); res.statusCode=400; return res.end(JSON.stringify({ok:false,reason:'bad request',requestId})); }
  });
});
const PORT=process.env.PORT||3001;
server.listen(PORT,()=>log('info','listening',{port:PORT}));
function shutdown(){ log('info','shutting down'); server.close(()=>{ persistTransactional(); process.exit(0); }); setTimeout(()=>process.exit(1),5000).unref(); }
process.on('SIGTERM',shutdown); process.on('SIGINT',shutdown);
