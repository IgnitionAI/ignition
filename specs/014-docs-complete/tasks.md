# Tasks: Complete Documentation Site

**Feature**: `014-docs-complete` | **Date**: 2026-04-13
**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Data model**: [data-model.md](./data-model.md) · **Contracts**: [contracts/sidebar.md](./contracts/sidebar.md)

All paths are relative to repo root: `/Users/salimlaimeche/dev/ignitionai_agency/ignition/`. Every MDX and `_meta.js` file lives under `packages/web/content/`.

---

## Phase 1 — Setup

- [ ] T001 Verify Nextra dev server starts cleanly — run `pnpm --filter web dev`, open `http://localhost:3000/docs`, confirm the existing scaffold renders with no console errors, then stop the server
- [ ] T002 Inventory existing scaffold content under `packages/web/content/` and list which files from `data-model.md` Page Catalog already exist (`index.mdx`, `quickstart.mdx`, `r3f.mdx`) vs. which must be created

## Phase 2 — Foundational (sidebar contracts + pedagogical templates)

These block every user story: without the sidebar wiring, nothing is navigable; without the authoring conventions snapshot, pages drift.

- [ ] T003 Write `packages/web/content/_meta.js` top-level sidebar exactly as specified in `contracts/sidebar.md` (keys: index, quickstart, algorithms, how-it-works, r3f, tutorials)
- [ ] T004 [P] Write `packages/web/content/algorithms/_meta.js` per `contracts/sidebar.md` (keys: index, dqn, ppo, q-table)
- [ ] T005 [P] Write `packages/web/content/how-it-works/_meta.js` per `contracts/sidebar.md` (keys: index, core, backend-tfjs, backend-onnx, storage)
- [ ] T006 [P] Write `packages/web/content/tutorials/_meta.js` per `contracts/sidebar.md` (keys: index, grid-world with "Start here" label)
- [ ] T007 Re-verify defaults from `research.md` R1 against `packages/backend-tfjs/src/agents/{dqn,ppo,qtable}.ts` — if any value drifted since research.md was written, update research.md in the same commit
- [ ] T008 Re-verify each `@ignitionai/*` package's published status: run `npm view @ignitionai/core version`, `npm view @ignitionai/backend-tfjs version`, `npm view @ignitionai/backend-onnx version`, `npm view @ignitionai/storage version` — record results in `research.md` R3 so backend pages know which need the "publish pending" callout

---

## Phase 3 — User Story 1: First-time visitor understands IgnitionAI and installs it (P1)

**Story goal**: A new visitor on `/docs` reaches a running CartPole training in under 5 minutes (SC-001).

**Independent test**: Give a JS dev with no prior IgnitionAI knowledge the URL `/docs`. They must read the intro, follow Quickstart, and see an agent training locally — no other help.

- [ ] T009 [US1] Rewrite `packages/web/content/index.mdx` to satisfy FR-007 — one-sentence description, "why IgnitionAI" rationale, comparison with Unity ML-Agents / Python RL libraries, install command (`npm install @ignitionai/core @ignitionai/backend-tfjs`), explicit links to `/docs/quickstart` and `/docs/algorithms`, Next link to Quickstart
- [ ] T010 [US1] Rewrite `packages/web/content/quickstart.mdx` to satisfy FR-008, FR-009, FR-010 — <10-line copy-paste CartPole example importing from `@ignitionai/core` + `@ignitionai/backend-tfjs`, "What just happened" section mapping each line to a deeper concept, Previous link to Introduction, Next link to `/docs/algorithms`
- [ ] T011 [US1] Smoke-check US1: run `pnpm --filter web dev`, visit `/docs` and `/docs/quickstart`, click every in-page link, copy the Quickstart code into a scratch file and verify every import resolves against the actual published packages; record any failures as bugs to fix before Phase 4

---

## Phase 4 — User Story 2: Algorithm pages (P1)

**Story goal**: A reader finishing any algorithm page can answer 4/5 comprehension questions about it (SC-002) and every cited default matches the source code (SC-008).

**Independent test**: A reader who has never implemented DQN reads `/docs/algorithms/dqn` and can explain (a) why DQN uses a replay buffer, (b) why there's a target network, (c) what epsilon-decay does, (d) the default learning rate. Same bar for PPO and Q-Table.

