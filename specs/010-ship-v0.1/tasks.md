# Tasks: Ship v0.1.0

**Feature**: `010-ship-v0.1` | **Date**: 2026-04-11

## Phase 1: Environments Package

- [x] T001 Scaffold `packages/environments/` with package.json, tsconfig
- [x] T002 Copy+adapt GridWorldEnv, CartPoleEnv, MountainCarEnv from demo packages into `packages/environments/src/`
- [x] T003 Copy+adapt tests from demo packages into `packages/environments/test/`
- [x] T004 Create `packages/environments/src/index.ts` exporting all envs
- [x] T005 Run tests — all env tests pass in new package

## Phase 2: CI/CD

- [x] T006 Create `.github/workflows/ci.yml` — pnpm install, build, test on every PR
- [x] T007 Test CI locally with `act` or push a test PR to verify

## Phase 3: Package Prep

- [x] T008 [P] Fix `packages/core/package.json` — verify main, types, files, version 0.1.0
- [x] T009 [P] Fix `packages/backend-tfjs/package.json` — verify main, types, files, version 0.1.0
- [x] T010 [P] Fix `packages/backend-onnx/package.json` — verify main, types, files, version 0.1.0
- [x] T011 [P] Fix `packages/storage/package.json` — verify main, types, files, version 0.1.0
- [x] T012 [P] Fix `packages/environments/package.json` — verify main, types, files, version 0.1.0

## Phase 4: CHANGELOG + Final Validation

- [x] T013 Create `CHANGELOG.md` at repo root — document v0.1.0 features
- [x] T014 Run full build + test suite — all packages, zero failures
- [x] T015 Verify each package builds to dist/ with correct exports

## Phase 5: Publish (manual, requires npm auth)

- [x] T016 `npm publish` for each of the 5 packages (user must run this)

## Dependencies

```
T001 → T002 → T003 → T004 → T005
T005 → T006 → T007
T007 → T008-T012 (parallel)
T008-T012 → T013 → T014 → T015 → T016
```

## Summary

| Total | 16 tasks |
