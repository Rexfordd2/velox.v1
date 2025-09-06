# Velox Spec Check (Localhost)

**Base URL:** http://localhost:3000
**Run at:** 2025-08-25T01:34:55.075Z

| ID | Title | Critical | Result | Notes |
| --- | --- | :--: | :--: | --- |
| `onboarding-first-run` | Onboarding: first-run flow reachable and renders primary choices | YES | ❌ | status=500 |
| `privacy-defaults` | Privacy: default is private sessions / metrics-only sync | YES | ❌ | status=500 |
| `l2b-screen` | Lift‑to‑the‑Beat screen loads with source picker & BPM display | YES | ❌ | status=500 |
| `leaderboard-global` | Leaderboards page reachable (global/local tabs) | YES | ❌ | status=500 |
| `replay-page` | Replay page route exists (dynamic repId) | no | ❌ | status=500 (404 okay for stub) |
| `debug-status` | Live status page reachable (FPS, inference ms, upload queue) | no | ❌ | status=500 |
| `verify-screen` | Verification screen reachable (dual-angle viewer) | no | ❌ | status=500 (404 okay for stub) |

4 critical check(s) failed ❌. See notes above.
