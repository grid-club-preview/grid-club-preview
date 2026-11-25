# Grid Club v0.9.28 beta · consistent Pipe Shift tap controls

## Correction
- Removed the automatic slide when a movable pipe or blank block has exactly **one available destination**.
- **All taps now follow the same two-step action:** tap the movable tile to select it, then tap a valid empty destination to move it.
- Tapping the selected tile again clears the selection without moving or spending a move.
- Valid destinations continue to be highlighted through the existing `pipeValidDrop` styles.
- **Drag-to-move is unchanged**, including straight-line movement across empty squares.
- The fix applies to **all** Pipe Shift modes: numbered levels, Free Play, ranked Daily Challenges and practice.

## Compatibility
- No changes to generated puzzles, timed trial caps, ranked server verifier, credit balances or saved player progress.
- This prevents accidental move consumption in the newly tighter trial challenges.
- The HTML and offline service-worker cache use v0.9.28 script references.
- Added a two-tap control regression covering both single-destination and multiple-destination cases, plus deselection and drag preservation.
