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
- pnpm 10.8.0 (the version pinned by the root package)
- Python 3.11 with pinned isolated dependencies for real ONNX conversion (see backend-onnx/examples/README.md)

## Monorepo structure

```
packages/
├── core/            # Discrete/continuous contracts and mono/multi-agent runners
├── backend-tfjs/    # DQN, Double DQN, PPO, QTable and SAC agents (TF.js)
├── backend-onnx/    # ONNX export + inference runtime
├── storage/         # Model persistence providers
├── environments/    # Built-in envs (CartPole, MountainCar, GridWorld)
├── ignitionai/      # Local-only facade; not published on npm
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
pnpm exec vitest run packages/backend-tfjs/test
```

## Cleaning generated artifacts

Install `trash-cli` so that `trash` and `trash-restore` are available, then run
`pnpm clean`. This moves package `dist` and `node_modules` directories to Trash;
the root dependency directory and source files are preserved. Symlink targets
are refused, and missing `trash` stops the command before any files are moved.
Use `trash-restore` to choose a directory and restore its original path. Do not
empty Trash until you have confirmed you no longer need these artifacts.

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
Follow the [candidate preparation and recovery checklist](../docs/design/release-candidate.md).
Approve the scope/version, validate the five modular archives outside the
workspace and their licences, then authorize publication separately. The
umbrella remains local-only. A local build or draft PR is not a published release.

## Questions?

Open a [GitHub Discussion](https://github.com/IgnitionAI/ignition/discussions) or ping `@salim4n` on Twitter/X.
