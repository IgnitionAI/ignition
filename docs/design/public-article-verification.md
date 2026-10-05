# Public article verification — issue #46

Analysis: canonical /blog returns HTTP 200 and eight article links. GitHub
Production deployment 6839502854 reports success for 761e0f7 (blog PR #38).
The consolidation checkout has the older blog implementation; use the merged
article inventory from the independent blog worktree, not its obsolete library.

Plan: compare eight catalogue environments to their article mapping; inspect
canonical article URLs, visible headings, loaded images and public demo links.
Verify desktop and mobile widths and retain genuine screenshots. Read provider
deployment status and compare its rendered article index to the canonical site.
Record scope, revision, HTTP/runtime observations and any gap before closure.
No merge, deployment or publication. Do not infer the latest consolidation
source is deployed from the successful independent blog deployment.

Acceptance: deployment/date/revision identified, eight listing/article routes
accessible, images/demo links work, desktop/mobile rendering inspected without
blocking errors, report and actual captures retained. Use dev-browser only for
web interaction. A missing public result leaves the affected criterion open.
