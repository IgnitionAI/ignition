import { DQNAgent } from "../agents/dqn";
import { DQNConfig } from "../types";
import * as tf from '@tensorflow/tfjs';

interface TrainAgentOptions {
    config: DQNConfig;
    maxSteps?: number;
    checkpointEvery?: number;
    repoId?: string;
    token?: string;
    onStep?: (step: number, reward: number, action: number, state: number[]) => void;
    getEnvStep: () => {
      state: number[];
      correctAction: number;
      nextState: number[];
    };
  }
  
  export async function trainAgent(options: TrainAgentOptions): Promise<void> {
    const {
      config,
      maxSteps = 100,
      checkpointEvery = 10,
      repoId,
      token,
      onStep,
      getEnvStep
    } = options;
  
    const agent = new DQNAgent(config);
    let bestReward = -Infinity;
  
    for (let step = 1; step <= maxSteps; step++) {
      const { state, correctAction, nextState } = getEnvStep();
  
      const action = await agent.getAction(state);
      const reward = action === correctAction ? 1 : -1;
      const done = false;
  
      agent.remember({ state, action, reward, nextState, done });
      await agent.train();
  
      onStep?.(step, reward, action, state);
  
      if (checkpointEvery && step % checkpointEvery === 0 && repoId && token) {
        await agent.saveCheckpoint(repoId, token, `step-${step}`);
      }
  
      if (reward > bestReward && repoId && token) {
        bestReward = reward;
        await agent.saveCheckpoint(repoId, token, 'best');
      }
    }
  
    agent.dispose();
    tf.disposeVariables();
    tf.dispose();
  }
  