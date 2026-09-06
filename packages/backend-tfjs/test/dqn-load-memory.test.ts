import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';
import { buildQNetwork } from '../src/model/BuildMLP';
it('releases replaced networks and owned optimizers after repeated loads',async()=>{
  await tf.setBackend('cpu'); const baseline=tf.memory().numTensors;
  const agent=new DQNAgent({inputSize:2,actionSize:2,hiddenLayers:[8],backend:'cpu',storageProvider:{
    async load(){return buildQNetwork(2,2,[8]);},async save(){return'memory';},async list(){return[];},async exists(){return true;},async delete(){},
  }});
  await agent.load('first');const loaded=tf.memory().numTensors;
  for(let i=0;i<3;i++)await agent.load('next');
  const repeated=tf.memory().numTensors;
  agent.dispose();
  expect(repeated).toBe(loaded);expect(tf.memory().numTensors).toBe(baseline);
});
