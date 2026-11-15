# Grid Club v0.4a · Dot Trails

**Installable web puzzle prototype**, playable in Chrome on Windows and as a Home Screen web app on an iPhone. This is a feature upgrade to v0.3 for the existing GitHub Pages site, not an App Store build.

## What's new

- Dot Trails: Easy 5×5, Medium 7×7, Hard 9×9, Expert 11×11; an 11×11 daily puzzle.
- **Variable pair counts** on generated puzzles. 11×11 now uses 9–12 pairs rather than always 9. Dots get small number labels when there are more than 9 pairs.
- **Free pause**: hides the whole game, stops the timer; reopen the screen by choosing Resume. Backgrounding the app automatically pauses it.
- **Unfinished game saving**: the board, drawn and partially drawn lines, undo history, elapsed playing time, moves, hints and resets are saved locally. Continue from the same device. One saved Free Play game per size and one current daily challenge.
- **Partial hints**: preview up to 5 cells on a known full-board solution for 9 seconds. No paths are automatically drawn or erased. If you've connected all pairs but haven't filled the grid, the preview suggests a connection to rethink.
- **Varied completion headlines**, with some context-aware phrases and suppression of recent repeats. “Oof, nice work, but all squares need filling” is retained.
- **Local achievement records**: time, moves, hints, resets, puzzle ID, assistance status and queued *unverified* results. These are not currently submitted to any server.
- **Offline feedback**: the game acknowledges locally saved results and explains that leaderboard submission is not yet active.
- **Ad layout reservation** beneath gameplay controls, with no advert, tracking SDK or network included.

## Important limitations

- **No backend or genuine leaderboards in v0.4a.** Results are saved locally for future integration; they are not automatically sent online when the device reconnects. When v0.4b is designed, offline results will need independent verification and might not be eligible for official competitive rankings.
- **No user accounts, credit purchases or advertisements**. Boosts and Club Credits have not been activated. A username is not required for this prototype.
- Data lives in this browser/web-app's local storage, and can be lost if website data is cleared or the app is deleted. Local storage is not a permanent backup and might not be shared between Safari, Chrome and the Home Screen installation.
- A hint shows part of **one valid generated solution**, not necessarily the only solution. It may not be consistent with the player's alternative valid route.
- The puzzle generator guarantees at least one full-grid solution, but does not guarantee uniqueness or calibrated human difficulty.
- The daily algorithm changed in v0.4a, so the same day's board can differ from v0.3. Everyone using v0.4a on the same UTC date receives the same new board. Competitive leaderboards must identify the specific puzzle version.
- Unfinished v0.3 boards were not saved by that release, so they cannot be recovered. Existing v0.3 completion statistics are retained under the same storage key, where available.
- Pause is free, undo and resets do not wipe elapsed time or cumulative moves, and using hints marks a result as **Assisted**.

## Development tests

Run in Node 20+:

```sh
node tests/engine.test.js
node tests/v04a.test.js
```

The second suite checks 400 deterministic puzzles, variable pair counts, hints, freeze/resume/save/restore and fair-play counters. The interface was exercised in a simulated mobile browser, including a completed puzzle and local results recording. It has **not been verified on the user's actual iPhone** yet. Real service-worker offline/reconnect behavior requires testing after GitHub deployment.
