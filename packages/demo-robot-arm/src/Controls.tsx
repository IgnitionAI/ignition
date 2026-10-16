import { useState } from 'react';
import { useDemoStore } from './store';
import { makeT } from './i18n';
import type { RobotArmController } from './controller';

export function Controls({ controller }: { controller: RobotArmController }) {
  const hud = useDemoStore((s) => s.hud);
  const lang = useDemoStore((s) => s.lang);
  const speed = useDemoStore((s) => s.speed);
  const setSpeed = useDemoStore((s) => s.setSpeed);
  const requestCameraReset = useDemoStore((s) => s.requestCameraReset);
  const t = makeT(lang);
  const [busy, setBusy] = useState(false);

  const mode = hud?.mode ?? 'stopped';
  const hasAgent = hud !== null && hud.updates > 0 || (hud?.transitions ?? 0) > 0;
  const canInfer = (hud?.updates ?? 0) > 0;

  const run = (fn: () => void | Promise<void>) => {
    // buttons stay responsive; the controller serializes the real operations
    setBusy(true);
    void Promise.resolve(fn()).finally(() => setBusy(false));
  };

  const changeSpeed = (value: number) => {
    setSpeed(value);
    controller.setSpeed(value);
  };

  return (
    <div className="controls">
      <div className="buttons">
        <button
          className="primary"
          disabled={busy || mode === 'training'}
          onClick={() => run(() => controller.train())}
        >
          {mode === 'stopped' && hasAgent ? t.resume : t.train}
        </button>
        <button disabled={busy || mode === 'stopped'} onClick={() => run(() => controller.pause())}>
          {t.pause}
        </button>
        <button
          disabled={busy || !canInfer || mode === 'inference'}
          onClick={() => run(() => controller.infer())}
          title={canInfer ? undefined : t.needTraining}
        >
          {t.inference}
        </button>
        <button disabled={busy} onClick={() => run(() => controller.newEpisode())}>
          {t.newEpisode}
        </button>
        <button disabled={busy} onClick={() => run(() => controller.restartLearning())}>
          {t.restart}
        </button>
        <button disabled={busy} onClick={requestCameraReset}>
          {t.resetCamera}
        </button>
        <label className="speed">
          {t.speed} ×{speed}
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={speed}
            aria-label={t.speed}
            onChange={(e) => changeSpeed(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="hint">{t.help} <em>{t.speedHint}</em>.</p>
    </div>
  );
}
