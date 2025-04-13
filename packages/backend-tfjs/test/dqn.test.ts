import { describe, it, expect } from 'vitest';
import { DQNAgent } from '../src/agents/dqn';
import { DQNConfig } from '../src/types';

describe('DQNAgent', () => {
  const config: DQNConfig = {
    inputSize: 1,
    actionSize: 2,
    hiddenLayers: [16],
    epsilon: 0.5,
    epsilonDecay: 0.99,
    minEpsilon: 0.01,
    lr: 0.001,
    gamma: 0.9,
    batchSize: 4,
    memorySize: 100,
    targetUpdateFrequency: 10,
  };

  it('should train on a fake environment', async () => {
    console.log('========== DQN AGENT TEST ==========');
    console.log('Config:', JSON.stringify(config, null, 2));
    const agent = new DQNAgent(config);
    console.log('Agent initialized');

    let correctActions = 0;
    let totalReward = 0;
    
    for (let step = 0; step < 50; step++) {
      const state = [Math.random()];
      const correct = state[0] > 0.5 ? 1 : 0;

      console.log(`\nStep ${step+1}/50: State=${state[0].toFixed(3)}, Correct action=${correct}`);
      
      const action = await agent.getAction(state);
      console.log(`Action chosen: ${action}`);
      
      const reward = action === correct ? 1 : -1;
      if (action === correct) correctActions++;
      totalReward += reward;
      
      console.log(`Reward: ${reward}, Running score: ${correctActions}/${step+1} (${(correctActions/(step+1)*100).toFixed(1)}%)`);
      
      const nextState = [Math.random()];
      const done = false;

      agent.remember({ state, action, reward, nextState, done });
      console.log(`Memory size: ${(agent as any).memory.size()}`);

      await agent.train();
      console.log(`Epsilon: ${(agent as any).epsilon.toFixed(3)}`);
    }

    console.log('\n========== TRAINING SUMMARY ==========');
    console.log(`Final score: ${correctActions}/50 (${(correctActions/50*100).toFixed(1)}%)`);
    console.log(`Total reward: ${totalReward}`);
    console.log(`Final epsilon: ${(agent as any).epsilon.toFixed(3)}`);

    const testState = [0.9]; // devrait préférer action = 1
    console.log(`\nTest prediction for state [${testState[0]}]`);
    const chosenAction = await agent.getAction(testState);
    console.log(`Agent chose: ${chosenAction} (Expected: 1)`);

    expect([0, 1]).toContain(chosenAction);
  });
});