- [ ] T012 [US2] Create `packages/web/content/algorithms/index.mdx` — Algorithms overview: one-paragraph framing, the "when to use which" chooser (DQN vs PPO vs Q-Table), links to the three sub-pages, Previous link to Quickstart, Next link to DQN
- [ ] T013 [P] [US2] Create `packages/web/content/algorithms/dqn.mdx` following the Algorithm skeleton from `data-model.md` — intuition, Bellman update in plain language, replay buffer + target network + epsilon-greedy explained (FR-012), Default Hyperparameters table exactly matching `research.md` R1 DQN row (FR-027), tuning guide, 3–5 failure modes with fixes; Previous link to Algorithms overview, Next link to PPO
- [ ] T014 [P] [US2] Create `packages/web/content/algorithms/ppo.mdx` following the Algorithm skeleton — policy-gradient intuition, clipped surrogate objective, GAE at a high level, why PPO > REINFORCE (FR-013), Default Hyperparameters table exactly matching `research.md` R1 PPO row (FR-027), tuning guide, failure modes; Previous link to DQN, Next link to Q-Table
- [ ] T015 [P] [US2] Create `packages/web/content/algorithms/q-table.mdx` following the Algorithm skeleton — when tabular methods are appropriate, state discretization (the `bins` parameter), table size vs generalization tradeoff (FR-014), Default Hyperparameters table exactly matching `research.md` R1 Q-Table row (FR-027), tuning guide, failure modes; Previous link to PPO, Next link to `/docs/how-it-works`
- [ ] T016 [US2] Cross-page review: read all three algorithm pages back-to-back and enforce FR-025 (consistent heading order, callout styling, code block styling) — fix any drift before Phase 5

---

## Phase 5 — User Story 3: How-it-works backend pages (P2)

**Story goal**: A reader finishing `/docs/how-it-works/backend-tfjs` can explain (a) render-loop decoupling, (b) `setSpeed()` internals, (c) where to add a new algorithm. Same bar for the other three backend pages.

**Independent test**: Open each backend page cold, finish it, and verbally explain the package's single responsibility without re-reading.

- [ ] T017 [US3] Create `packages/web/content/how-it-works/index.mdx` — monorepo map: one-paragraph intro, a table listing the four packages with their one-line responsibilities, links to the four sub-pages (FR-003); Previous link to Q-Table, Next link to `/docs/how-it-works/core`
- [ ] T018 [P] [US3] Create `packages/web/content/how-it-works/core.mdx` following the Backend skeleton — single-responsibility sentence, install command, Public API table from `research.md` R2 `@ignitionai/core`, in-depth `TrainingEnv` walkthrough (FR-016) including how `inputSize` is deduced from `observe().length` and `actionSize` from `actions.length`, GitHub source link; Previous link to monorepo map, Next link to backend-tfjs
- [ ] T019 [P] [US3] Create `packages/web/content/how-it-works/backend-tfjs.mdx` following the Backend skeleton — single-responsibility sentence, install command, Public API table from `research.md` R2 `@ignitionai/backend-tfjs`, walkthrough covering TF.js backend selection (WebGPU/WebGL/WASM/CPU), training-loop decoupling from the render loop, and how `setSpeed()` maps multiplier → `stepIntervalMs` + `stepsPerTick` (FR-017); GitHub source link; Previous link to core, Next link to backend-onnx
- [ ] T020 [P] [US3] Create `packages/web/content/how-it-works/backend-onnx.mdx` following the Backend skeleton — Public API table from `research.md` R2 `@ignitionai/backend-onnx`, Train → Export → Convert → Deploy pipeline with one code example per stage (FR-018), add the "publish pending" callout from `research.md` R3 if T008 showed the package is not yet on npm; Previous link to backend-tfjs, Next link to storage
- [ ] T021 [P] [US3] Create `packages/web/content/how-it-works/storage.mdx` following the Backend skeleton — Public API table from `research.md` R2 `@ignitionai/storage`, complete save/load round-trip using `HuggingFaceProvider` (FR-019), document `ModelStorageProvider` as the extension point for future backends, add the "publish pending" callout if T008 showed the package is not yet on npm; Previous link to backend-onnx, Next link to `/docs/r3f`
- [ ] T022 [US3] Cross-page review: verify FR-015 (every backend page has: single responsibility, public API surface, annotated walkthrough, GitHub link) — fix drift before Phase 6

---

## Phase 6 — User Story 4: React Three Fiber page (P2)

**Story goal**: An R3F developer with no prior IgnitionAI knowledge can paste the example into a working R3F project and see an agent learning within 10 minutes (SC-006).

**Independent test**: Take a fresh Vite + R3F starter, paste the example from `/docs/r3f`, run it, observe an agent learning.

- [ ] T023 [US4] Rewrite `packages/web/content/r3f.mdx` to satisfy FR-020 and FR-021 — "why R3F-first" rationale, full runnable `<Canvas>` + `TrainingEnv` example using `@react-three/fiber` + `@ignitionai/backend-tfjs`, "training loop vs render loop" explanation, links to the CartPole 3D and Car Circuit demo pages; Previous link to `/docs/how-it-works/storage`, Next link to `/docs/tutorials`

---

## Phase 7 — User Story 5: First tutorial (GridWorld) (P2)

**Story goal**: A beginner completes the GridWorld tutorial in under 30 minutes on a fresh project with no prior IgnitionAI knowledge (SC-003).

**Independent test**: Blank Vite project + the tutorial URL. Thirty-minute timer. No help.

