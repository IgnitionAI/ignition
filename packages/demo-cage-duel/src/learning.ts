import { IgnitionEnv } from '../../core/src/ignition-env';
import { QTableAgent } from '../../backend-tfjs/src/agents/qtable';
import { Duel, Action } from './duel';
export function createAgent(): QTableAgent {
    return new QTableAgent({ backend: 'cpu', inputSize: 4, actionSize: 7, stateBins: 6, stateLow: [0, 0, 0, 0], stateHigh: [6, 6, 6, 6], lr: .18, gamma: .92, epsilon: .8, epsilonDecay: .99993, minEpsilon: .08 });
}
export class DuelTraining {
    actions = 7;
    duel = new Duel(1);
    episodes = 0;
    private lastReward = 0;
    observe(): number[] { return this.duel.observe(0); }
    step(action: number | number[]): void {
        const [p, q] = this.duel.fighters;
        const before = p.health - q.health;
        this.duel.step(action as Action, this.duel.reference(1));
        this.lastReward = ((p.health - q.health) - before) / 20 - .005;
        if (this.duel.done)
            this.lastReward += p.health > q.health ? 3 : p.health < q.health ? -3 : 0;
    }
    reward(): number { return this.lastReward; }
    terminated(): boolean { return this.duel.fighters.some(f => f.health <= 0); }
    truncated(): boolean { return this.duel.done && !this.terminated(); }
    done(): boolean { return this.duel.done; }
    reset(): void { this.episodes++; this.duel = new Duel(1 + this.episodes % 97, 3 + (this.episodes % 5) * .4); }
}
export function createTraining(agent: QTableAgent): IgnitionEnv {
    const session = new IgnitionEnv(new DuelTraining());
    session.agent = agent;
    return session;
}
export interface Evaluation {
    rounds: number;
    wins: number;
    losses: number;
    draws: number;
    meanHealthMargin: number;
}
export const EVALUATION_SEEDS = [101, 307, 509, 701, 907, 1103, 1301, 1511, 1709, 1901];
/** No remember/train calls. Separate duels, held-out opponent timing seeds. */
export async function evaluate(agent: QTableAgent, seeds = EVALUATION_SEEDS): Promise<Evaluation> {
    const report: Evaluation = { rounds: seeds.length, wins: 0, losses: 0, draws: 0, meanHealthMargin: 0 };
    for (const seed of seeds) {
        const duel = new Duel(seed, 4.5);
        while (!duel.done)
            duel.step(await agent.getAction(duel.observe(0), true), duel.reference(1));
        const delta = duel.fighters[0].health - duel.fighters[1].health;
        report.meanHealthMargin += delta / seeds.length;
        if (delta > 0)
            report.wins++;
        else if (delta < 0)
            report.losses++;
        else
            report.draws++;
    }
    return report;
}
