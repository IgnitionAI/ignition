# Reversible workspace cleanup — issue #44

Analysis: the root clean script permanently deletes package dist/node_modules,
contrary to the user's deletion rule. The installed trash CLI supports --version,
absolute paths and --. No cleanup has been run on this working repository.

Plan: replace the root command with a Node script deriving the repository root
from its own location. Preflight trash before mutation; enumerate direct package
directories and only their dist/node_modules directories. Refuse symlink targets
and package directories. Print the complete target list before moving anything.
Preserve the existing package-only scope; leave root node_modules intact.

Out of scope: trash purging, deleting sources, installing system tools, release.

Acceptance: no permanent deletion command; bounded explicit targets; a real
temporary artifact can be moved and restored; missing trash leaves files intact.
Verify the actual command in an isolated copied workspace using real trash and
its restore command, including a missing-tool PATH and a symlink escape fixture.
No new unit tests: this low-impact CLI change is verified at its real boundary.
