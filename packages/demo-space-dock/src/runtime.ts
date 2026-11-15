import { createPDState, scriptedPD } from './pd-controller';
import type { SpaceDockEnv } from './space-dock-env';
import type { Action } from './simulation-contract';
export type Mode = 'manual' | 'auto';
export type TransitionRecord = Readonly<{ elapsed: number; action: Action; reward: number }>;
export class DockRuntime {
  private accumulator = 0;
  private inputs = new Map<string, Action>();
  private controller = createPDState();
  private records: TransitionRecord[] = [];
  private disposed = false;
  private paused = false;
  private mode: Mode = 'manual';
  constructor(readonly env: SpaceDockEnv) {}
  get isPaused(): boolean { return this.paused; }
  get currentMode(): Mode { return this.mode; }
  get history(): readonly TransitionRecord[] { return this.records.map(record => ({ ...record })); }
  press(source: string, action: Action): void { if (!this.paused && !this.disposed) this.inputs.set(source, action); }
  release(source: string): void { this.inputs.delete(source); }
  clearControls(): void { this.inputs.clear(); }
  setPaused(paused: boolean): void { this.paused = paused; this.accumulator = 0; this.clearControls(); }
  setMode(mode: Mode): void {
    this.mode = mode; this.accumulator = 0; this.clearControls(); this.controller = createPDState();
  }
  reset(seed?: number): void {
    this.env.reset(seed); this.accumulator = 0; this.clearControls(); this.controller = createPDState(); this.records = [];
  }
  private nextAction(): Action {
    if (this.mode === 'auto') return scriptedPD(this.env.telemetry, this.controller);
    const actions = [...this.inputs.values()];
    return actions.includes(7) ? 7 : actions.at(-1) ?? 0;
  }
  advance(deltaSeconds: number): void {
    if (this.disposed || this.paused || this.env.done()) { this.accumulator = 0; return; }
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new RangeError('invalid deltaSeconds');
    this.accumulator = Math.min(0.3, this.accumulator + deltaSeconds);
    for (let count = 0; count < 3 && this.accumulator + 1e-10 >= 0.1 && !this.env.done(); count++) {
      const action = this.nextAction(); this.env.step(action); this.accumulator = Math.max(0, this.accumulator - 0.1);
      this.records.push({ elapsed: this.env.telemetry.elapsed, action, reward: this.env.reward() });
      if (this.records.length > 64) this.records.shift();
    }
  }
  dispose(): void { if (this.disposed) return; this.disposed = true; this.clearControls(); this.env.dispose(); }
}
