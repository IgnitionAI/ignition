import { RobotArmController } from '../controller';

/**
 * Independent experiment for the blog article — the same controller and DQN
 * preset as the demo UI. Import it in the browser console while `pnpm dev` runs:
 *
 *   const { createExperiment } = await import('/examples/blog-experiment.ts');
 *   const session = createExperiment();
 *   session.train();       // creates the DQN agent, starts training
 *   session.pause();       // stops scheduling, waits for the current transition
 *   session.infer();       // greedy steps with the frozen network
 *   session.stop();        // alias of pause()
 */
export function createExperiment() {
  const controller = new RobotArmController(29);
  return {
    controller,
    snapshot: () => controller.snapshot(),
    train: () => controller.train(),
    infer: () => controller.infer(),
    pause: () => controller.pause(),
    stop: () => controller.pause(),
    newEpisode: () => controller.newEpisode(),
    dispose: () => controller.dispose(),
  };
}
