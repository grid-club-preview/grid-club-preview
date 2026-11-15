# Update Grid Club to v0.4a using Windows + GitHub Pages

Your live address stays: https://grid-club-preview.github.io/grid-club-preview/

Your existing repository: https://github.com/grid-club-preview/grid-club-preview

### Upload this update

1. Unzip `GridClub-Web-PWA-v0.4a.zip` on Windows.
2. Open the **same repository** in GitHub; do not create a new one.
3. Replace the **root** versions of **`index.html`**, **`game.js`**, **`puzzle.js`**, **`sw.js`**, and **`manifest.webmanifest`** with the five files from the v0.4a folder. Optionally update `README.md` and `PUBLISH_FROM_WINDOWS.md` for reference.
4. You do **not** need to upload `tests/`. You also do **not** need to re-upload the existing `icons/` folder, as its images are unchanged.
5. Commit the changes. GitHub Pages will deploy as before. If GitHub's browser uploader struggles with overwriting multiple files, use GitHub Desktop for Windows to replace the files locally, then commit and push.
6. Open the Pages address in Chrome and verify that the footer reads **Prototype v0.4a**.
7. Close and reopen the installed Grid Club Home Screen web app on your iPhone. A previous service worker might still serve the old version on the first launch; repeat the launch if necessary. If it remains stale, visit the live URL in Safari and reload it once.

### Quick manual test plan

1. Start Free Play, draw half a line, lift your finger, and continue from the loose endpoint.
2. Tap **Pause**. The board disappears and the timer should stop. Tap Resume.
3. Draw part of a line, return home, and open Free Play again. The same unfinished board should reopen with its timer still paused.
4. Switch difficulty, play a few moves, and switch back. Each size should retain its own most recent unfinished puzzle.
5. Use **Hint**. A short dashed route should appear temporarily without automatically modifying your coloured lines.
6. Switch to Daily Challenge. Confirm the larger 11×11 puzzle now has variable numbers of pairs on different days (some boards show numbered dot pairs).
7. Complete a puzzle and inspect the rotating success message and **Assisted/Unassisted** label. Note that leaderboard syncing is not live in v0.4a.
8. For offline testing, launch the installed web app once while connected, then switch the iPhone to Airplane Mode and start it again. Complete a game and check the saved-achievement notice. The service worker is intended to keep the installed app playable offline once the initial files have been cached. Test it on your real device.

### Ads and accounts

The 66px area beneath the puzzle buttons is a **future layout slot only**. It does not load advertising or collect data. A real banner will require an ad platform integration, privacy and consent controls, and further testing on narrow iPhones. No user information or purchases are transmitted in v0.4a.

### If something goes wrong

Leave the current web app installed and refresh the GitHub Pages URL in Safari. Existing saved statistics belong to the same origin and are not deleted by this update. Do not clear website data to force an update unless you are willing to lose locally saved achievements.
