# Grid Club v0.9.32 beta · Word Rescue dual-threat escape modes

## Three gameplay scenarios
- **Rising Tide:** Build a **vertical tower** out of word-earned blocks and stay above the rising water. Drowning is the sole threat. Water rises at the existing tested rate.
- **Raft Escape (new):** Build **horizontally**, plank by plank, toward shore. The waterline stays fixed; a shark approaches as time passes. New valid words extend the raft and buy distance from the shark. If it reaches Gridda, the run fails. A full **24-plank** raft wins.
- **Sinking Letters:** Retained as a harder rising-water variant; one unprotected letter disappears every seven seconds, and the last vowel remains guaranteed.
- The existing common English dictionary and automatic letter replenishment work in all three modes.

## Gridda's danger-responsive animations
- Gridda remains large in the scene, with waving and jumping at low danger.
- As water closes in or the shark approaches, her movement becomes continuously faster, with increasing side-to-side movement, waving and frantic flailing.
- Changes in danger state (calm → worried → panicking → frantic → rescued/caught) depend on the live threat and ease back when a valid word creates more safety.
- Rising Tide hides the shark; Raft Escape shows a pursuing shark and a shore destination. Raft planks visibly extend horizontally.
- Respects reduced-motion preferences.

## Word submission and progress clarity
- The central progress display counts down: **“24 blocks to safety” → “23 blocks to safety”** for tower modes, or **“24 planks to safety”** for Raft Escape.
- The letter tray, selected word, undo/reshuffle and **“Build with this word”** button are in a fixed bottom dock respecting iPhone safe-area insets. This addresses the submission action previously being below the screen on iPhone 17.
- The scene remains substantial but responds to short screens. Results and local personal bests are now mode-specific.

## Dictionary refinement
- **SHU** is excluded from playable words despite being present in some broad dictionaries. It has a niche dictionary meaning but is absent from standard UK/US Scrabble word lists, and Sam questioned its suitability.
- The previously bundled **97,000+ word list** is retained for broad coverage. This single reviewed exclusion is not yet a comprehensive professionally curated word-game dictionary.

## Club Credits and compatibility
- Ordinary Word Rescue modes remain **Free Play without Club Credit earnings**. Any future rewards are for Daily Challenges only.
- Existing saved Rising Tide/Sinking Letters games, credits and records remain intact. Raft Escape gets its own local best-time record.
- Other Grid Club games are unchanged. All web assets remain offline-cacheable via the v0.9.32 service worker.

## Verification
- Existing word logic, 160 seeded-trial tests, vowel protection and offline word validation still pass.
- Additional **210 seed/mode combinations** verified. Tested shark pursuit and reprieve on word submission, static raft water, rising tide drowning, Sinking Letters erosion, 24-plank win, invalid SHU, iPhone input dock, and no free-play credits.
- DOM integration test completes Raft Escape through the actual letter controls and verifies **“0 planks to safety”** on victory.
- The new mobile layout and animation should be visually checked on an iPhone 17 before final polish.