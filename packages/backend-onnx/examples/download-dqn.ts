import { DQNAgent, IgnitionEnvTFJS } from '@ignitionai/backend-tfjs';
import { CartPoleEnv } from '@ignitionai/environments';

export const runner = new IgnitionEnvTFJS(new CartPoleEnv());

export function startTraining(): void {
  runner.train('dqn');
}

/** Call after convergence from a browser button. Do not resume until saving finishes. */
export async function downloadPolicy(): Promise<void> {
  runner.stop();
  // Queue a final greedy step behind any transition already in flight.
  await runner.inferStep();
  const agent = runner.agent;
  if (!(agent instanceof DQNAgent)) throw new Error('Train a DQN policy before downloading.');
  await agent.getModel().save('downloads://ignition-dqn');
}
