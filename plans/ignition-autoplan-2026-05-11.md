# IgnitionAI — GStack Autoplan Review
**Date:** 2026-05-11
**Branch:** main
**Scope:** Full stack audit + Phase 2 roadmap (health fixes → model persistence → inference deployment)
**Author:** Hermes (gstack pipeline)

---

## 1. CEO Review — Product & Strategy

### The 10-Star Product

IgnitionAI is positioned as "the ML-Agents of the JavaScript creative ecosystem." The current state is a solid Phase 1: core RL algorithms work, demos are impressive, docs are thorough. But the 10-star version is not just a training framework — it's a **complete agent lifecycle platform** inside the browser.

**Current framing:** "Train RL agents in the browser with TF.js"
**10-star framing:** "Create, train, persist, and deploy autonomous agents — entirely in JavaScript, from prototype to production"

The leap from 7-star to 10-star requires three unlocks:
1. **Persistence** — agents that remember across sessions (Phase 3)
2. **Inference-only deployment** — drop a 50KB ONNX file into any game engine (Phase 4)
3. **Agent marketplace** — share pre-trained agents (HuggingFace integration already started)

### Scope Decision: Selective Expansion

| What we keep | What we expand | What we defer |
|-------------|----------------|---------------|
| Core RL (DQN, PPO) | Model save/load + IndexedDB export | Multi-agent training |
| 5 existing demos | Inference-mode demos (no training UI) | Distributed training |
| Nextra docs site | Interactive playground on landing | Cloud training backend |
| TF.js backend | ONNX runtime backend polish | JAX/Torch backends |

### Risk Premises

- **TF.js WebGPU support is still maturing** — fallback chain must be rock solid
- **Browser storage limits** — IndexedDB quota could break large model persistence
- **Solo maintainer** — complexity must grow slower than community adoption

---

## 2. Eng Review — Architecture & Data Flow

### Current Architecture (Verified)

```
packages/
├── core/              # TrainingEnv interface, Zod schemas, types
├── backend-tfjs/      # DQNAgent, PPOAgent, train loop, HF hub
├── backend-onnx/      # ONNX export, inference runtime
├── storage/           # (assumed) persistence abstractions
├── environments/      # CartPole, MountainCar, GridWorld, etc.
├── ignitionai/        # Public facade — exports everything
├── web/               # Next.js 16 landing + Nextra docs
└── demo-*/            # Standalone demo apps
```

### Critical Issues

**Issue E1: Monorepo package resolution is broken**
- `packages/core/package.json` has `"exports": null`
- `packages/backend-tfjs/package.json` has `"exports": null`
- Vite (vitest) cannot resolve these packages during tests
- **Fix:** Add proper `exports` map:
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.esm.js",
    "require": "./dist/index.js"
  }
}
```

**Issue E2: No root typecheck**
- `tsconfig.base.json` exists but no root `tsconfig.json` with project references
- `pnpm typecheck` script missing
- **Fix:** Add root `tsconfig.json` with `references` to each package

**Issue E3: Build order is implicit**
- Tests fail if packages aren't built first (`dist/` missing)
- `pnpm test` doesn't depend on `pnpm build`
- **Fix:** Add `pre-test` hook or turbo/pnpm pipeline config

**Issue E4: `ignition-web-rl` is orphaned**
- Entire package unused (knip flagged all files)
- Likely superseded by `packages/web/` and `packages/demo-*`
- **Fix:** Delete or archive

### Data Flow for Model Persistence (Phase 3)

```
[Agent training] → TF.js model → toJSON() → IndexedDB (browser)
                                     ↓
                                toLocalStorage() (small configs)
                                     ↓
                                exportToONNX() → .onnx file
                                     ↓
                                uploadToHF() → HuggingFace hub
