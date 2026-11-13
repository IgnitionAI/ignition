/// <reference types="vite/client" />

declare global {
  interface Window {
    __IGNITION_E2E__?: {
      actionFromKeys: (keys: ReadonlySet<string>) => number;
      snapshot: () => {
        finished: boolean;
        countdown: number;
        elapsedTicks: number;
        laps: number[];
        finishSeconds: (number | null)[];
        penaltySeconds: number[];
        competitorIds: string[];
        rulesId: string;
        human: boolean;
        keyCount: number;
      } | null;
      hold: (code: string) => void;
      release: (code: string) => void;
      completeWithFrozenCheckpoint: (checkpoint: unknown) => {
        finishSeconds: (number | null)[];
        laps: number[];
        competitorIds: string[];
        rulesId: string;
        driving: string;
      };
    };
  }
}

export {};
