# Changelog

## 11.0.0 — Production hardening
- Browser imports canonical `packages/simulation/` modules served by the same-origin server.
- Transactional leaderboard persistence with lock, fsync, atomic rename, and unique replay fingerprints.
- Request IDs, session cleanup, metrics, environment validation, and security headers.
- TypeScript `checkJs` typecheck gate, Vite build, and full Playwright coverage.

## 10.0.0 — Production
- Shared simulation package and hardened replay verifier.
