import { useEffect, useState } from 'react';
import Scene from './scene-adapter';
import Hud from './Hud';
import { SpaceDockEnv } from './space-dock-env';
import { DockRuntime } from './runtime';
import { attachControls } from './controls';
import { ACTIONS } from './simulation-contract';
import type { Action } from './simulation-contract';

type Loading = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; runtime: DockRuntime };
const SHORTCUTS = ['X', 'W / ↑', 'S / ↓', 'A / ←', 'D / →', 'Q', 'E', 'Espace'];
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}
export default function App() {
  const compact = useMediaQuery('(max-width: 600px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [loading, setLoading] = useState<Loading>({ status: 'loading' });
  const [, repaint] = useState(0);
  const [seed, setSeed] = useState('42');
  const [inputError, setInputError] = useState('');
  const publish = () => repaint(value => value + 1);
  useEffect(() => {
    let alive = true, owner: DockRuntime | undefined, frame = 0;
    let detach: (() => void) | undefined;
    void SpaceDockEnv.create(42).then(env => {
      if (!alive) { env.dispose(); return; }
      const runtime = new DockRuntime(env); owner = runtime;
      detach = attachControls(runtime, window, document, publish);
      if (document.hidden) runtime.setPaused(true);
      setLoading({ status: 'ready', runtime });
      let previous: number | undefined;
      const animate = (now: number) => {
        if (!alive) return;
        try {
          const ticks = env.telemetry.ticks;
          runtime.advance(previous === undefined ? 0 : (now - previous) / 1000); previous = now;
          if (ticks !== env.telemetry.ticks) publish();
          frame = requestAnimationFrame(animate);
        } catch (error: unknown) {
          runtime.setPaused(true); setLoading({ status: 'error', message: String(error) });
        }
      };
      frame = requestAnimationFrame(animate);
    }).catch((error: unknown) => { if (alive) setLoading({ status: 'error', message: String(error) }); });
    return () => { alive = false; cancelAnimationFrame(frame); detach?.(); owner?.dispose(); };
  }, []);
  if (loading.status === 'loading') return <main><h1>Dock spatial</h1><p role="status">Initialisation Rapier WASM…</p></main>;
  if (loading.status === 'error') return <main><h1>Dock spatial</h1><p role="alert">Initialisation ou simulation interrompue : {loading.message}</p></main>;
  const { runtime } = loading;
  const change = (action: () => void) => { action(); publish(); };
  const reset = () => {
    try {
      if (seed.trim() === '') throw new RangeError('Graine uint32 requise');
      runtime.reset(Number(seed)); setInputError(''); publish();
    } catch (error: unknown) { setInputError(String(error)); }
  };
  return <main>
    <header><p className="eyebrow">Démo · physique Rapier</p><h1>Dock spatial</h1>
      <p className="temporary">Modèles 3D originaux sous licence MIT ; voir les <a href={`${(import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL}models/LICENSE.txt`}>mentions de licence</a>.</p>
      <p>Transportez le cargo vers le poste d’arrimage ; le témoin devient vert au succès. La poussée change la vitesse ; anticipez le freinage.</p>
      <strong>{runtime.currentMode === 'auto' ? 'AUTO DÉMO — PD SCRIPTÉ, NON ENTRAÎNÉ' : 'MANUEL — 8 ACTIONS'}</strong>
    </header>
    <div className="toolbar">
      <button onClick={() => change(() => runtime.setMode('manual'))} aria-pressed={runtime.currentMode === 'manual'}>Manuel</button>
      <button onClick={() => change(() => runtime.setMode('auto'))} aria-pressed={runtime.currentMode === 'auto'}>Autodémo scriptée</button>
      <button onClick={() => change(() => runtime.setPaused(!runtime.isPaused))}>{runtime.isPaused ? 'Reprendre' : 'Pause'} (P)</button>
      <label>Graine uint32 <input value={seed} inputMode="numeric" onChange={e => setSeed(e.target.value)} /></label>
      <button onClick={reset}>Reset seedé</button>
    </div>
    {inputError && <p role="alert">{inputError}</p>}
    <div className="viewport" style={{ minHeight: compact ? 320 : 460 }} aria-label="Vue 3D du cargo, du remorqueur et du dock ; télémétrie textuelle ci-dessous">
      <Scene env={runtime.env} compact={compact} reducedMotion={reducedMotion} />
    </div>
    <div className="controls" aria-label="Commandes de poussée">
      {ACTIONS.map((label, index) => <button key={label} disabled={runtime.isPaused || runtime.currentMode !== 'manual' || runtime.env.done()}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); runtime.press(`pointer-${event.pointerId}`, index as Action); }}
        onPointerUp={event => runtime.release(`pointer-${event.pointerId}`)} onPointerCancel={event => runtime.release(`pointer-${event.pointerId}`)}
        onLostPointerCapture={event => runtime.release(`pointer-${event.pointerId}`)}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); runtime.press(`button-${index}`, index as Action); } }}
        onKeyUp={() => runtime.release(`button-${index}`)} onBlur={() => runtime.release(`button-${index}`)}>
        {label}<small>{SHORTCUTS[index]}</small>
      </button>)}
    </div>
    <p>P : pause · R : rejouer la graine courante. Perte de focus ou onglet masqué : commandes effacées et pause ; reprise explicite.</p>
    <Hud runtime={runtime} />
  </main>;
}
