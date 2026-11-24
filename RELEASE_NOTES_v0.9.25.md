# Grid Club v0.9.25 beta

## Pipe Shift: campaign-wide timed difficulty recalibration

**All 20 timed stages**, not just the earliest levels, now use audited, stage-specific move caps. The old formula multiplied the generator's reversible scramble history by 1.45–2× even when the actual win condition allowed much shorter routes. That formula has been removed.

- Added `pipe-solver.js`, an **offline, bounded, objective-aware legal-route finder**. It searches for ways to satisfy the actual victory evaluation by repositioning the required pipe network. It does **not** claim mathematical optimality and never runs on a player's device.
- The bounded solver produced shorter verified legal winning routes for **12 of 20 timed stages**, including 23 moves for Level 2 Stage 5 (previous move cap: 150).
- For the other eight, which involve more involved dense networks, the existing legal generator route remains the guaranteed winning witness. Their caps are reduced to roughly 13–20% above that verified route rather than artificially inflating it with a 1.5–2× factor.
- Every stage now has a legal **winning sequence at or below its published move limit**; the full 42-stage campaign remains solvable. The optional board objectives ("Connect using any pipes" and "Connect using all pipes") were checked using the game's own evaluation function.
- Examples: Level 2 Stage 5 **150 → 35 moves** and **1:35 → 1:15**; Level 2 Stage 6 **170 → 30 moves** and **2:10 → 1:20**; Level 3 Stage 4 **165 → 45 moves**.
- Other particularly overlong timers were moderated where strong route evidence exists. Untimed endurance stages remain untimed with unlimited moves.
- Finished campaign progression and PBs are preserved. **In-progress, pre-update attempts keep their original timer and move allowance** on resumption. The new limits apply to fresh attempts.
- Calibration evidence (compact two-character slide witnesses) is committed in `tests/pipe-calibration-witnesses-v025.js`. `tests/pipe-campaign-v8.test.js` replays and checks each route against the real goal and cap.

This is evidence-backed calibration, **not** a proof that every stage has an optimal shortest solution or ideal human completion time. Hard-stage fallback limits intentionally remain more generous.

## Club Credit economy

Routine assistance costs less, while larger hints and emergency rescues remain premium. Completion rewards and wallet balances are unchanged.

| Item | Previous | v0.9.25 |
|---|---:|---:|
| Pipe Shift: 1 square hint | 5 | **3** |
| Pipe Shift: 3 squares hint | 10 | **7** |
| Pipe Shift: full solution | 25 | **18** |
| Dot Trails: level hint | 10 | **5** |
| Either game: +15 seconds during play | 10 | **5** |
| Either game: emergency +30 seconds | 30 | **15** |
| Either game: remaining emergency +15 seconds | 20 | **10** |

A Pipe Shift stage still awards 2 Club Credits on first completion, plus the existing level bonuses. A routine one-square hint costs 1.5 ordinary stage rewards; an entire solution costs nine. This leaves meaningful choices without having to complete five puzzles just to buy one 15-second boost.

Dot Trails validates new costs inside the existing local spend ledger. Credits remain a **device-local beta currency**. Do not introduce real-money credit purchases without server-side authentication, entitlements and tamper-resistant transactions.

## Interface refinements

- Removed the redundant "Completed today" badge from the Dot Trails home Daily Challenge tile. Its subtitle already changes to "View today's result."
- Consolidated the Dot Trails leaderboard summary above the result rows: **Global average · Verified players · Your rank** (only show values that are actually available and applicable).
- Removed the duplicate community-average line beneath the result when the verified user result is present.

## Verification

- Validated 42 campaign boards and their reference solutions; re-evaluated every timed calibration route under the actual all-pipes/any-pipes winning logic, including the 12 independent route witnesses.
- Checked credit price displays and spend-authorization rules.
- Updated tests: `tests/pipe-campaign-v8.test.js`, `tests/credit-economy-v025.test.js`; added the offline solver and compact route-witness data.
- Updated cache, script URLs and service worker to **v0.9.25**.
- In-app, full iOS gesture, timer and credit-spend smoke tests still require device verification.

This release addresses the move-limit arithmetic across the entire campaign. Further playtesting may still reveal individual puzzles whose *starting layouts* are intrinsically too easy or too difficult.
