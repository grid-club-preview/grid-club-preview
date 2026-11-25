# Grid Club v0.9.30 beta · Word Rescue polish

## English vocabulary and plurals
- Replaced the incomplete 3,172-word prototype vocabulary as the sole validator with a **bundled public-domain English lexicon**: 97,109 alphabetical entries of 3–7 letters, supplemented by the original curated words.
- Supports regular plurals, endings like `-es` and `-ies`, and common inflected forms already present in the source dictionary. Examples checked include *cats, dogs, sharks, beaches, houses, wolves, words, saving, quickly*.
- The list is a same-origin `word-rescue-lexicon.js` asset loaded **before** the engine and pre-cached for offline PWA play. It does **not** depend on a web request during the first game.
- Upstream: [dwyl/english-words](https://github.com/dwyl/english-words), `words_alpha.txt`, [public domain licence](https://github.com/dwyl/english-words/blob/master/LICENSE.md). Only `A–Z` words of length 3–7 are included. A small proportion of obscure words is expected in the beta dictionary; no scoring changes.
- Words longer than seven characters remain outside the seven-letter tray rules.

## Larger animated rescue scene
- Increased the scene from **258px** to a responsive approximately **340–490px** on most phones (smaller devices minimum 325px), making the threat and tower central to the experience.
- Replaced the small emoji explorer with a larger **custom SVG character**, waving and jumping while safe, speeding up as danger approaches, and flailing when the water nears her. Includes distinct win/loss reactions and reduced-motion support.
- Tightened margins and status presentation around the larger scene. The shark, waterline, controls and progress remain in the game.

## Timer and rewards
- There is now **only one failure condition**: the water reaches the character. The competing hard 90-second timeout has been removed; the clock shows **elapsed time** to support records.
- The original rising-water speed has been retained for initial comparison, and Sinking Letters still loses one letter every seven seconds.
- **Regular Word Rescue runs no longer award Club Credits.** A future Daily Challenge will be the way to earn credits in this game. Existing credits previously awarded to beta testers are left untouched.

## Compatibility and validation
- Saves from v0.9.29 remain readable; no reset of prior records or wallet.
- Deterministic board/word-selection, valid/invalid words, new plurals, falling letters, waterline failure, score, game continuation and navigation tested.
- Added `tests/word-rescue-v030.test.js` and `tests/word-rescue-offline-v030.test.js`.
- PWA cache upgraded to `gridclub-pwa-v0.9.30` with the bundled lexicon, keeping the public **Grid Club** identity.
- New layout and animations should still be checked visually on iPhone for viewport fit and touch reachability.