# Database Migration — v11.0.0
## Current: data/leaderboard.json (transactional atomic writes)
- Atomic: write temp + fsync + rename. Lock file prevents concurrent writes.
- Unique fingerprint enforced in code + on load (dedupe).

## Next: SQLite (when you need >10k rows / concurrent writers)
```sql
CREATE TABLE leaderboard (
  fingerprint TEXT PRIMARY KEY,
  seed TEXT NOT NULL,
  server_score INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  season TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_leaderboard_score ON leaderboard(server_score DESC);
CREATE INDEX idx_leaderboard_season ON leaderboard(season, server_score DESC);
```
Migration: `node scripts/migrate-json-to-sqlite.js` reads data/leaderboard.json, inserts with INSERT OR IGNORE.

## Postgres (production)
Same schema, fingerprint PRIMARY KEY, use SERIAL id if needed. Set DATABASE_URL, server will use pg if installed.
