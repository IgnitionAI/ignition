import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { MountainCarEnv } from '../mountaincar-env';

export function createExperiment() {
  const environment = new MountainCarEnv();
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
