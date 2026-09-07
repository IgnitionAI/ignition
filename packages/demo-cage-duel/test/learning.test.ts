import { expect, it } from 'vitest';
import { createAgent, createTraining, evaluate } from '../src/learning';
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
