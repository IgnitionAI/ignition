# Isolated package consumption — epic #47

Analysis at 1228463: all five modular packages compile and pack, and all five
archives install outside the workspace. All five native Node ESM imports fail
with ERR_MODULE_NOT_FOUND because emitted relative imports lack file extensions.
Archives also lack licence text (#45); ONNX packs compiled tests and packages
pack tsbuildinfo. No archive has been published.

Implementation plan, first unit: make relative module specifiers in the five
public packages explicit .js paths, including directory index paths. TypeScript
resolves these specifiers to the source .ts files; emitted JavaScript resolves
without workspace aliases or experimental Node flags. Preserve API, dependency,
version, checkpoint and source-workspace behavior. Do not alter tests merely
to accommodate this change. Keep the umbrella local-only and version 0.1.0
pending the maintainer's release decision.

Acceptance for this unit: all five built and repacked archives install in a
temporary consumer outside the repository; each can be imported natively on
the observed Node version. Exercise actual public constructors/operations and
check declarations with the consumer's compiler. Run existing owning regression
suites because import specifiers affect the complete source package surface.

Remaining epic units: archive filtering, licence distribution, release notes,
version approval, supported-Node/module-mode matrix and remote gates. Passing
this unit does not close #47 or authorize publication.

Archive filtering unit: restrict each modular package's files whitelist to
emitted JavaScript and declaration files, excluding compiled test paths. Do not
remove source tests or generated workspace outputs. Verify actual packed file
lists contain the public entry points, no tests and no tsbuildinfo, then install
these exact archives in a fresh external consumer and recheck imports/types.
Licence absence remains a separate unsatisfied criterion tracked by #45.
