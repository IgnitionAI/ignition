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

## Filtered archive follow-up

The files whitelist now admits emitted JavaScript/declarations and excludes
compiled tests. Actual pnpm tarballs were inspected: all five retain main/types
entry points and contain no tests or tsbuildinfo (`filtered/archives.json`).
Those exact tarballs installed in a new isolated consumer at
`/srv/dev/tmp/ignition-filtered-consumer-36tm2u2y`; the public operation smoke
and strict NodeNext declaration check both passed. No source test or workspace
output was deleted, and owner suites were not repeated for metadata-only edits.
Spec and standards review PASS; git diff-check PASS.

Archive filtering is now PASS. Release notes and delivery/recovery steps are
prepared in `docs/design/release-candidate.md` for maintainer review. Licence
distribution, release approval, full runtime matrix and final remote gates
remain NOT PROVEN. The earlier remaining-unit list records the initial stage.

## Explicit module outputs — current verification

Node 20.0.0 failed all ten baseline imports because the package lacked explicit
module metadata (`dual/matrix-before.json`). Package builds now emit primary
ESM plus a separate CommonJS tree, with matching conditional declarations and
nested CommonJS metadata included in the archive. ONNX node/web subpaths remain
available in both modes. No new compiler/bundler dependency was introduced.

PASS: actual corrected archives installed outside the workspace at
`/srv/dev/tmp/ignition-dual-consumer-oeorisol`. Node 20.0.0, 20.19.2 and 22.23.3
each pass 14 imports (five packages, two ONNX subpaths, ESM/require): 42/42.
Public operation smoke passes in both modes on all three versions. The real
ONNX artifact from the prior conversion proof loads and predicts actions
`[0, 0, 1]` in all six combinations; model conversion was not repeated.
Isolated .mts/.cts consumers compile strictly with NodeNext, including both
ONNX subpath declarations. See `dual/` for outputs, fixture consumers and exact
tarball hashes/manifests. No registry publication took place.

PASS: five dual-output package builds, unchanged owner suites (292 passed,
four authenticated HF skips), Circuit browser production build (17.30 s),
Node script syntax, diff-check and spec/standards review. This verifies the
Node 20/22 runtime matrix represented by the tested versions, not arbitrary
Node releases or authenticated provider behavior.

Remaining #47: copyright/licence distribution, maintainer release approval,
parent acceptance and final remote gates. Local packaging/module checks PASS;
the full epic remains NOT PROVEN.
