# Grid Club · Dot Trails v0.3

A playable, installable **web app** for Windows Chrome and iPhone Safari/Home Screen. No Mac or Xcode needed for this prototype. This is not yet a native App Store submission.

## What's changed since v0.2

- Dot Connect is now **Dot Trails**. The game description explicitly says **connect**.
- Free Play difficulty buttons: **Easy 5×5**, **Medium 7×7**, **Hard 9×9**, **Expert 11×11**.
- Daily challenge: an **11×11** puzzle, identical for anyone playing on the same UTC date. The daily puzzle generator tests several candidate layouts and keeps the more winding one; this does not guarantee that all players find it harder than Expert.
- More varied levels generated from complete winding paths. Every level has at least one full-board solution; **uniqueness and calibrated difficulty have not yet been verified**.
- If you lift your finger or mouse midway through a line, it **stays put**. Restart at the line's open end to continue it.
- Once all dots are connected but the grid isn't filled, the message says exactly: **“Oof, nice work, but all squares need filling”**. You can keep editing.
- A prominent **Next puzzle** button appears after each completed Free Play puzzle. Difficulty remains selected.
- Fixed colours for nine dot pairs, updated help text, and a clearer loose-end marker.
- Completion statistics are stored in the device's local storage. There are **no live credits, advertisements, accounts or server sync** yet. The credits wallet is only a future-compatible data structure.
- New v0.3 offline service-worker cache and network-first update behaviour.

## Publish v0.3 to your existing GitHub Pages site

You already have a repository at `https://github.com/grid-club-preview/grid-club-preview` and a live Pages address:

`https://grid-club-preview.github.io/grid-club-preview/`

1. Unzip `GridClub-Web-PWA-v0.3.zip` on your Windows laptop.
2. Open your existing repository in GitHub. Choose **Add file → Upload files**.
3. Upload the **contents of the unzipped folder**, not the ZIP itself or the outer folder. Place `index.html`, `game.js`, `puzzle.js`, `sw.js`, `manifest.webmanifest`, `.nojekyll` and `PUBLISH_FROM_WINDOWS.md` in the **repository root**. If GitHub asks to replace existing files, confirm the replacement. The existing `icons` folder does not need changing because the artwork has not changed.
4. Click **Commit changes**. GitHub Pages should deploy the new files using your existing settings.
5. Open the Pages URL on Windows and check the **Dot Trails** title and **Expert 11×11** button.
6. Open the installed Home Screen web app on your iPhone. Reload it or close and reopen it. The v0.2 service worker may serve the old version on the first opening while it installs the v0.3 service worker. You may need a second launch or a fresh browser visit to see v0.3.

**Do not create a new repository or change the GitHub Pages settings.** Your current site address stays the same.

Tip: GitHub's browser uploader can be awkward when replacing many existing files. GitHub Desktop for Windows is an alternative: clone the repository, copy the new files over the old files, Commit and Push.

## Local test

- Open `index.html` with Chrome on Windows for a quick check. For the full Home Screen/offline behaviour, use GitHub Pages (`https://`), since service workers won't register for a local file.
- Play a puzzle. Stop dragging halfway through one line, then drag from its loose end to continue. Change difficulty. Complete a Free Play level and use **Next puzzle**.
- Verify the Daily challenge opens an 11×11 board.
- If a line blocks squares, tap one of its coloured endpoint dots to clear it, or use Undo/Reset.

## Automated checks

In a terminal with Node installed, inside the extracted folder run:

`node tests/engine.test.js`

This checks 400 deterministic generated boards for full-grid coverage and drawable solutions, plus pause/resume, undo, clear-line and incomplete-grid behaviour. A separate automated browser check was run on a mobile-sized viewport and the pointer controls.

## Known limitations / next phases

- The path generator guarantees *solvability*, not uniqueness or consistently human-graded difficulty. Some puzzles may have several solutions or feel unintuitive.
- Expert uses smaller touch targets. Test on the real iPhone before deciding whether to reduce to 10×10.
- The app does not save an incomplete board if you navigate back or close the app. Completion counts and the Daily solved tag are saved *locally* in the browser.
- Undo and Hint are free in v0.3. Shared Club Credits, Boosts, time-limited challenges, disappearance mechanics and accessible number/letter markers are planned, not implemented.
- No ad SDK or personal-information collection is bundled in this prototype.
- For eventual App Store submission, an iOS package, device testing, privacy work and an Apple Developer membership will be required.
