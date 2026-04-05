/**
 * @ignitionai/environments
 *
 * Reference environments for the IgnitionAI framework.
 * Each environment exposes `getCallbacks()` which returns the callbacks
 * required by `IgnitionEnvConfig` (excluding the agent field).
 *
 * Usage:
 *   const env = createGridWorld(5);
 *   const ignitionEnv = new IgnitionEnv({ agent, ...env.getCallbacks() });
 */

export { GridWorldEnv, createGridWorld } from './src/grid-world/index';
export type { GridWorldConfig } from './src/grid-world/index';

export { CartPoleEnv, createCartPole } from './src/cart-pole/index';

export { MountainCarEnv, createMountainCar } from './src/mountain-car/index';

export type { EnvCallbacks } from './src/grid-world/index';
