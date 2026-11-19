# Maze Miner Race v11.0.0

Deterministic maze race with canonical browser/server simulation and server-authoritative replay verification.

## Run

```bash
npm ci
npm run typecheck
npm test
npm run build
SESSION_SECRET=$(openssl rand -hex 32) npm start
```

Open `http://localhost:3001/`. The browser imports the canonical modules under `packages/simulation/`; verified runs display `SERVER VERIFIED`.
