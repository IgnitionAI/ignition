import * as tf from '@tensorflow/tfjs';
import { DQNAgent, buildQNetwork } from '@ignitionai/backend-tfjs';
import { referenceAction } from './reference';
import { RaceWorld } from './race';
import { observeDriver } from './observations';
import { LearnedDriver, type DriverCheckpoint } from './learned-driver';
import { Q_PROTOCOL } from './q-protocol';
import { seededRandom, type TrainingProgress } from './training';

/** One RL transition holds an action for six common physics ticks. No teacher labels. */
export class RacingQEnvironment {
  race = new RaceWorld({ countdown: 0 });
  actions = 9;
  private steps = 0;
  private lastReward = 0;
  private stopped = false;
  private readonly random: () => number;
  constructor(seed: number, readonly traffic = false) { this.random = seededRandom(seed); this.reset(); }
  observe() { return observeDriver(this.race); }
  reset() {
    this.race = new RaceWorld({countdown:0,count:this.traffic?4:1});
    const d=this.race.drivers[0], p=this.race.track.sample(this.random());
    Object.assign(d.world.car,{x:p.x,z:p.z,angle:p.angle+(this.random()-.5)*.1,speed:4+this.random()*8});
    d.lastProgress=p.progress;d.gates=Math.floor(p.progress*20);d.safeProgress=d.gates/20;
    this.steps=0;this.lastReward=0;this.stopped=false;
  }
  step(action: number) {
    if(this.done()) return;
    const d=this.race.drivers[0], before=d.lastProgress, gates=d.gates, penalties=d.penaltySeconds;
    for(let i=0;i<Q_PROTOCOL.actionRepeat;i++) this.race.step(this.race.drivers.map((driver,index)=>index===0?action:referenceAction(driver.world)));
    let delta=d.lastProgress-before;
    if(delta>.5)delta-=1;if(delta<-.5)delta+=1;
    const offroad=this.race.track.nearest(d.world.car.x,d.world.car.z).distance>this.race.track.width/2;
    this.lastReward=Math.max(-2,Math.min(2,delta*this.race.track.length)) + (d.gates-gates)*2 - (d.penaltySeconds-penalties) - .01 - (offroad?.2:0);
    this.steps++;
    // Recoverable errors keep the same rescue/penalty rules as racing.
    this.stopped=d.finishSeconds!==null;
  }
  reward() { return this.lastReward; }
  terminated() { return this.stopped; }
  truncated() { return !this.stopped && (this.steps>=Q_PROTOCOL.episodeTransitions || this.race.finished); }
  done() { return this.terminated() || this.truncated(); }
}

export async function trainQDriver(checkpoint: DriverCheckpoint, options: {
  transitions?: number; signal?: AbortSignal;
  onWorld?: (race:RaceWorld)=>void; onProgress?: (p:TrainingProgress)=>void;
} = {}): Promise<DriverCheckpoint> {
  if(checkpoint.algorithm==='imitation-mlp') throw new Error('Q-learning needs a Q-network checkpoint');
  const validated=LearnedDriver.fromCheckpoint(checkpoint);validated.dispose();
  const budget=options.transitions??Q_PROTOCOL.transitions;
  if(!Number.isInteger(budget)||budget<1)throw new Error('Invalid transition budget');
  if(!['cpu','tensorflow'].includes(tf.getBackend())) throw new Error('Q training requires the CPU or native TensorFlow backend');
  let output=checkpoint;
  const agent=new DQNAgent({
    inputSize:20,actionSize:9,hiddenLayers:[32,32],seed:checkpoint.seed,
    doubleQ:checkpoint.algorithm==='double-dqn',backend:'auto',
    lr:Q_PROTOCOL.learningRate,batchSize:Q_PROTOCOL.batchSize,memorySize:Q_PROTOCOL.memorySize,
    gamma:Q_PROTOCOL.gamma,epsilonDecay:Q_PROTOCOL.epsilonDecay,minEpsilon:Q_PROTOCOL.minEpsilon,
    targetUpdateFrequency:Q_PROTOCOL.targetUpdateFrequency,
    storageProvider:{
      async load(){
        const model=buildQNetwork(20,9,[32,32],Q_PROTOCOL.learningRate,checkpoint.seed);
        const weights=checkpoint.weights.map(w=>tf.tensor(w.values,w.shape));
        try{model.setWeights(weights);}finally{tf.dispose(weights);}
        return model;
      },
      async save(_id,model){
        output={...checkpoint,configuration:{...Q_PROTOCOL},createdAt:new Date().toISOString(),
          samples:checkpoint.samples+collected,updates:checkpoint.updates+Number(agent.getState().trainStepCounter),
          weights:(model as tf.Sequential).getWeights().map(t=>({shape:t.shape,values:Array.from(t.dataSync())}))};
        return 'memory';
      },async list(){return[];},async exists(){return true;},async delete(){},
    },
  });
  let collected=0;
  let env=new RacingQEnvironment(checkpoint.seed+checkpoint.samples,checkpoint.samples>=Q_PROTOCOL.trafficAfterTransitions);
  try {
    await agent.load('weights');
    for(;collected<budget && !options.signal?.aborted;) {
      if(!env.traffic && checkpoint.samples+collected>=Q_PROTOCOL.trafficAfterTransitions)
        env=new RacingQEnvironment(checkpoint.seed+checkpoint.samples+collected,true);
      const state=env.observe(),action=await agent.getAction(state);
      env.step(action);
      agent.remember({state,action,nextState:env.observe(),reward:env.reward(),terminated:env.terminated(),truncated:env.truncated() || (!env.terminated() && checkpoint.samples+collected+1===Q_PROTOCOL.trafficAfterTransitions)});
      collected++;
      if(collected%Q_PROTOCOL.trainEvery===0) await agent.train();
      if(env.done())env.reset();
      if(collected%250===0) {
        if(!options.signal?.aborted){options.onWorld?.(env.race);options.onProgress?.({round:collected,loss:null,samples:checkpoint.samples+collected,traffic:env.traffic});}
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }
    await agent.save('last');
    return output;
  } finally {agent.dispose();}
}
