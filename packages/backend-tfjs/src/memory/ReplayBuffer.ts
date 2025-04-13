export interface Experience {
    state: number[];
    action: number;
    reward: number;
    nextState: number[];
    done: boolean;
  }
  
  export class ReplayBuffer {
    private buffer: Experience[] = [];
    private capacity: number;
  
    constructor(capacity: number = 10000) {
      this.capacity = capacity;
    }
  
    add(exp: Experience): void {
      if (this.buffer.length >= this.capacity) {
        // delete older element
        this.buffer.shift();
      }
      this.buffer.push(exp);
    }
  
    sample(batchSize: number): Experience[] {
      const sampled: Experience[] = [];
      const bufferLength = this.buffer.length;
      for (let i = 0; i < Math.min(batchSize, bufferLength); i++) {
        const idx = Math.floor(Math.random() * bufferLength);
        sampled.push(this.buffer[idx]);
      }
      return sampled;
    }
  
    size(): number {
      return this.buffer.length;
    }
  }
  