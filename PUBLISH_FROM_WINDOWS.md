# Install the v0.4a.4 update from Windows

Your existing GitHub Pages site stays the same:

- Repository: https://github.com/grid-club-preview/grid-club-preview
- Website: https://grid-club-preview.github.io/grid-club-preview/

## What to upload

1. Unzip `GridClub-Web-PWA-v0.4a.4.zip` on your Windows laptop.
2. Open the **existing** GitHub repository. Do not create a new repository.
3. Replace the root-level **`index.html`**, **`game.js`** and **`sw.js`** with the files of the same names from this update. Commit those three replacements. If GitHub's web uploader doesn't replace an existing filename, edit the repository files or use GitHub Desktop for Windows to commit the three replacements.
4. **No need to re-upload** `puzzle.js`, `manifest.webmanifest`, `.nojekyll`, the icons folder or `tests` since these game assets are unchanged. You may upload the README as documentation, but it isn't necessary to run the game.
5. Open the public site in your laptop browser and check the footer reads **Prototype v0.4a.4** when you start a game.
6. Close and reopen the installed Grid Club Home Screen app on your iPhone. If you still see the old version, refresh the public URL in Safari and reopen the Home Screen app. Service-worker updates can take another navigation. **Do not clear website data** just to force an update unless you're prepared to lose local progress.

## Manual checks on your iPhone

1. Home → Dot Trails should show **four difficulty cards**. Tap Expert to play 11×11.
2. Scroll just below the grid and tap **123**. Numbers should appear on both dots of each matching pair. Tap again to hide them, then reopen the game to confirm your choice stays set.
3. Tap Pause. It should hide the puzzle. **Continue** should restore it. Pause again, then tap **Return to Grid Club**; you should reach Home directly.
4. Open a Free Play board and tap Back. You should reach the **difficulty menu**, not Pause. You can open another difficulty and come back to the first one. Each unfinished puzzle is preserved.
5. Open the Daily Challenge from Home, then tap Back. You should go directly Home, without Pause.
6. During a puzzle, switch to another app and back. Your clock should not run while Grid Club is in the background, and **no Pause screen should appear**. If you explicitly pressed Pause before switching, it should remain paused until you choose Continue.

## Still under development

Real leaderboard uploads are not yet live, and offline achievements saved locally are not verified official results. The 66-pixel banner slot is only a placeholder. Countdown Daily Challenges and Club Credits are planned for later updates.
