# Grid Club · v0.4a.4

**Dot Trails mobile web app · navigation / accessibility bug-fix release**

This is a replacement for v0.4a.2 and the unshipped v0.4a.3 development patch. It continues to run on GitHub Pages and can be installed on an iPhone Home Screen. It is not yet an App Store app.

## What changed in v0.4a.4

- **New screen flow:** Grid Club Home → Dot Trails → choose Easy (5×5), Medium (7×7), Hard (9×9), or Expert (11×11) → Free Play. The difficulty buttons are **no longer inside the puzzle**. Daily Challenge remains accessible directly from Home and remains 11×11.
- **Back navigation:** Back during Free Play goes to the difficulty picker; Back there goes Home. Back during the Daily Challenge goes Home. None of these actions opens Pause or a confirmation. Unfinished puzzles are saved silently, separately for each size.
- **Explicit Pause only:** Pressing the Pause button hides the whole puzzle and stops the timer. **Continue** resumes; **Return to Grid Club** actually returns Home. Switching apps or tabs silently freezes and resumes the timer without creating a Pause screen. If the user manually paused, that state stays paused until **Continue** is pressed.
- **Accessibility numbers:** A small **123** button directly **below the grid** toggles number labels on matching dots. Numbers default to OFF, and the preference is remembered for the current website/app storage area. Labels also work with 10+ pairs. The toggle does not affect moves, ranking status, or elapsed time.
- **Caching:** Versioned script URLs and a new service-worker cache name reduce the chance of the old v0.4a.2 code continuing to run after an update.

## Existing game features retained

- Free Play 5×5 / 7×7 / 9×9 / 11×11, fixed 11×11 Daily Challenge, seeded solvable puzzles with variable pair counts.
- Draw paths in multiple finger/mouse gestures by lifting and resuming from a loose endpoint.
- Partial hints, undo, reset, and New Puzzle (in Free Play); the exact incomplete-grid warning.
- Local saving of unfinished puzzles and completed achievements; no backend or live rankings yet.
- Completion phrases, Assisted/Unassisted flags, and placeholder banner-ad space. No real advertising or purchased credits.

## Existing save data

This release preserves `gridclub-progress-v04a`, `gridclub-stats-v1`, `gridclub-dottrails-show-numbers`, and the existing Daily Challenge puzzle seed. Do not delete your browser data merely to refresh the game: that could erase saved progress and achievements. Safari, Chrome, and an installed Home Screen web app may use separate storage.

## Tests

From this folder with Node.js 20+:

```shell
node tests/engine.test.js
node tests/v04a.test.js
node tests/navigation.test.js
```

Tests cover 400 seeded boards, solution validity, save/pause/restart integrity, new menu navigation, silent backgrounding, explicit pause, and drawing of the optional numeric labels. A Chromium mobile-viewport smoke test also exercised the chooser, game, pause/continue, number toggle and Back without JavaScript errors. **The actual installed iPhone Home Screen app still needs to be checked by the user.**

## Deliberately not yet implemented

Online leaderboards, verified results, automatic uploading of offline attempts, shared Club Credits, countdown Daily Challenges, Block Slide and advertising. The game can store a local achievement while offline but cannot yet upload it.
