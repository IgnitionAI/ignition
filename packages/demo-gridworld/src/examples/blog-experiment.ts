import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { GridWorldEnv } from '../gridworld-env';

export function createExperiment() {
  const environment = new GridWorldEnv();
  const runner = new IgnitionEnvTFJS(environment);
  runner.train('qtable');

  return {
    environment,
    runner,
    infer: () => runner.infer(),
    resume: () => runner.train('qtable'),
    stop: () => runner.stop(),
  };
}
