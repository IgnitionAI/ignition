# Main/consolidation integration verification

Main 761e0f7 merged into feature source 65584b7 on 2026-10-04. PR #37 was
CONFLICTING/DIRTY before integration; after push GitHub reports MERGEABLE and
CI Node 20/22 started again (run 37236505869). No PR merge into main, npm
publication or deployment was performed.

Two conflicts were resolved in Maze 3D entry/CSS. The main StrictMode entry
is retained, along with Tailwind and root dimensions from consolidation; new
structural class positioning is preserved without duplicating manual utility
styles. Blog metadata, library and dynamic article routes match main exactly.
Seven new mappings plus original CartPole cover the eight source environments;
all referenced example/image/article files exist.

## Local verification at 65584b7

- PASS: complete recursive build including all eight public demo prebuilds,
  dual-output packages and Next production output (113 generated pages).
- PASS: root lint and workspace TypeScript build.
- Initial parallel full suite: 466 passed, one unchanged four-reference-driver
  test exceeded 5 seconds during concurrent compilation, four HF skips.
  That failure is retained in parallel-tests-timeout.txt, not counted as a pass.
- PASS after build completed: unchanged full suite with documented one/two
  workers, 467 passed / four authenticated HF skips, 67 passing files / four
  skipped files. The racing test/source is byte-unchanged from the before merge.
- PASS: actual production Maze 3D controls and canvas visible. Native Train
  click execution was confirmed after CLI timeouts by active Q-table training
  (71+ steps). The same live page was preserved, screenshots/readbacks obtained;
  actual public Stop button invoked via DOM ended training at 160 steps, stable
  across subsequent reads. No private state or policy injection. This proves
  lifecycle/display, not a solved maze or input latency guarantee.
- PASS: new Next production server at localhost:3112 serves index with eight
  links and all eight articles with HTTP200 and their visible headings.
  Screenshots were displayed inline and inspected. This is local production
  output; canonical public article evidence remains in ../public-articles.

## Clean-checkout CI correction

Run 37236505869 actually FAILED lint on Node22; Node20 was cancelled. Cage Duel
could not resolve @ignitionai/storage declarations before packages were built.
The local checkout already had dist artifacts, so its earlier lint success did
not prove this clean-install behavior.

The owner config now maps storage to source alongside its existing core mapping.
With original storage dist temporarily moved (recoverably), the pre-fix real
lint fails with that exact TS2307; repaired lint exits0. The original directory
was restored in finally. before/after transcripts retained. No tests deleted,
lint skipped or workflow weakened. Spec/standards review PASS; diff-check PASS.
Broader build/runtime checks are not rerun for this type-resolution-only change;
new remote CI must establish the fresh-checkout pipeline result. Do not call
the final head CI green until provider readback confirms it.
