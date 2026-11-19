import http from 'node:http';
import crypto from 'node:crypto';
const secret = process.env.MMR_SESSION_SECRET || 'development-only-secret';
export function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
export function verifySession(token) {
  try {
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(Buffer.from(body, 'base64url'));
  } catch {
    return null;
  }
}
export function createServer() {
  return http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/health') {
      res.end(JSON.stringify({ ok: true, service: 'maze-miner-v5' }));
      return;
    }
    if (req.url === '/v5/runs/start' && req.method === 'POST') {
      res.end(
        JSON.stringify({
          session: signSession({ seed: new Date().toISOString().slice(0, 10), iat: Date.now() }),
        }),
      );
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'not found' }));
  });
}
if (process.argv[1] === new URL(import.meta.url).pathname)
  createServer().listen(process.env.PORT || 8787);
