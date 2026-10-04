# Restore required vehicle contacts

Source implementation: interactive learned AI/player races now construct the canonical contact RaceWorld rather than forcing ghost mode. Garage copy and README describe active vehicle/barrier contacts and penalties. No weight, driving equation, checkpoint or archived protocol is changed. Explicit ghost fixtures remain available.

Review scope: this restores the collision behavior explicitly required by #9/#14; it does not establish the whole racing product's acceptance. Source/spec review of this change: PASS. Repository standards: PASS.

A public LearnedRace regression positions its real cars in overlap and advances actual loaded policies. Before repair both AI/player cases fail on separation; after repair both resolve separation, count contacts and preserve complete policy weights. The prior boolean ghost-flag assertion was replaced with observable behavior. The shared-clock test compares every player state with the full canonical two-car RaceWorld plus the real independently loaded opponent policy. Acceleration is checked before contacts/turns may reduce speed; braking and identical states remain checked throughout. No private seam or fake policy is used.

Owner/sibling proof: 70 Circuit tests PASS (`all-tests.txt`), no-emit TypeScript PASS, production Vite build PASS (`build.txt`). The two-driver full API race finishes three laps with fixed weights. This is API evidence, not proof of a keyboard player finish.

Chromium on localhost:4174 uses the newly built assets. Garage advertises contact rules; a genuine two-policy race starts through its button. Loading state is visible (`start.png`). Changing camera to the second driver updates its selected value, viewpoint and standing HUD (`camera-change.json`, `camera-second-driver.png`). Screenshots were displayed inline and visually inspected. Course elapsed time advances on the same retained page; no restart was performed.

Retained browser race finishes: bundled-29 103.27 s, bundled-11 115.40 s, both three laps. Result screen identifies both checkpoints, ordering and selected camera; selected driver has zero rescues/penalties (`results.json`, `results.png`). Screenshot displayed inline and inspected. This verifies the source correction and real two-policy contact race.

Pending: additional four-car/camera/garage recipes and the full three-lap keyboard player-versus-trained-driver acceptance. Broader issues remain open. These source changes and evidence must be delivered through the consolidation PR after the applicable verification is complete.