```

**Edge cases:**
- IndexedDB quota exceeded → fallback to download prompt
- Corrupted storage → Zod validation on load, graceful reset
- Large models (>100MB) → streaming save, progress callback

### Testing Strategy

| Layer | Current | Target |
|-------|---------|--------|
| Unit (algorithms) | 239 pass | 300+ (add persistence tests) |
| Integration (env+agent) | Good | Add save/load round-trip tests |
| E2E (demos) | None | Playwright smoke tests for each demo |
| Type safety | Per-package | Root typecheck gate |

---

## 3. Design Review — UI/UX & Demos

### Current State (0-10 scale)

| Dimension | Score | What a 10 looks like |
|-----------|-------|---------------------|
| Landing page | 7 | Stellar template adapted, but 69 unused components clutter the codebase |
| Documentation | 8 | 14 pages, ~30k words, Nextra scaffold — excellent depth |
| Demo embeds | 6 | 5 demos work, but no unified "playground" feel |
| Interactive tutorials | 7 | Tutorial pages exist, but no inline code execution |
| Mobile responsiveness | 5 | RL demos likely struggle on mobile (canvas sizing, touch controls) |
| Performance | 6 | No Core Web Vitals tracking, no bundle analysis |

### Design Decisions

**D1: Clean up `packages/web/components/`**
- 69 unused files from Stellar template (CTA-02, CTA-03, testimonials, pricing, etc.)
- Decision: Delete all unused components. Keep only what's rendered.
- Rationale: Dead code confuses contributors and bloats build.

**D2: Add an interactive playground to landing**
- Current: static demos embedded as iframes/routes
- 10-star: a single page where users can select environment → algorithm → hyperparams → hit "Train" → watch real-time reward chart
- Rationale: This is the "aha" moment. The 7-line quickstart is good, but seeing it live in 30 seconds is better.

**D3: Mobile strategy for demos**
- RL training is CPU/GPU intensive — mobile browsers will throttle
- Decision: Demos detect mobile → show pre-trained agent in inference mode only
- Rationale: Don't ship a broken training experience on mobile.

---

## 4. DX Review — Developer Experience

### Time to Hello World (TTHW)

**Current:** `npm install ignitionai` → copy 7-line snippet → works
**Friction found:**
- No TypeScript autocomplete for environment configs (missing Zod IDE integration docs)
- No devtools/debug panel for agents (can't inspect Q-values, policy logits)
- Error messages from Zod are good, but stack traces point to `node_modules/ignitionai` instead of user code

### Onboarding Flow Audit

1. **Landing → Docs** ✓ Clear CTA, good
2. **Docs → First demo** ✓ 5 tutorials, well-structured
3. **First demo → Custom env** ⚠️ Gap: no interactive env builder
4. **Custom env → Training** ✓ `env.train('dqn')` is zero-config
5. **Training → Save model** ✗ Not implemented yet (Phase 3)
6. **Save → Deploy** ✗ Not implemented yet (Phase 4)

**The magical moment** is step 4 (watching the agent learn). But steps 5-6 are where users convert from tinkering to building products.

### Documentation Gaps

- No API reference (only tutorials)
- No troubleshooting guide for WebGPU failures
- No contribution guide (CONTRIBUTION_NOTES.md exists but is minimal)
- No changelog versioning strategy (CHANGELOG.md exists but is manual)

---

## 5. Implementation Plan

### Phase A: Health Fixes (Week 1)
**Goal:** Clean slate — green tests, green lint, green typecheck

| Task | File(s) | Effort |
|------|---------|--------|
| A1. Add `exports` map to core, backend-tfjs, backend-onnx | `package.json` (3 files) | 15 min |
| A2. Add root `tsconfig.json` with project references | `tsconfig.json` (new) | 30 min |
| A3. Fix `packages/web` eslint config | `eslint.config.mjs` (new) | 20 min |
| A4. Add `pre-test` build hook or pnpm pipeline | `package.json` scripts | 15 min |
| A5. Delete orphaned `ignition-web-rl/` | rm -rf | 10 min |
| A6. Prune unused web components (69 files) | `packages/web/components/` | 30 min |
| A7. Add vitest coverage config | `vitest.config.ts` | 15 min |
| A8. Run full health check — verify 10/10 score | `pnpm test`, `pnpm lint` | 15 min |

**Deliverable:** PR `#1` — "chore: monorepo health fixes"

