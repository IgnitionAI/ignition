import { expect, it } from 'vitest';
import { createAgent, createTraining, evaluate, DuelTraining } from '../src/learning';
it('Ignition learns from duel transitions and evaluates frozen policies separately', async () => {
    const agent = createAgent();
    const session = createTraining(agent);
    const before = await agent.getAction([3, 0, 0, 5], true);
    for (let i = 0; i < 3000; i++)
        await session.step();
    expect(agent.tableSize).toBeGreaterThan(5);
    expect(agent.currentEpsilon).toBeLessThan(.8);
    const trainingTick = session.stepCount;
    const epsilon = agent.currentEpsilon;
    const results = await evaluate(agent, [101, 307]);
    expect(results.rounds).toBe(2);
    expect(results.wins + results.losses + results.draws).toBe(2);
    expect(session.stepCount).toBe(trainingTick);
    expect(agent.currentEpsilon).toBe(epsilon);
    expect(typeof before).toBe('number');
});
it('keeps ready and early attack telegraphs distinguishable to the policy', async () => {
 const agent=createAgent();
 const ready=[3,0,0,5], windup=[3,1,0,5];
 agent.remember({state:ready,action:5,reward:1,nextState:ready,terminated:true,truncated:false});await agent.train();
 agent.remember({state:windup,action:6,reward:1,nextState:windup,terminated:true,truncated:false});await agent.train();
 expect(await agent.getAction(ready,true)).toBe(5);
 expect(await agent.getAction(windup,true)).toBe(6);
});

it('treats a full timed round as a terminal game for learning', () => {
    const environment = new DuelTraining();
    for (let i = 0; i < 600; i++) environment.duel.step(0, 0);
    expect(environment.duel.fighters.every(f => f.health === 100)).toBe(true);
    expect(environment.done()).toBe(true);
    expect(environment.terminated()).toBe(true);
    expect(environment.truncated()).toBe(false);
});
