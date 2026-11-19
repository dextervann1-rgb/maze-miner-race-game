# Release v11.0.0 — Production
## Tag: v11.0.0
## Changelog
- Browser imports canonical packages/simulation — duplicate genMaze/simulateRun REMOVED from public/index.html
- Server serves /packages/simulation/* as ES modules
- Transactional leaderboard: temp + fsync + rename, lock file, retry
- Env validation, session cleanup, request IDs, /api/metrics
- TypeScript checkJs gate: npm run typecheck (tsc --noEmit)
- Full Playwright Play -> Win -> SERVER VERIFIED test
- DB migration docs (JSON -> SQLite -> Postgres)
## Deploy
```bash
npm ci
npm run typecheck
npm test
npm run test:e2e
SESSION_SECRET=$(openssl rand -hex 32) npm start
```
## Production checklist
- [ ] SESSION_SECRET set, >=32 chars
- [ ] ALLOWED_ORIGINS set to production domain
- [ ] data/ backed up
- [ ] Health: curl /api/health returns version 11.0.0
