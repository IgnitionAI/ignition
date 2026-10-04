# Reconcile current main into consolidation

Analysis at da54f63: GitHub reports PR #37 CONFLICTING/DIRTY. Remote main is
761e0f7, which merged the eight-environment blog implementation. Consolidation
still contains the older blog source, despite separately verified public pages.

Plan: merge origin/main into the feature branch, resolve only overlapping
source changes while preserving consolidation fixes and merged blog scope.
Inspect every conflict, run source owner suites plus complete build/lint/types,
then push the feature branch and read GitHub mergeability and current gates.
No merge of PR #37 into main, deploy, npm publication or source test deletion.

Acceptance: all eight blog article routes and their examples preserved; existing
Maze3D entry/style repairs retained without duplicate apps; no conflict markers;
local checks pass; feature-branch remote revision matches and PR mergeability
is read back. Existing manual-player/HF/licence acceptance stays open.

Clean-checkout CI follow-up: run 37236505869 failed before build on Cage Duel
lint resolving @ignitionai/storage's absent compiled declarations. Its config
already maps core to source. Add the storage source mapping at that same owner
boundary, preserving build-independent lint rather than reordering/skipping it.
Reproduce with storage dist temporarily moved to a recoverable location, prove
pre-fix failure and repaired success, restore the artifact, then read new CI.
