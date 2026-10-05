# Public article verification — #46

Verified 2026-10-04 through dev-browser Chromium against https://ignitionai.dev.
No merge, publish or deployment was triggered. Source inventory derives from
the merged blog worktree and the shared eight-environment catalogue.

## Acceptance

1. PASS — authoritative GitHub Production deployment 6839502854 identifies
   revision 761e0f7c9ae847e63794d11a63f14ae606ce9c3c (PR #38), created
   2026-10-04T09:55:26Z; its success status was recorded at 09:55:27Z. The
   technical deployment URL requires Vercel login, so direct comparison of that
   hostname to the canonical domain was unavailable. Provider metadata and
   canonical public observations are retained as separate evidence layers;
   no claim that the latest consolidation source is deployed.
2. PASS — canonical /blog is HTTP 200 with exactly eight article links matching
   catalogue environments. All eight articles return 200 and visible distinct
   headings, preserving the original CartPole URL.
3. PASS — seventeen original article PNG assets return 200, decode successfully
   and exactly match SHA256 of the merged source assets. All article demo links
   return 200. This proves link/resource availability, not complete gameplay.
4. PASS — all eight articles checked at 1280px desktop and 390px mobile widths,
   with visible heading/content and no horizontal overflow. No page errors were
   recorded in desktop visits. Representative desktop/mobile screenshots were
   shown inline and inspected: readable article typography and responsive title
   wrapping. The mobile header's brand/npm spacing is tight; it is a visible
   polish limitation, not an article-blocking failure or a full accessibility
   audit. No exhaustive visual comparison of every below-fold section claimed.
5. PASS — canonical URLs, HTTP/DOM observations, provider revision/status,
   image hashes and six genuine screenshots retained here. One asset-check
   script used the wrong Response status accessor; recovery preserved the
   current page and screenshot, then the corrected check passed. No restart,
   injected data or local-build substitution was used.

Spec/standards review PASS for this read-only verification task. Local source
builds and PR preview gates are separate from these production observations.
This report completes public article readback missing from the earlier #36
local proof; it does not close #17, #31 or the broader launch epic.

## Public URLs

- https://ignitionai.dev/blog/mountaincar-prendre-elan
- https://ignitionai.dev/blog/gridworld-valeurs-actions
- https://ignitionai.dev/blog/cartpole-3d-observations
- https://ignitionai.dev/blog/drone-navigation-controle
- https://ignitionai.dev/blog/maze-capteurs-recompenses
- https://ignitionai.dev/blog/maze-3d-cles-portes
- https://ignitionai.dev/blog/circuit-racing-pilotes
- https://ignitionai.dev/blog/premier-agent-cartpole
