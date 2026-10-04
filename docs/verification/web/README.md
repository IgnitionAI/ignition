# Web verification evidence

Source baseline: 68f1b70, with earlier package/build fixes at dab0b09.
The real CI jobs for Node20 and22 passed on a clean checkout at dab0b09:
https://github.com/IgnitionAI/ignition/actions/runs/37191951080 . They installed
with frozen-lockfile, linted, built all packages and public demos, typechecked
and tested. Later source changes introduced the separately verified social cards.

Production local server: Next16.0.10, Node20.19.2, pnpm10.8.0, Chromium145 via
dev-browser0.2.9 at http://127.0.0.1:3102. The final smoke visited all eight demo
routes, waited two seconds per route, and recorded pageerror and failed HTTP
responses. Each displayed body content and a canvas; no errors/failed responses
were observed. See demo-smoke.json and docs-blog.json for raw results.

Maze3D originally served an empty root (unmounted entry), then an unstyled UI.
Its React entry and Tailwind Vite integration were fixed. Production Train→Stop
advanced12 transitions without pageerror. Narrow390×844 rendering was also
inspected. The shared catalogue and generated manifest contain the same eight
slugs; Cage Duel and Target Chasing are excluded. Local checks do not establish
that the current canonical deployed site serves this same commit.

The production mobile navigation opened to218px (equal to scrollHeight) and
closed with Escape without pageerror. A real lint violation submitted through
stdin exited1, while source lint and TypeScript exited0. Generated artifact
exclusions and MDX parser limitations are documented in packages/web/README.md.

## Current-source installation follow-up (#29)

On 2026-10-04, the modified source-install pages and homepage passed a Next
production build and real ESLint. The two `source-install-pages*.json` reports
record eight HTTP200 pages, rendered source prerequisites and no page errors.
The screenshots revealed poor text contrast in the displayed documentation
theme; this remains unresolved and visual readability is not a PASS claim.

Local core/backend-tfjs/environments/storage archives were created with pnpm
pack and installed with npm in an isolated scratch project (dependency scripts
disabled). A rebuilt Node bundle imported the current runner, PPO, Q-table and
IndexedDB exports, instantiated CartPole and DQN, and returned a valid greedy
action with finite scene coordinates. This verifies local package installation
and API availability, not a complete external Vite tutorial or published npm
parity. Legacy issues #6–17 still require criterion-level reconciliation.
