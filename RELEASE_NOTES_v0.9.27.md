# Grid Club v0.9.27 beta · final Pipe Shift calibration pass

## Campaign time and move caps
- Recalibrated **all 20 timed stages** using previously recorded player move counts where available and verified legal solution routes for the other stages. Early untimed stages and the Level 5/6 endurance finales remain untimed and unlimited.
- Example changes:
  - Level 3 Stage 4: **45 moves / 2:05 → 35 moves / 1:15** (player: 23 moves, about 30 seconds).
  - Level 3 Stage 5: **55 / 1:43 → 55 / 1:25** (player: 41 moves).
  - Level 3 Stage 6: **140 / 2:20 → 75 / 1:30** (player: 46 moves).
  - Level 4 Stage 4: **145 / 2:45 → 85 / 1:40** (player: 51 moves, about 37 seconds).
  - Level 4 Stage 6: **170 / 6:00 → 100 / 3:15** (player: 71 moves, about 2:14).
- Other stages have moderate reductions based on their available evidence. The later dense networks have longer budgets than simpler levels, but no longer use six-minute trial clocks where shorter ones make sense.
- Stage **18** (Level 3 finale) and stage **23** (Level 4 Stage 5) replace shallow routes with a richer, multi-row, 21-pipe *all-pipes* design. This is a **structural difficulty increase**, not just a shorter timer.
- Stage 18/23 old personal bests and unfinished attempts are retired because they were on fundamentally different boards. Completed stage status, unlocks, earned credits, Free Play, Daily history and all other personal bests are preserved.
- Unfinished campaigns from v0.9.25 retain their original **v2 move cap and timer**, rather than silently inheriting stricter v3 limits. Earlier genuinely uncapped attempts stay uncapped.

### Evidence and limits
- Each of the 42 campaign puzzle layouts has a legal reversed-generator solution. The 20 timed stages have a checked move-limit basis.
- 17 timed stages have replayable, verified legal winning traces **under their published caps**. Three tighter caps (stages 17, 22, 24) are based on successful **player-observed** outcomes of 46, 51 and 71 moves, respectively, rather than a saved slide-by-slide recording. Their generator trails are longer and are not claimed to fit those tighter caps.
- This avoids falsely describing generator scrambling length as a shortest solution or treating an observed player solve as an automatically replayed proof.

## Daily Challenge: new verified v2 from 27 November 2026
- Daily puzzles from **27 November 2026 UTC** switch to deterministic **7×7 all-pipes** puzzles, cycling among multi-row, branching and full-network structures. Direct IN-to-OUT connections do **not** count if working pipes remain disconnected. No timer; fewest moves still wins.
- All players see the same board each UTC date. The new generator records a genuine legal winning trace for each board; 21 consecutive v2 dates were validated.
- The online **Supabase replay/verifier** in the private development repository has been upgraded and successfully deployed before the client cutover, so verified leaderboard submissions use the exact same algorithm.
- Existing ranked boards remain **bit-for-bit unchanged** through 26 November, including today's 25 November Daily Challenge. Tests pin the pre-cutover seed and board fingerprints. No mid-day switch.
- Daily v2 makes the *all pipes* objective visible on the game screen.

## Not part of this pass
- Proposed **three shared lives from Level 4**, 50-credit three-life refill, optional rewarded ad, daily life refresh, and 20-credit skip that forfeits the +5 level mastery bonus are retained as a **future design**, not implemented here.
- Existing Club Credits, stored progress and public **Grid Club** branding are unchanged.
- New games continue to appear as roadmap placeholders.

## Verification
- Campaign regression: **42 levels**, all 20 timed caps, 32 Free Play configurations.
- Daily regression: old published board fingerprints; 21 future v2 boards and valid routes; eight future authoritative server replays; historical client/server board equivalence.
- Updated v0.9.27 game script URLs and PWA cache key to prevent stale-engine mismatches.
- Full iPhone gameplay and gesture testing should still be performed on the deployed build.
