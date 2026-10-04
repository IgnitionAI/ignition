import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '../cartpole-env';

export function createCartPoleSession() {
  const pole = new CartPoleEnv();
  const runner = new IgnitionEnvTFJS(pole);

  runner.train('dqn');

  return {
    pole,
    runner,
    infer: () => runner.infer(),
    resume: () => runner.train('dqn'),
    stop: () => runner.stop(),
  };
}
