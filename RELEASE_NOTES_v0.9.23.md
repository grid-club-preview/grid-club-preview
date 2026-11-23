# Grid Club v0.9.23 beta

## New: Fill your vault
- Dot Trails and Pipe Shift completion screens now show an interactive vault when credits are awarded.
- Hold the button to animate coins into the vault and increment the displayed balance. Release to pause, then hold again to resume.
- One uninterrupted hold completes in **1.65 seconds**, below the requested two-second maximum.
- Credits are already persisted before the animation starts; skipping it or leaving never forfeits rewards.
- Reduced-motion settings skip the animation and immediately show the final balance.
- Existing daily, level and level-up award amounts are unchanged.

## Pipe Shift campaign redesign
- Campaign levels now contain **varying, predetermined numbers of stages**. The number remaining is concealed: only completed stages and the next playable stage are listed.
- Puzzle header: **Level N** prominently, **Stage N** secondarily, without a denominator.
- Every campaign stage now displays an objective badge and a tap-to-reveal explanation. Trial intro screens repeat the objective.
- Levels use clearly-defined **Connect using any pipes** or **Connect using all pipes** goals. All-pipes goals are enforced by the engine; unused decoy pipes are converted to movable blank blocks to avoid hidden optional pipes.
- Higher levels use longer, essential-pipe-weighted scrambling. Level 5 now starts with considerably more displaced working pipes; its closing stages use dense, interconnected networks.
- The final two stages of the highest levels remain untimed endurance puzzles with unlimited moves.
- The private-beta campaign catalogue is now v8. **Only Pipe Shift campaign progress is reset**. Free Play progress, daily results and the shared Club Credits ledger are preserved. New campaign rewards use versioned ledger IDs.

## Checks
- All 42 campaign stages generated, validated and replayed using legal solution moves.
- All all-pipes goals validated, including absence of secretly optional decoy pipes.
- 32 Free Play samples (four tiers, two objectives, four seeds) replayed successfully.
- Vault module exercised with simulated pointer hold, release, resume, and completion.
- Syntax checks for all changed JavaScript files; PWA resources and cache version aligned.
- Includes a repeatable `node tests/pipe-campaign-v8.test.js` regression test.

## Remaining device testing
The iOS home-screen web app still needs manual verification for layout and gestures, the hold interaction, the stage surprise, the campaign wipe, and difficulty calibration. In particular, no procedural test can substitute for measuring how many moves real players need on the revised Expert stages.
