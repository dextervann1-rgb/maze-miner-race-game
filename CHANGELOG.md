# Changelog
## 10.0.0 — Production
- Shared simulation package (packages/simulation) — no duplicated genMaze/simulateRun
- Hardened server: timingSafeEqual, session expiry, body limit, CORS allowlist, rate limit, security headers, graceful shutdown, JSON logs
- Durable leaderboard: data/leaderboard.json with fingerprint unique constraint
- TypeScript types for replay protocol
- Accessibility: focus-visible, Escape closes dialogs, aria-live, reduced-motion
- Version consistency: 10.0.0 everywhere
- CI: node tests + Playwright e2e (live server, verified run, tamper cases, mobile, a11y)