### Phase B: Model Persistence (Week 2-3)
**Goal:** Agents remember across sessions

| Task | File(s) | Effort |
|------|---------|--------|
| B1. Design storage interface (IndexedDB, localStorage, download) | `packages/storage/src/` | 2h |
| B2. Implement TF.js model serialization | `packages/backend-tfjs/src/persistence.ts` | 4h |
| B3. Implement config/hyperparam serialization | `packages/core/src/persistence.ts` | 2h |
| B4. Add save/load methods to IgnitionEnv | `packages/backend-tfjs/src/env.ts` | 2h |
| B5. Add IndexedDB quota handling + fallback | `packages/storage/src/indexeddb.ts` | 3h |
| B6. Add Zod validation for loaded state | `packages/core/src/schemas.ts` | 1h |
| B7. Write integration tests (save → load → resume training) | `packages/backend-tfjs/test/` | 3h |
| B8. Update docs with persistence tutorial | `packages/web/content/` | 2h |

**Deliverable:** PR `#2` — "feat: model persistence (IndexedDB + export)"

### Phase C: Inference-Only Deployment (Week 4)
**Goal:** Deploy trained agents anywhere via ONNX

| Task | File(s) | Effort |
|------|---------|--------|
| C1. Polish ONNX export (verify opset compatibility) | `packages/backend-onnx/src/exporter.ts` | 3h |
| C2. Add inference-only runtime (no TF.js dependency) | `packages/backend-onnx/src/inference.ts` | 4h |
| C3. Create `infer()` API on IgnitionEnv | `packages/ignitionai/src/index.ts` | 1h |
| C4. Add inference demo (pre-trained CartPole) | `packages/demo-cartpole/src/inference.ts` | 2h |
| C5. Bundle size analysis (target: <50KB for inference runtime) | `packages/web/scripts/bundle-analyze.mjs` | 2h |
| C6. Update landing with "Deploy to Unity/Unreal" section | `packages/web/pages/index.mdx` | 2h |

**Deliverable:** PR `#3` — "feat: ONNX inference runtime + deployment pipeline"

### Phase D: Developer Experience Polish (Week 5)
**Goal:** Lower friction, higher conversion

| Task | File(s) | Effort |
|------|---------|--------|
| D1. Interactive playground on landing | `packages/web/pages/playground.tsx` | 8h |
| D2. API reference (auto-generated from TSDoc) | `packages/web/pages/api/` | 4h |
| D3. Mobile inference-only detection for demos | `packages/web/components/demo-embed.tsx` | 2h |
| D4. WebGPU troubleshooting guide | `packages/web/content/troubleshooting.mdx` | 1h |
| D5. Contribution guide + issue templates | `.github/CONTRIBUTING.md` | 2h |

**Deliverable:** PR `#4` — "feat: interactive playground + DX polish"

---

## 6. Success Metrics

| Metric | Current | 5-week target |
|--------|---------|---------------|
| Health score | 4.7/10 | 9.0/10 |
| Test pass rate | 92% (3 suite failures) | 100% |
| Test count | 242 | 350+ |
| Unused files | 69 | <10 |
| Bundle size (inference) | Unknown | <50KB |
| Landing conversion | Unknown | Baseline + playground |

---

## 7. Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Keep TF.js as primary backend | WebGPU maturing, community familiarity, ONNX as export target only |
| D2 | IndexedDB for persistence | Zero-config, no server, quota-aware fallback |
| D3 | Delete `ignition-web-rl` | Superseded by `packages/web`, dead code |
| D4 | No cloud backend | Solo maintainer constraint; keep everything client-side |
| D5 | Playground over more demos | One interactive playground > 10 static demos |

---

**STATUS:** `PLAN_COMPLETE`
**Next step:** Spawn Phase A (health fixes) or review this plan for approval.
