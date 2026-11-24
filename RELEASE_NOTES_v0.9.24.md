# Grid Club v0.9.24 beta

## Shared Club Credits vault
- Shortened uninterrupted press-and-hold animation from 1.65 seconds to **1.25 seconds**.
- Label now **Fill vault**; remains press-and-hold, with release-to-pause and hold-to-resume.
- Removed the extra helper/tooltip paragraph and the completion sentence (“All credits safely banked”).
- The small status text reads **Credit balance**; the ◉ symbol aligns vertically with the displayed numerical balance.
- Reduced the reward panel spacing, improving fit in level-up celebration overlays.
- Credits remain awarded and stored before any animation. Reduced-motion settings still show the final balance.

## Pipe Shift campaign calibration
- Level 1 Stage 4: 50 moves / 55 seconds (player completed in 24 moves / approximately 25 seconds).
- Level 1 Stage 5: 30 moves / 45 seconds (player completed in 9 moves).
- Level 2 Stage 4: 30 moves / 80 seconds (player completed in 21 moves).
- Level 2 Stage 2: replaced a nearly straight 6×6 path with a staggered-terminal route and a freshly generated, legally solvable board.
- Deliberately do **not** recalibrate every level against the generator's reverse-scramble length. That path is a valid example, not a shortest or necessary solution under either objective.
- The adjusted move limits are supported by observed, successful player completions; the generator's published route can exceed those budgets. All other timed stages retain a known valid route under their current move limits.
- Existing Pipe Shift campaign completions and Club Credits stay intact. Only the old Level 2 Stage 2 personal best and unfinished board are invalidated, because its layout changed.

## Dot Trails: dedicated Daily Challenge
- Replaced the old Daily button-to-puzzle or completed modal flow with a dedicated page: **Play / Practise** and a community leaderboard panel directly below.
- The page displays the saved first result, verification state and a refreshable verified community summary. If the backend provides individual ranked rows, they are shown; otherwise the page shows available verified totals, personal rank when returned, and community statistics without inventing other players' scores.
- When today's challenge is completed, **Practise today's puzzle** regenerates exactly the same daily layout using the same date, seed and daily-generation options.
- Practice stays unranked, never earns repeat daily credits, never overwrites the original ranked attempt or its saved result, and does not inflate personal stats.
- Daily result and in-game Back now return to the dedicated Daily screen.
- **Your statistics** contains only personal progress, performance and Daily Challenge history; global/community rankings moved out.

## Verification
- All **42** campaign boards replay successfully with legal solution moves and enforced objectives.
- **32** Free Play smoke samples across four tiers and two objectives replay successfully.
- Vault hold/pause/resume/completion, final balance and reduced-motion flow verified with simulated input.
- All changed JavaScript syntax checks passed; script, stylesheet and service-worker versions set to 0.9.24.
- Added/updated reproducible regression checks in `tests/pipe-campaign-v8.test.js` and `tests/dot-daily-v024.test.js`.

## Device acceptance checks
Verify on an iPhone/PWA: vault appearance and short hold, the Dot Trails Daily page before/after completion, the same-board unranked practice, route to Your stats, Page/Back gestures, and puzzle/time limits. The current Dot Trails backend exposes community aggregates rather than a full individual leaderboard, so the complete player-by-player listing still depends on backend support.
