# DQN / Double DQN archived benchmark audit

On 2026-10-04, the published racing-q-learning-v3 data were independently
validated by `node scripts/audit-racing-q-report.mjs`.

All 11 recorded source hashes match archived implementation commit 020ba09b.
The pre-run reference also matches the recorded initial HEAD. The runner writes
its protocol with exclusive creation before the training loop; all ten final
checkpoint timestamps follow that manifest. These are historical experiment
records, not a new native training run on the current Linux machine.

The audit checks ten distinct algorithm/seed pairs, five seeds per method,
20 unique evaluation scenarios per policy, identical backend/configuration,
20000-decision budgets, positive measured training/evaluation durations,
checkpoint identity, finite weights/dimensions and success classification.
Current source differences are reported explicitly in audit.json; historical
scores are not reassigned to the current ghost-mode interactive races.

Recomputed results:

| Method | Successful /100 | Completed /100 | Population SD of seed success rates | Seed range |
| --- | --- | --- | --- | --- |
| DQN | 42 | 61 | 38.0263 percentage points | 0–85% |
| Double DQN | 33 | 77 | 32.9545 percentage points | 0–80% |

All 200 raw outcomes and ten checkpoints remain unchanged in the public report
directory. The presentation now labels the contact-mode contract explicitly
and shows the experiment date/source, while preserving the warning against a general superiority claim.

Browser verification followed the real demo's training tab and technical-details
link to the report. It displays ten rows and matching headline scores; all ten
policy JSON links and the full raw-results link return200. The served HTML hash
matches the updated source HTML. Evidence is in browser.json, links.json and final-presentation.json;
all captured screenshots were shown inline; final-presentation.json holds the final HTML hash. Only the affected static report was copied
into the existing local production build for this check; no complete demo build
or deployment is newly claimed.

Specification/standards review PASS for this report lot; both scripts pass
`node --check`. Reproduce the data audit from a checkout containing the archived
Git history:

```bash
node scripts/audit-racing-q-report.mjs .scratch/racing-q-audit.json
```

The native training/generation commands remain documented in the public report.
Issue #11's separate API/storage/UI criteria still require verification before
closing the dependency chain for #12. No player-race acceptance is inferred.
