# Grid Club v0.9.22 beta

## Changes
- Pipe Shift: align left-edge swipe-back navigation with Dot Trails and provide a touch/pointer fallback while reserving grid gestures for sliding pieces.
- Pipe Shift Free Play: replace persistent objective instructions with an accessible (i) popover.
- Pipe Shift hints: 1 square = 5 credits; 3 useful working-pipe squares = 10 credits; full solution = 25 credits. All previews last up to 5 seconds, pause a running level clock, leave the board unchanged and exclude assisted results from unassisted personal bests.
- Hint previews: highlight selected solved positions in yellow, slightly dim the rest of the live grid and reveal the full board without dimming.
- Dot Trails Daily Challenge: shorten the assisted-result status; use "Continue in Free Play"; replace the zero-remaining text and duplicate tomorrow message with "All Daily Challenges complete, more tomorrow".
- Pipe Shift: Levels 5 and 6, puzzles 6/7 and 7/7, are now untimed endurance challenges with unlimited moves. Existing layouts and recorded progress are retained.
- Update PWA asset URLs and service-worker cache to v0.9.22.

## Unchanged / follow-up
- Existing Pipe Shift daily leaderboard already displays gold, silver and bronze medals.
- Leaderboard credit awards require verified, idempotent server-side processing and are **not** enabled in this release.
- Further Pipe Shift move/time calibration should use test completions and player data. The current generator is otherwise unchanged.

## Checks performed
- JavaScript syntax: game, Pipe Shift, Pipe Engine, daily journey, Dot Trails engine, levels and service worker.
- All 42 campaign puzzles generated and evaluated against their solved boards.
- 32 Free Play samples across four difficulties and both goals.
- 1,590 three-square hint selections across difficulties, objectives and positions, plus one-square and full-grid checks.
- HTML IDs, CSS hooks and PWA asset version references checked.
- **Still required on an actual device:** iOS swipe-back in Pipe Shift menu, submenus and gameplay; hints/credits/timers; Dot Trails completion display; offline PWA refresh.
