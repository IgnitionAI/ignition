# Issue #44 — reversible cleanup

Verified 2026-10-04 with Node and trash-cli 0.24.5.26, using an isolated copy
of the real clean script and package command at
`/srv/dev/tmp/ignition-clean-proof-c1i4o4dk`. The active repository was not cleaned.

Spec review: PASS. Standards review: PASS. No test-only seam or new test suite.

Acceptance evidence:

- PASS: root clean now invokes `node scripts/clean.mjs`; script only invokes
  trash, never a permanent deletion command.
- PASS: printed target was `packages/sample/dist`; sample source and root
  node_modules files retained their contents. Package enumeration is limited
  to direct real directories; targets limited to dist/node_modules.
- PASS: real clean invocation exited 0. `trash-restore` with candidate 0
  restored the original artifact path and `recoverable artifact` contents.
- PASS: empty tool PATH exited 1 with `Cleanup requires trash ... No files
  were moved`; the artifact remained present.
- PASS: node_modules symlink pointing outside its package caused exit 1
  before cleanup; both the artifact and external file were preserved.
- PASS: actual `corepack pnpm --dir <isolated-workspace> clean` exited 0 and
  moved the restored dist directory to Trash again.
- PASS: `node --check scripts/clean.mjs` and `git diff --check`.

No library, browser or model behavior changed; broader RL/build tests were
not rerun for this CLI-only correction. Remote PR gates remain independent
from these runtime proofs. If trash fails mid-operation, the command reports
failure and directs the user to inspect Trash for already-moved directories.
