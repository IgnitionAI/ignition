export interface RolloutData {
  states: number[][];
  actions: number[];
  rewards: number[];
  values: number[];
  logProbs: number[];
  dones: boolean[];
}

export class RolloutBuffer {
  private states: number[][] = [];
  private actions: number[] = [];
  private rewards: number[] = [];
  private values: number[] = [];
  private logProbs: number[] = [];
  private dones: boolean[] = [];
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  add(
    state: number[],
    action: number,
    reward: number,
    value: number,
    logProb: number,
    done: boolean
  ): void {
    this.states.push(state);
    this.actions.push(action);
    this.rewards.push(reward);
    this.values.push(value);
    this.logProbs.push(logProb);
    this.dones.push(done);
  }

  size(): number {
    return this.states.length;
  }

  isFull(): boolean {
    return this.states.length >= this.capacity;
  }

  getData(): RolloutData {
    return {
      states: this.states,
      actions: this.actions,
      rewards: this.rewards,
      values: this.values,
      logProbs: this.logProbs,
      dones: this.dones,
    };
  }

  computeAdvantagesAndReturns(
    gamma: number,
    gaeLambda: number
  ): { advantages: number[]; returns: number[] } {
    const n = this.size();
    const advantages = new Array<number>(n);
    const returns = new Array<number>(n);

    let lastAdvantage = 0;

    for (let t = n - 1; t >= 0; t--) {
      const nextValue = t === n - 1 ? 0 : this.values[t + 1];
      const nextNonTerminal = this.dones[t] ? 0 : 1;

      const delta =
        this.rewards[t] + gamma * nextValue * nextNonTerminal - this.values[t];
      lastAdvantage =
        delta + gamma * gaeLambda * nextNonTerminal * lastAdvantage;

      advantages[t] = lastAdvantage;
      returns[t] = advantages[t] + this.values[t];
    }

    return { advantages, returns };
  }

  clear(): void {
    this.states = [];
    this.actions = [];
    this.rewards = [];
    this.values = [];
    this.logProbs = [];
    this.dones = [];
  }
}
