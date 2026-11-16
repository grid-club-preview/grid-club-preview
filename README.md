# Grid Club v0.4b beta — Dot Trails

Focus: **Daily Challenge + Play Random**. Numbered levels and time-trial medals deliberately postponed.

## New in this candidate

- Play Random with Easy/Medium/Hard/Expert (5×5 / 7×7 / 9×9 / 11×11).
- Daily Challenge remains 11×11, fixed per UTC day.
- An optional Supabase-backed anonymous daily leaderboard foundation. Assisted and Unassisted groups with average/median times and faster/fewer-moves comparison. Usernames not required.
- Server replays submitted move logs using the same deterministic puzzle generator. Server-timed attempts; one attempt per anonymous identity and day; improbable <20 second results queued for review.
- Offline achievements preserved locally, but offline attempts may be ineligible for rankings.
- Daily completion offers Try Free Play **and** Return to Grid Club.
- Shorter Start / Continue labels, additional top safe-area spacing, grid controls placed directly beneath the grid, incomplete-grid warning dismisses on the next grid press.
- Existing PWA pause, partial hints, saved progress, and optional numbered dot labels preserved.
- No live advertising, Club Credits, username form, payment flows or numbered levels.

## Running it

Publish the static files to the existing GitHub Pages repo. Read **SETUP_BACKEND_WINDOWS.md** for the optional backend deployment, which requires your own Supabase project.

The default `backend-config.js` is intentionally blank, so the game runs locally and no online leaderboard is connected by accident.

## Automated checks

Run from the unzipped project folder:

```sh
node tests/engine.test.js
node tests/navigation.test.js
node tests/v04a.test.js
node tests/server-replay.test.js
```

These do **not** establish that the production backend or a specific iPhone build works. Test both after deployment.
