# v5 Backend Specification

The v4 client stores progress and receipts locally for demonstration. A production v5 service should issue daily seeds, authenticate players, validate submitted run replays server-side, and publish signed leaderboard results.

## Proposed endpoints

- `POST /v5/runs/start` — issue a signed run session and daily seed.
- `POST /v5/runs/submit` — validate replay inputs, timing, score, and checksum.
- `GET /v5/leaderboards/{date}` — return verified daily rankings.
- `GET /v5/profile` and `PUT /v5/profile` — cloud progression.
- `GET /v5/tournaments/current` — tournament bracket and advancement.

Never trust client-submitted scores, currency, or timestamps without replay validation.
