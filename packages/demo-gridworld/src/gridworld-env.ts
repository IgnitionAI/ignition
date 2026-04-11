export class GridWorldEnv {
  agentRow = 0;
  agentCol = 0;
  readonly targetRow: number;
  readonly targetCol: number;
  readonly gridSize: number;
  stepCount = 0;
  trail: [number, number][] = [];

  private readonly maxSteps = 100;

  constructor(gridSize = 7) {
    this.gridSize = gridSize;
    this.targetRow = gridSize - 1;
    this.targetCol = gridSize - 1;
  }

  observe(): number[] {
    const max = this.gridSize - 1;
    return [
      this.agentRow / max,
      this.agentCol / max,
      this.targetRow / max,
      this.targetCol / max,
    ];
  }

  step(action: number | number[]): void {
    const a = typeof action === 'number' ? action : action[0];
    this.trail.push([this.agentRow, this.agentCol]);
    switch (a) {
      case 0: this.agentRow = Math.max(0, this.agentRow - 1); break;                 // up
      case 1: this.agentCol = Math.min(this.gridSize - 1, this.agentCol + 1); break;  // right
      case 2: this.agentRow = Math.min(this.gridSize - 1, this.agentRow + 1); break;  // down
      case 3: this.agentCol = Math.max(0, this.agentCol - 1); break;                 // left
    }
    this.stepCount++;
  }

  reward(): number {
    if (this.agentRow === this.targetRow && this.agentCol === this.targetCol) return 10;
    return -0.1;
  }

  done(): boolean {
    if (this.agentRow === this.targetRow && this.agentCol === this.targetCol) return true;
    return this.stepCount >= this.maxSteps;
  }

  reset(): void {
    this.agentRow = 0;
    this.agentCol = 0;
    this.stepCount = 0;
    this.trail = [];
  }
}
