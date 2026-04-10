export interface RunMetrics {
  episode: number;
  reward: number;
  epsilon: number;
  steps: number;
}

export interface TrainingRun {
  id: string;
  name: string;
  config: Record<string, unknown>;
  episodes: RunMetrics[];
  startedAt: string;
  endedAt: string | null;
}
