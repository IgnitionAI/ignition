# Restore specified learned-race contact semantics

Analysis: #9 explicitly requires arcade vehicle collisions shared with training; #14 requires observable contacts/penalties. LearnedRace hardcodes ghost=true and garage advertises ghost racing. This is a narrower product behavior than the approved spec, even though the underlying RaceWorld contact solver and trained contact policies exist.

Desired: learned AI and player races use the canonical contact protocol, without rule-policy fallback. Preserve nine-action physics, separately frozen policy copies, pre-step observations and existing countdown/lap/ranking rules. Remove UI statements asserting cars pass through one another. Ghost remains an explicit low-level fixture option for existing reports; do not relabel archived results.

Implementation: replace the obsolete boolean-only ghost test with a public LearnedRace contact regression that positions its public cars in overlap, advances the actual loaded policies and asserts separation/contact accounting and unchanged weights. Prove red before switching construction to canonical contacts. Reconcile affected public simulation comparisons using the full canonical RaceWorld where contacts are relevant; do not weaken identity/shared-clock physics invariants. Exercise real race progression and report successes/failures honestly.

Acceptance: learned AI and player sessions resolve vehicle overlap with contact metrics; snapshots stay unchanged; owner/sibling tests, types/build pass; browser garage states contact rules and real learned course runs. Existing policy failures do not justify silently restoring ghost mode; evaluate/training follow-up remains in scope until full racing acceptance is achieved.

Out of scope: inventing new physics, retraining based on held-out selection, changing archived contact/ghost benchmark interpretation or claiming a keyboard race from API-only coverage.
