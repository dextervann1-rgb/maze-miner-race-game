# API
## GET / — game HTML (same-origin)
## GET /api/health — {ok, version, commit, uptime, leaderboard, sessions}
## POST /api/session — {sessionId, seed, token}
## POST /api/run — body RunSubmission, returns {verified, serverScore, rank, fingerprint} or {ok:false, reason}
## GET /api/leaderboard — top 100, server-derived only
