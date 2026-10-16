import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { DQNAgent } from '../src/agents/dqn';
it('repeats initialization, exploration and replay updates with a supplied seed', async () => {
  await tf.setBackend('cpu');
  const snapshots: unknown[] = [];
  const storageProvider = {
    async save(_id: string, model: unknown) { snapshots.push((model as tf.Sequential).getWeights().map(t=>Array.from(t.dataSync())));return 'memory'; },
    async load():Promise<never>{throw new Error('unused');},async list(){return[];},async exists(){return true;},async delete(){},
  };
  const config = { inputSize: 2, actionSize: 2, hiddenLayers: [8], batchSize: 64, memorySize: 128, storageProvider, backend: 'cpu' as const, seed: 29 };
  const a = new DQNAgent(config), b = new DQNAgent(config);
  try {
    for (let i=0;i<70;i++) {
      expect(await a.getAction([i/10,1])).toBe(await b.getAction([i/10,1]));
      const exp={state:[i/10,1],nextState:[(i+1)/10,1],action:i%2,reward:i/10,terminated:false,truncated:false};
      a.remember(exp); b.remember(exp); await a.train(); await b.train();
    }
    for (let i=0;i<10;i++) expect(await a.getAction([i/10,1],true)).toBe(await b.getAction([i/10,1],true));
    expect(a.getState()).toEqual(b.getState());
    await a.save("a");await b.save("b");expect(snapshots[0]).toEqual(snapshots[1]);
  } finally {a.dispose();b.dispose();}
});
