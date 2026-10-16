import { create } from 'zustand';
import type { HudSnapshot, EpisodeSummary } from './controller';

interface DemoStore {
  hud: HudSnapshot | null;
  lang: 'fr' | 'en';
  speed: number;
  cameraResetSignal: number;
  setHud: (hud: HudSnapshot) => void;
  setLang: (lang: 'fr' | 'en') => void;
  setSpeed: (speed: number) => void;
  requestCameraReset: () => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  hud: null,
  lang: 'fr',
  speed: 1,
  cameraResetSignal: 0,
  setHud: (hud) => set({ hud }),
  setLang: (lang) => {
    try {
      window.localStorage.setItem('robot-arm-lang', lang);
    } catch {
      // storage unavailable — the URL param still works
    }
    set({ lang });
  },
  requestCameraReset: () => set((s) => ({ cameraResetSignal: s.cameraResetSignal + 1 })),
  setSpeed: (speed) => set({ speed }),
}));

export function summarize(history: EpisodeSummary[]) {
  const successes = history.filter((e) => e.success);
  const meanFinalDistance =
    history.length === 0
      ? null
      : history.reduce((sum, e) => sum + e.finalDistance, 0) / history.length;
  const avgCommandsToSuccess =
    successes.length === 0
      ? null
      : successes.reduce((sum, e) => sum + (e.commandsToSuccess ?? e.commands), 0) / successes.length;
  return {
    count: history.length,
    successRate: history.length === 0 ? null : successes.length / history.length,
    meanFinalDistance,
    avgCommandsToSuccess,
  };
}
