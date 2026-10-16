import { MultiAgentRunner, type MultiAgentEnv } from '@ignitionai/core';
import { QTableAgent } from '@ignitionai/backend-tfjs';

class Corridor implements MultiAgentEnv {
  agentIds = ['east', 'west'];
  private positions = new Map([['east', 0], ['west', 4]]);
  private ticks = 0;
  activeAgentIds() { return this.agentIds.filter(id => !this.terminated(id)); }
  observe(id: string) {
    const other = id === 'east' ? 'west' : 'east';
    return [this.positions.get(id)! / 4, this.positions.get(other)! / 4];
  }
  step(actions: ReadonlyMap<string, number | number[]>) {
    for (const [id, action] of actions) {
      if (action !== 0 && action !== 1) throw new Error('Corridor expects left/right actions');
      this.positions.set(id, Math.max(0, Math.min(4, this.positions.get(id)! + (action === 0 ? -1 : 1))));
    }
    this.ticks++;
  }
  reward(id: string) { return this.terminated(id) ? 10 : -0.1; }
  terminated(id: string) { return this.positions.get(id) === (id === 'east' ? 4 : 0); }
  truncated(id: string) { return !this.terminated(id) && this.ticks >= 20; }
  done() { return this.ticks >= 20 || this.agentIds.every(id => this.terminated(id)); }
  reset() { this.positions = new Map([['east', 0], ['west', 4]]); this.ticks = 0; }
}

async function main() {
  const east = new QTableAgent({ inputSize: 2, actionSize: 2, stateBins: 5, lr: 0.2 });
  const west = new QTableAgent({ inputSize: 2, actionSize: 2, stateBins: 5, lr: 0.2 });
  const runner = new MultiAgentRunner(new Corridor(), new Map([['east', east], ['west', west]]));
  for (let tick = 0; tick < 2000; tick++) await runner.step();
  await runner.reset();
  let episodes = 0;
  let goals = 0;
  while (episodes < 20) {
    const result = await runner.inferStep();
    for (const experience of result.transitions.values()) if (experience.terminated) goals++;
    if (result.episodeEnded) episodes++;
  }
  console.log(JSON.stringify({ protocol: 'multi-agent-corridor-v1', trainedTicks: 2000,
    policies: 2, tableSizes: [east.tableSize, west.tableSize], evaluationEpisodes: episodes,
    goals, possibleGoals: episodes * 2 }));
  runner.stop();
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
