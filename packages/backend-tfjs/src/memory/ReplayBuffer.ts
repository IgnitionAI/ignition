import { Experience } from '@ignitionai/core';

export type { Experience };

export class ReplayBuffer {
  private buffer: Experience[];
  private head = 0;
  private _size = 0;
  private readonly capacity: number;

  constructor(capacity = 10000) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /** O(1) circular-buffer insert */
  add(exp: Experience): void {
    this.buffer[this.head] = exp;
    this.head = (this.head + 1) % this.capacity;
    if (this._size < this.capacity) this._size++;
  }

  sample(batchSize: number): Experience[] {
    const n = Math.min(batchSize, this._size);
    const sampled: Experience[] = [];
    for (let i = 0; i < n; i++) {
      sampled.push(this.buffer[Math.floor(Math.random() * this._size)]);
    }
    return sampled;
  }

  size(): number {
    return this._size;
  }
}
