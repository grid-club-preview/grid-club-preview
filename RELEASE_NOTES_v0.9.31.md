# Grid Club v0.9.31 beta · Word Rescue vowel protection and raft baseline

## Bug fixes
- After successful word submission, replenished racks now **always contain at least one visible A/E/I/O/U vowel**. Other letters remain randomized, and the game still checks whether a valid word can be made. Applies to both Rising Tide and Sinking Letters.
- Sinking Letters will not remove the last remaining vowel. If more than one vowel is present, any vowel may still sink, as before.
- When an unfinished Word Rescue attempt from v0.9.30 is resumed, a vowel-free rack is automatically repaired while preserving score, built blocks, elapsed time and previously played words.
- The starting **sea surface is aligned with the wooden raft**, removing the visual gap. Initial water height changes from 8% to the raft's 22% baseline, and the loss threshold moves by the exact same 14 percentage points. This **preserves the original survival pressure** rather than making the game suddenly harder.

## Design discussion, not yet implemented
- Next visual/gameplay design direction: **build a raft horizontally** using word-earned planks, rather than a tower of blocks. This deserves coherent graphics and rule changes, not just renaming the existing vertical stack. V0.9.31 fixes the current floating-platform gap first.

## Verification
- All previous engine, UI, plural and dictionary tests still pass.
- New regression tests across 160 seeded rounds check vowel presence after refills, reracks, letter erosion and old-run repair.
- Verified the waterline-to-failure difference at multiple times and block counts is unchanged by repositioning the initial sea.
- Bumped PWA assets to v0.9.31, retaining Grid Club public branding and the offline 97k-word dictionary.
