# Grid Club v0.9.29 beta · Word Rescue alpha

## Third playable Puzzle Deck game
Introduces **Word Rescue**, a self-contained, playable word-survival prototype under the existing public **Grid Club** branding. Future character and publishing identities remain intentionally unannounced.

The player is stranded above shark-infested water. Use seven letter tiles to create valid words of **three to seven letters**. Each letter adds **one building block**, and the goal is to construct **24 blocks** before the rising water catches the character or the **90-second** round timer expires. Longer words earn more points: length squared.

**Modes**
- **Rising Tide:** The water rises continuously while the tray remains intact. Each submitted word replaces its used letters.
- **Sinking Letters:** The water still rises, but one tile also disappears every seven seconds. Any valid submitted word refreshes consumed and submerged letter slots.
- **Reshuffle:** Replaces the full tray with a known-playable combination, costing **six seconds** in either mode.

The engine is standalone and offline-capable. There are more than 3,000 hand-curated common prototype dictionary words and 60+ deterministic rack seed patterns. Every starting tray contains a real supported word. Invalid, repeated and too-short words do not add blocks. Word validation is **local** and is not production-grade or a comprehensive British-English lexicon yet.

## Shared Club Credits
The first successfully completed Word Rescue run in **each mode per UTC day** awards **2 Club Credits** via the same device-local, idempotent wallet ledger as Dot Trails and Pipe Shift. Replaying the same mode that day is still allowed but grants no additional award. There are no purchased credits, ads or real-money systems in the game.

## Navigation and state
- Added a third live tile to the main **Puzzle Deck** section without changing the separate Arcade roadmap, the Words Down placeholder or the Grid Club beta branding.
- Word Rescue has its own game menu, mobile artwork/layout, letter selection, selected-word preview, score and progress, clear success/failure states and a local best time for each mode.
- Returning from a game saves the incomplete run. Continuing restores letters, word history, tower, remaining time and the mode. The timer pauses whenever the page is hidden.
- No network dependency, backend changes, ranked leaderboard or daily challenge for this prototype.

## Regression checks
- Tested **160 deterministic seed/mode pairs**, dictionary acceptance, letter selection and replenishment, drowning, the disappearing-letter mechanic, successful completion, no post-game scoring.
- Tested game entry, 7-tile UI rendering, submitting a word, pause/continue and return-to-home with isolated DOM fixtures.
- Checked all new HTML IDs, PWA cache references and JavaScript syntax.
- Existing Dot Trails and Pipe Shift gameplay code untouched.

## Next iterations
Play-test game pace and water rise, refine character/scenery, expand the English dictionary and decide on varied hazards (sharks, bears, lions, lava), Daily Challenges and leaderboards. The unreleased future app name remains private. This preview uses **Word Rescue** as a provisional game title.
