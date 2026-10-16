# Contributing to IgnitionAI

Thanks for your interest! This guide covers how to set up the project, run tests, and submit changes.

## Development setup

```bash
git clone https://github.com/IgnitionAI/ignition.git
cd ignition
pnpm install
```

Requirements:
- Node.js 20+
- pnpm 9+
- Python 3.10+ (for ONNX export tests)

## Monorepo structure

```
packages/
├── core/            # TrainingEnv interface, types, schemas
├── backend-tfjs/    # DQN, PPO, QTable agents (TF.js)
├── backend-onnx/    # ONNX export + inference runtime
├── storage/         # Model persistence providers
├── environments/    # Built-in envs (CartPole, MountainCar, GridWorld)
├── ignitionai/      # Public facade (exports everything)
├── web/             # Next.js 16 landing + Nextra docs
└── demo-*/          # Standalone demo apps
```

## Running tests

```bash
# All tests
pnpm test

# Type check
pnpm run typecheck

# Single package
pnpm --filter @ignitionai/backend-tfjs test
```

## Adding a feature

1. **Open an issue first** for non-trivial changes
2. Create a branch: `git checkout -b feat/your-feature`
3. Add tests for new code
4. Run the full test suite: `pnpm test`
5. Update docs in `packages/web/content/` if user-facing
6. Submit a PR with a clear description

## Code style

- TypeScript strict mode
- No `any` without a comment explaining why
- Prefer `interface` over `type` for public APIs
- Write TSDoc for exported functions and classes

## Commit conventions

```
feat:      new feature
fix:       bug fix
docs:      documentation only
chore:     tooling, dependencies, cleanup
test:      adding or fixing tests
refactor:  code change that neither fixes a bug nor adds a feature
```

Example: `feat(backend-tfjs): add GRU support to DQNAgent`

## Release process

Maintainers only:
1. Update `CHANGELOG.md`
2. Bump versions in affected `package.json` files
3. Run `pnpm -r publish`
4. Tag the release on GitHub

## Questions?

Open a [GitHub Discussion](https://github.com/IgnitionAI/ignition/discussions) or ping `@salim4n` on Twitter/X.
