import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { DroneEnv } from '../drone-env';

export function createExperiment() {
  const environment = new DroneEnv();
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
