import { IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { MazeEnv } from '../maze-env';

export function createExperiment() {
  const environment = new MazeEnv();
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
