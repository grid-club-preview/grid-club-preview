# Grid Club v0.9.26 beta: visible game roadmap

## Home page
- Added a **Puzzle Deck** grouping with two existing playable entries (Dot Trails, Pipe Shift) and three visually distinct, **noninteractive** planned-game cards (Block Shift, Grid Flip, Words Down). They are not buttons and cannot accidentally launch an unfinished prototype.
- Added a separate **Arcade** grouping with two planned entries: Starting Grid and Towers (working title).
- Restyled the roadmap as compact two-column cards to retain usability on iPhones; full-width cards remain for playable games.
- Moved the expandable **Connection diagnostics (beta)** beneath both game sections.
- Updated the home headline from “A little puzzle break.” to **“A pocketful of challenges.”**
- Kept the existing **Grid Club** app/browser title, icons, manifest and saved-data identifiers intact while brand naming remains under discussion. Names being considered include **Griddi** and **Puzzleful**. This release is not a brand migration.

## Quality checks
- Confirmed both existing game entry IDs remain unchanged, all five upcoming games are noninteractive article elements, home sections are correctly ordered, and diagnostics appears last.
- Confirmed all JS syntax, DOM IDs referenced by both games, uniqueness of HTML IDs, HTML-to-PWA cache assets and v0.9.26 cache key.
- Added `tests/home-roadmap-v026.test.js` to protect the home roadmap while subsequent games are built.

This is a navigation and presentation-only release. No existing gameplay, progress, ranked result or Club Credit data is changed.
