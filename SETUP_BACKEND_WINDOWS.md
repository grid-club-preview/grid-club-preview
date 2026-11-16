# Grid Club v0.4b beta: connect the daily leaderboard from Windows

The ZIP contains both the web app and the **optional, un-deployed** Supabase backend. None of the leaderboard is live until you create and configure a Supabase project and deploy the Edge Function.

## What is live without the backend?

- Play Random: Easy 5×5, Medium 7×7, Hard 9×9, Expert 11×11
- Daily Challenge (same UTC-dated 11×11 puzzle for everyone)
- Local completion records, pause, offline gameplay, hints, and saved unfinished puzzles
- New UI: navigation labels `Start` / `Continue`, controls under the grid, temporary incomplete-grid warning, return-home button on the Daily results screen, extra space under the iOS status bar

## Step A — Create a Supabase project

1. Create an account at https://supabase.com and create a new project. Choose an EU region if appropriate. Keep your database password private.
2. Go to **Authentication → Providers** and enable **Anonymous Sign-Ins**. This creates anonymous authenticated player IDs with no username or email form. Configure CAPTCHA/rate limits before opening the leaderboard to a large public audience.
3. Open **SQL Editor → New query**. Paste and run `supabase/sql/001_leaderboard.sql`. This creates a tightly restricted attempts table and server-only functions. Verify it succeeds without errors.
4. In **Project Settings → API Keys** copy the **publishable** key (or legacy **anon** key if you still use that version). Copy the project URL from its corresponding settings page. **Never copy a secret/service_role key into the GitHub files.**

## Step B — Deploy the backend from Windows

1. Install Node.js LTS from https://nodejs.org if it isn't installed already.
2. Open Windows PowerShell in the unzipped v0.4b folder.
3. Run:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REFERENCE
npx supabase functions deploy daily-api
```

The function sources are `supabase/functions/daily-api/index.ts`, `supabase/functions/_shared/puzzle.js`, and `supabase/functions/_shared/replay.js`. The `supabase/config.toml` file leaves platform JWT verification enabled.

Keep secret API keys server-side. The function reads them from Supabase's managed environment variables. If your project uses a different API key configuration, consult Supabase's current Edge Function authentication documentation.

## Step C — Configure the web app

Open `backend-config.js` in Notepad and enter only these **public** values:

```js
window.GRIDCLUB_BACKEND = {
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  publishableKey: "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY"
};
```

Do not put database passwords, access tokens, or service/secret API keys here. GitHub Pages is public.

Upload these eight root files to the existing `grid-club-preview` GitHub Pages repository, replacing existing versions:

- `index.html`
- `game.js`
- `puzzle.js`
- `ranked.js` **(new)**
- `backend-config.js` **(new)**
- `sw.js`
- `manifest.webmanifest` (unchanged; optional)
- `.nojekyll` (unchanged; optional)

Do **not** upload the `supabase/` folder to make the game work; those are the backend sources, which must be deployed to Supabase separately. The `icons/` folder remains as it is. `tests/` is not needed on GitHub Pages.

## Step D — Test the online flow

1. Open the PWA in Safari on your iPhone, fully close/reopen once if old service-worker cache remains.
2. Open today's Daily Challenge while online. A new anonymous authentication session is created if needed.
3. Complete the puzzle. The app sends its recorded move events to the Edge Function.
4. The server regenerates the day's puzzle, replays moves, checks a full valid solution, and obtains the time from the server's attempt record, **not from a user-supplied timer value**.
5. Valid ordinary completions enter Assisted or Unassisted aggregate statistics. Abnormally short times (under 20 seconds for 11×11 in this prototype) are held for review.
6. The app should show the current number of verified completions, average/median time, and if your attempt is verified, faster-player and fewer-moves counts.

If a leaderboard attempt cannot be verified, the personal result remains saved on that iPhone.

## Fairness limitations in this **beta**

- One ranked attempt per anonymous identity per UTC day, enforced in the database. Deleting browser data can create a new anonymous identity. This is not bot-proof.
- Rank-eligible play requires connection and a successful server start before moves begin. A puzzle completed offline still counts personally, but is not guaranteed to enter the leaderboard.
- A session lost, an interrupted browser request, or an unacknowledged pause/resume may make an attempt unranked or produce a longer time. The game always remains playable locally.
- Hints are separated into Assisted. The server replays the recorded input commands, but a modified browser or someone extracting a solution from public code can still cheat. Do **not** advertise this as cheat-proof, competitive-grade timing yet.
- For public launch add server-side abuse/rate limits, managed CAPTCHA/Turnstile at anonymous sign-in, a review/moderation policy, uptime monitoring and automated end-to-end tests against a non-production Supabase project.
- Every player sees an identical puzzle for a given UTC date. When the generator is changed later, add a challenge version rather than silently rewriting historical puzzles.

## Privacy before public leaderboard rollout

Anonymous identifiers plus performance records are still potentially personal data under UK GDPR. Prepare a privacy notice identifying you as the controller, your contact method, Supabase as a processor, retention periods, deletion and data-rights procedures, and international transfers where applicable. Avoid collecting usernames, emails or IP addresses yourself unless necessary. When introducing advertising or payments, review consent and App Store rules separately.

## What hasn't been tested here

The static game and replay validator have automated tests; **the Edge Function and SQL have not been deployed to a real Supabase project in this environment**. Treat the backend as a beta scaffold until you complete the steps above and test a genuinely submitted result.
