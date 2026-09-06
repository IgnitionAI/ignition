import { expect, it } from 'vitest';
import * as tf from '@tensorflow/tfjs';
import { LearnedDriver } from '../src/racing/learned-driver';
import { RacingQEnvironment, trainQDriver } from '../src/racing/q-training';
import { LearnedRace } from '../src/racing/learned-race';

it.each(['dqn','double-dqn'] as const)('trains %s and reloads its actual weights into frozen racing opponents', async algorithm=>{
  await tf.setBackend('cpu');
  const driver=new LearnedDriver(11,algorithm), before=driver.exportCheckpoint();driver.dispose();
  const trained=await trainQDriver(before,{transitions:64});
  expect(trained.algorithm).toBe(algorithm);expect(trained.samples).toBe(64);expect(trained.updates).toBeGreaterThan(0);
  expect(trained.weights).not.toEqual(before.weights);
  const race=new LearnedRace([{id:'one',name:'one',model:'race',checkpoint:trained},{id:'two',name:'two',model:'sedan-sports',checkpoint:trained}]);
  try {
    const snapshots=race.snapshots();for(let i=0;i<200;i++)race.step();
    expect(race.snapshots().map(p=>p.weights)).toEqual(snapshots.map(p=>p.weights));
    expect(race.snapshots().map(p=>p.algorithm)).toEqual([algorithm,algorithm]);
  }finally{race.dispose();}
});
it('uses the shared nine actions and deterministic training starts',()=>{
  const a=new RacingQEnvironment(29),b=new RacingQEnvironment(29);
  expect(a.actions).toBe(9);expect(a.observe()).toHaveLength(20);
  for(let i=0;i<50;i++){a.step(7);b.step(7);expect(a.observe()).toEqual(b.observe());expect(a.reward()).toBe(b.reward());if(a.done()){a.reset();b.reset();}}
  expect(()=>a.step(9)).toThrow();
});
it('keeps a recoverable off-road excursion alive until the common race rescue',()=>{
  const env=new RacingQEnvironment(11),d=env.race.drivers[0];
  d.world.car.x=1000;d.world.car.z=1000;d.world.car.speed=0;
  env.step(4);
  expect(env.terminated()).toBe(false);expect(env.truncated()).toBe(false);
  for(let i=1;i<50;i++)env.step(4);
  expect(d.rescues).toBe(1);expect(d.penaltySeconds).toBeGreaterThanOrEqual(7);
  expect(env.done()).toBe(false);
});
it('collects the traffic phase with three frozen references and the same physics clock',()=>{
  const env=new RacingQEnvironment(11,true);
  expect(env.race.drivers).toHaveLength(4);
  const before=env.race.drivers.slice(1).map(d=>[d.world.car.x,d.world.car.z]);
  env.step(7);
  expect(env.race.elapsedTicks).toBe(6);
  expect(env.observe()).toHaveLength(20);
  expect(env.race.drivers.slice(1).map(d=>[d.world.car.x,d.world.car.z])).not.toEqual(before);
});
