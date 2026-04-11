# Implementation Plan: Ship v0.1.0

**Branch**: `010-ship-v0-1` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)

## Summary

Three deliverables: CI/CD pipeline, environments package, npm publish for all 5 packages.

## Order of execution

1. **Environments package** first — it's a new package with tests, needs to exist before CI/CD validates it
2. **CI/CD** second — validates everything before publish
3. **Package prep** — fix main/types fields, add READMEs to each package
4. **CHANGELOG** — document what's in v0.1.0
5. **npm publish** — last step, manual, requires npm auth

## Project Structure

```
packages/environments/           # NEW
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # exports all envs
│   ├── gridworld.ts             # GridWorldEnv implements TrainingEnv
│   ├── cartpole.ts              # CartPoleEnv implements TrainingEnv
│   └── mountaincar.ts           # MountainCarEnv implements TrainingEnv
└── test/
    ├── gridworld.test.ts
    ├── cartpole.test.ts
    └── mountaincar.test.ts

.github/workflows/
└── ci.yml                       # GitHub Actions: test + build on PR

CHANGELOG.md                     # NEW
```

## Package publish checklist

Each package needs:
- `main` pointing to `dist/index.js`
- `types` pointing to `dist/index.d.ts`
- `files: ["dist"]`
- `publishConfig: { "access": "public" }`
- Version `0.1.0`
