import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';

export function createExperiment() {
  const environment = new CartPoleEnv();
  const runner = new IgnitionEnvTFJS(environment);
  runner.train('dqn');

  return {
    environment,
    runner,
    infer: () => runner.infer(),
    resume: () => runner.train('dqn'),
    stop: () => runner.stop(),
  };
}
