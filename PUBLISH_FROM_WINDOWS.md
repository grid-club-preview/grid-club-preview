# Deploying Grid Club v0.4b beta from Windows

1. Unzip the package.
2. Upload and replace the root game files in `https://github.com/grid-club-preview/grid-club-preview`:
   - `index.html`
   - `game.js`
   - `puzzle.js`
   - `sw.js`
   - `ranked.js` **new**
   - `backend-config.js` **new**
3. Keep the existing `icons/` folder and `manifest.webmanifest`. You do not need `tests/`, `supabase/` or the Markdown guides on GitHub Pages.
4. Commit changes. The existing Home Screen web app will update when the PWA service-worker cache refreshes; fully close and reopen it if necessary.
5. The game works offline and in Free Play even if `backend-config.js` is blank. To turn on the **experimental** live leaderboard, follow `SETUP_BACKEND_WINDOWS.md` to set up Supabase first.

**Do not upload secrets or database passwords to a public GitHub repository.** The only key in `backend-config.js` must be the public publishable/anon key.