- [ ] T024 [US5] Create `packages/web/content/tutorials/index.mdx` — Tutorials index with the GridWorld entry marked "Start here", estimated time, difficulty, Previous link to `/docs/r3f`, Next link to `/docs/tutorials/grid-world` (FR-004)
- [ ] T025 [US5] Create `packages/web/content/tutorials/grid-world.mdx` following the Tutorial skeleton from `data-model.md` — prerequisites (Node version, starter template, package versions from `research.md` R3), sequential steps each with code + filename + observation + rationale (FR-022, FR-023), final "what success looks like" state, Next steps section pointing to the algorithms pages and future tutorials (FR-024); reuse code from `packages/demo-gridworld/` as the canonical reference per plan Assumptions; Previous link to Tutorials index, Next link back to `/docs/algorithms`

---

## Phase 8 — Polish & cross-cutting

- [ ] T026 Build check: run `pnpm --filter web build` from repo root; fix any broken links, missing imports, or MDX compile errors
- [ ] T027 [P] Link audit: click every in-page link across all 14 pages in `pnpm --filter web dev` — no 404s, no dead anchors
- [ ] T028 [P] Mobile check: open each of the 14 pages at 375 px viewport — sidebar collapses to a drawer, code blocks scroll horizontally, no layout break (spec Edge Cases)
- [ ] T029 [P] Dark-mode check: toggle dark mode on each of the 14 pages — palette matches the landing page, no low-contrast text (FR-031)
- [ ] T030 Copy-runnability audit: for every code block whose context makes it a "copy-paste example" (not an inline fragment), copy it into a scratch file and verify imports resolve against the actual published packages — zero "missing import" / "undefined variable" / "wrong package name" failures (SC-004)
- [ ] T031 Consistency pass: re-read the Algorithms section end-to-end checking FR-025 heading order and code-block styling; do the same for How-it-works
- [ ] T032 Final traceability sweep: for each FR in `spec.md`, confirm the matching task(s) from `data-model.md` actually deliver it; mark any gap as a new T0xx task and close before merging
- [ ] T033 Stale-content sweep: grep `packages/web/content/` for `TODO`, `NEEDS CLARIFICATION`, and `...` placeholders — zero hits allowed outside explicitly-flagged future tutorials (SC-005)
- [ ] T034 Ship readiness: smoke-check Success Criteria SC-001 through SC-008 against the shipped pages; document any deferred items in a follow-up issue

---

## Dependencies

```text
Phase 1 (Setup) ─── T001 → T002
                                ↓
Phase 2 (Foundational) ─── T003 ─┬─ T004 [P]
                                 ├─ T005 [P]
                                 └─ T006 [P]
                     ─── T007 (research re-verification, independent)
                     ─── T008 (npm registry check, independent)
                                ↓  (blocks all story phases)
Phase 3 (US1 · P1) ── T009 → T010 → T011
                                ↓
Phase 4 (US2 · P1) ── T012 → ┬─ T013 [P]
                             ├─ T014 [P]
                             └─ T015 [P]  → T016
                                ↓
Phase 5 (US3 · P2) ── T017 → ┬─ T018 [P]
                             ├─ T019 [P]
                             ├─ T020 [P]
                             └─ T021 [P]  → T022
                                ↓
Phase 6 (US4 · P2) ── T023
                                ↓
Phase 7 (US5 · P2) ── T024 → T025
                                ↓
Phase 8 (Polish) ─── T026 → ┬─ T027 [P]
                            ├─ T028 [P]
                            └─ T029 [P]  → T030 → T031 → T032 → T033 → T034
```

**Critical path**: T001 → T003 → T009 → T010 → T012 → T013 (one of) → T016 → T017 → T018 (one of) → T022 → T023 → T024 → T025 → T026 → T030 → T034.

**MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1) alone ships a complete, navigable `/docs` with the single highest-leverage path (Intro → Quickstart). That's the minimum deployable increment.

## Parallel execution examples

- **Phase 2**: T004, T005, T006 touch three different `_meta.js` files under different subdirectories — run them in one batch after T003.
- **Phase 4 (Algorithms)**: T013, T014, T015 are three independent MDX files. After T012 creates the overview, an author (or three) can write DQN, PPO, and Q-Table in parallel.
- **Phase 5 (How-it-works)**: T018, T019, T020, T021 are four independent MDX files. After T017, all four backend pages can be drafted in parallel.
- **Phase 8**: T027 (link audit), T028 (mobile), T029 (dark mode) are independent read-only checks across the finished site.

## Summary

| Phase | Tasks | Story | Parallelizable |
|---|---|---|---|
| 1 Setup | 2 | — | — |
| 2 Foundational | 6 | — | T004·T005·T006·T007·T008 |
| 3 User Story 1 (P1) | 3 | US1 | — |
| 4 User Story 2 (P1) | 5 | US2 | T013·T014·T015 |
| 5 User Story 3 (P2) | 6 | US3 | T018·T019·T020·T021 |
| 6 User Story 4 (P2) | 1 | US4 | — |
| 7 User Story 5 (P2) | 2 | US5 | — |
| 8 Polish | 9 | — | T027·T028·T029 |
| **Total** | **34** |  |  |

**Tasks per user story**: US1 = 3, US2 = 5, US3 = 6, US4 = 1, US5 = 2.
**MVP (recommended)**: Phases 1–3 (11 tasks) ship a working Intro + Quickstart.
**Full feature**: all 34 tasks.
