# Grid Club v0.4b.1: Home version label and leaderboard diagnostic

This is a **small patch** over v0.4b beta. It does not alter your puzzle progress, daily seed, SQL or deployed `daily-api` function.

## Public GitHub Pages repository (`grid-club-preview`)

Upload and replace **only** these four files in the repository root:

- `index.html`
- `game.js`
- `ranked.js`
- `sw.js`

**Keep your existing edited `backend-config.js`** and existing `puzzle.js`, `manifest.webmanifest`, icons. Do not overwrite your backend configuration with the blank v0.4b sample. Do not upload any database password, `service_role`/secret key, or Supabase access token.

## Private development repository (when created)

Keep the complete source, `tests/`, `supabase/sql/`, and `supabase/functions/` here. Do not upload these to the public deployment repository. Passwords and private credentials belong in protected secrets, **not even in the private repository**.

## Testing in Windows Chrome

1. Open the GitHub Pages site after GitHub Pages finishes deploying. Check **v0.4b.1** at the top right of Home. If an older version appears, reload the page (or close/reopen the installed iPhone web app after a moment).
2. Tap **Test connection** on Home. This makes an actual `stats` request to `daily-api` after anonymous authentication, even if the Daily Challenge is already solved. The diagnostic shows success or an error.
3. If **Not configured**, verify the *published* `backend-config.js` contains the project URL and a **public** publishable/anon key. Do not send keys in screenshots.
4. If **Missing SDK/Unavailable**, check that `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js` loaded, with no blocker or offline problem.
5. If sign-in fails, confirm Supabase **Authentication → Providers → Anonymous Sign-Ins** is enabled.
6. If the function returns 401/403, inspect **Supabase → Edge Functions → daily-api → Logs/Invocations**, check authorization, and ensure the user JWT is sent.
7. If it returns a SQL/RPC error, confirm `supabase/sql/001_leaderboard.sql` ran successfully in SQL Editor.
8. If the connection is successful but your Daily Challenge does not create a ranked attempt, it may already be solved/saved or partially completed from before the leaderboard was enabled. Do **not** clear browser data: it would delete local progress. Test a fresh daily on the next UTC date, or use an isolated test browser profile if needed.

The button is a **beta diagnostic**, not evidence of a verified competitive result. The `stats` request checks the service is reachable; only a new eligible daily attempt followed by a validated submission enters the official results.

## Checks

From the original v0.4b-beta folder, run `node tests/engine.test.js`, `node tests/navigation.test.js`, `node tests/v04a.test.js` and `node tests/server-replay.test.js`. This patch doesn't change the engine or SQL. Test the deployed patch on your iPhone before relying on the result.
