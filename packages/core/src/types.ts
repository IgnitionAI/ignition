export interface Experience {
    state: number[];
    action: number;
    reward: number;
    nextState: number[];
    done: boolean;
  }
  
  export interface AgentInterface {
    getAction(observation: number[]): Promise<number>;
    remember(experience: Experience): void;
    train(): Promise<void>;
  }
  