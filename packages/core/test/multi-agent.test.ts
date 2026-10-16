import { describe, expect, it, vi } from 'vitest';
import { MultiAgentRunner, type MultiAgentEnv } from '../src/index';
import type { AgentInterface, Experience } from '../src/types';

class Policy implements AgentInterface {
  observations: number[][] = [];
  experiences: Experience[] = [];
  updates = 0;
  discarded = 0;
  greedy: boolean[] = [];
  constructor(private action: number, private gate?: Promise<void>) {}
  async getAction(observation: number[], greedy = false) {
    this.observations.push([...observation]); this.greedy.push(greedy);
    await this.gate;
    return this.action;
  }
  remember(experience: Experience) { this.experiences.push(experience); }
  async train() { this.updates++; }
  discardRollout() { this.discarded++; }
}

class World implements MultiAgentEnv {
  agentIds = ['a', 'b'];
  tick = 0;
  batches: string[][] = [];
  resets = 0;
  positions = new Map([['a', [1, 0]], ['b', [10, 0]]]);
  activeAgentIds() { return this.agentIds; } // Runner must retire a after its own boundary.
  observe(id: string) { return this.positions.get(id)!; }
  step(actions: ReadonlyMap<string, number | number[]>) {
    this.batches.push([...actions.keys()]); this.tick++;
    for (const [id, action] of actions) {
      if (typeof action !== 'number') throw new Error('Expected scalar action');
      const position = this.positions.get(id)!;
      position[0] += action; position[1] = this.tick;
    }
  }
  reward(id: string) { return id === 'a' ? 101 : 202; }
  terminated(id: string) { return id === 'a' ? this.tick >= 1 : false; }
  truncated() { return false; }
  done() { return this.tick === 3; }
  reset() {
    this.resets++; this.tick = 0;
    this.positions = new Map([['a', [1, 0]], ['b', [10, 0]]]);
  }
}

function fixture(gate?: Promise<void>) {
  const world = new World(); const a = new Policy(1, gate); const b = new Policy(-1);
  return { world, a, b, runner: new MultiAgentRunner(world, new Map([['a', a], ['b', b]])) };
}

describe('simultaneous multi-agent public transitions', () => {
  it('keeps independent copied transitions, retires finished agents and preserves the global final state', async () => {
    const { runner, world, a, b } = fixture();
    const first = await runner.step();
    expect(first.transitions.get('a')).toMatchObject({ state: [1, 0], nextState: [2, 1], reward: 101, terminated: true });
    expect(first.transitions.get('b')).toMatchObject({ state: [10, 0], nextState: [9, 1], reward: 202, terminated: false });
    await runner.step(); const last = await runner.step();
    expect(world.batches).toEqual([['a', 'b'], ['b'], ['b']]);
    expect(last.episodeEnded).toBe(true);
    expect(last.transitions.get('b')).toMatchObject({ nextState: [7, 3], terminated: false, truncated: true });
    expect(world.observe('b')).toEqual([10, 0]);
    expect(a.observations).toEqual([[1, 0]]);
    expect(b.experiences.map(e => e.reward)).toEqual([202, 202, 202]);
    expect(first.transitions.get('b')?.nextState).toEqual([9, 1]);
    first.transitions.get('b')!.state[0] = 99;
    expect(b.experiences[0].state).toEqual([10, 0]);
    await runner.step(); expect(a.observations).toHaveLength(2);
  });

  it('requests all policies from one snapshot and serializes infer/reset behind a delayed training step', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const { runner, world, a, b } = fixture(gate);
    const training = runner.step(); const inference = runner.inferStep(); const reset = runner.reset();
    await vi.waitFor(() => expect(b.observations).toHaveLength(1));
    expect(a.observations).toEqual([[1, 0]]); expect(b.observations).toEqual([[10, 0]]);
    expect(world.batches).toHaveLength(0);
    release(); await Promise.all([training, inference, reset]);
    expect(world.batches).toEqual([['a', 'b'], ['b']]);
    expect(b.greedy).toEqual([false, true]);
    expect(a.updates).toBe(1); expect(b.updates).toBe(1);
    expect(a.experiences).toHaveLength(1); expect(b.experiences).toHaveLength(1);
    expect(world.tick).toBe(0); expect(a.discarded).toBeGreaterThan(0);
    await runner.step(); expect(a.observations).toHaveLength(2);
  });

  it('waits for sibling decisions before rejecting so reset cannot race a pending policy', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const { runner, world, b } = fixture(gate);
    let decisionFailed = false;
    b.getAction = async () => { decisionFailed = true; throw new Error('policy failure'); };
    const failure = runner.step().catch((error: unknown) => error);
    const reset = runner.reset();
    await vi.waitFor(() => expect(decisionFailed).toBe(true));
    expect(world.resets).toBe(0);
    release();
    expect(await failure).toEqual(new Error('policy failure'));
    await reset;
    expect(world.resets).toBe(1); expect(world.batches).toHaveLength(0);
  });

  it('stop cancels an automatic tick waiting behind a manual transition', async () => {
    vi.useFakeTimers();
    try {
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      const { runner, world } = fixture(gate);
      const manual = runner.step();
      runner.start('train', 1); await vi.advanceTimersByTimeAsync(1);
      runner.stop(); release(); await manual; await runner.reset();
      await vi.advanceTimersByTimeAsync(100);
      expect(world.batches).toHaveLength(1);
    } finally { vi.useRealTimers(); }
  });

  it('rejects implicit policy sharing and unregistered active agents before stepping', async () => {
    const world = new World(); const policy = new Policy(0);
    expect(() => new MultiAgentRunner(world, new Map([['a', policy], ['b', policy]]))).toThrow('Shared policy');
    const { runner, world: other } = fixture();
    other.activeAgentIds = () => ['missing'];
    await expect(runner.step()).rejects.toThrow('registered');
    expect(other.batches).toHaveLength(0);
  });
});
