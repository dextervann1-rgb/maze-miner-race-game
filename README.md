# Maze Miner Race v10.0.0
Deterministic maze race. Server-authoritative replay verification.

## Run
```bash
cp .env.example .env  # set SESSION_SECRET
npm ci
npm start  # http://localhost:3001/
```
## Verify
Play → Win → ✅ SERVER VERIFIED. Server off → ⚠️ LOCAL ONLY.
## Test
```bash
npm test
npx playwright test
```
