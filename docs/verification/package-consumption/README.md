# Epic #47 — native package consumption

Observed 2026-10-04. Baseline source 1228463; corrected source is identified by
the commit containing this report. Nothing was published to npm or deployed.

## Analysis and repair

Five modular packages built successfully, packed through pnpm and installed
with npm in a temporary consumer outside the workspace. Every baseline ESM
import failed with ERR_MODULE_NOT_FOUND on an extensionless relative path.
`native-imports.json` and `core-import.txt` retain the actual failures.

Relative source module specifiers now identify emitted .js files. This changes
resolution, not algorithms, exports, dependency versions or model formats.
The umbrella remains local-only; release version approval is still pending.

## Verification

- PASS: all five package builds and packs completed.
- PASS: corrected archives installed into
  `/srv/dev/tmp/ignition-package-fixed-_356h2dk` without workspace symlinks.
- PASS: native ESM imports of all five packages on Node 20.19.2, with actual
  exported names in `fixed-native-imports.json`.
- PASS: native require of all five packages on the same Node version in
  `fixed-commonjs-imports.json`. This does not establish older Node 20 support.
- PASS: public smoke constructs CartPole and its runner, changes Q-table action
  preference with a rewarded terminal transition, performs real CPU DQN
  inference, validates missing storage configuration and exercises ONNX's
  pre-load guard. It does not load an ONNX model or contact HF.
- PASS: isolated consumer declarations compile with strict NodeNext resolution
  using the repository's pinned TypeScript compiler; no workspace source alias.
- PASS: existing five-package owner suites: 292 passed, 4 skipped, 42 passing
  files / 4 skipped files. Skips are authenticated HF cases, not successes.
- PASS: Circuit Vite production bundle built into an isolated temporary output;
  existing large-chunk and browser-externalized Node module warnings remain.
- PASS: specification/standards review and diff whitespace checks.

The public smoke is the primary archive-consumption boundary: workspace tests
resolve sources and did not detect this failure. Its credible regression is a
packed module with an unresolved internal path, demonstrated by the baseline.
It requires no production test seam. Existing algorithm tests remain unchanged.
Archive hashes identify the corrected local packages; tarballs are not committed.

## Remaining epic acceptance

NOT PROVEN: licence distribution (#45), filtering build metadata/ONNX test
artifacts, approved release scope/version, full supported Node/module matrix,
notes and publication/rollback procedure, and remote gates on final revision.
These local checks do not close #47 or prove a released package is fixed.
