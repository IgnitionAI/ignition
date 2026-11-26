/**
 * Repo-root entry for the PPO before/after run: `node scripts/train-ppo-nav1d.mjs`.
 * Implementation lives in packages/backend-tfjs/scripts/train-ppo-nav1d.mjs
 * (needs `corepack pnpm --filter @ignitionai/core build` and
 * `corepack pnpm --filter @ignitionai/backend-tfjs build` so dist is Node-loadable ESM).
 */
import '../packages/backend-tfjs/scripts/train-ppo-nav1d.mjs';
