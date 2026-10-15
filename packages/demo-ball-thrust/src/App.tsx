import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import RAPIER from '@dimforge/rapier3d-compat';
import * as tf from '@tensorflow/tfjs';
import { Scene } from './Scene';
import { ACTION_DIRECTIONS, BallThrustEnv } from './ball-thrust-env';
import { TrainingSession } from './training-session';
import type { SessionSnapshot } from './training-session';
import { TrainingPanel } from './TrainingPanel';
import { CONTROL_KEYS, keyboardDirection } from './physics';
import './styles.css';

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p className="scene-message" role="alert">
      La scène 3D n’a pas pu démarrer. Vérifiez WebGL et l’accélération graphique, puis rechargez la page.
    </p>;
    return this.props.children;
  }
}

function vector(value: { x: number; y: number; z: number }) {
  return `${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)}`;
}

export function App() {
  const keys = useRef(new Set<string>());
  const arena = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState('');
  const isManual = snapshot?.mode === 'manual';

  useEffect(() => {
    let cancelled = false;
    let active: TrainingSession | undefined;
    void (async () => {
      await RAPIER.init();
      await tf.setBackend('cpu');
      await tf.ready();
      if (cancelled) return;
      active = new TrainingSession(new BallThrustEnv(70));
      active.manualAction = () => {
        const [x, z] = keyboardDirection(keys.current);
        return ACTION_DIRECTIONS.findIndex(([dx, dz]) => x === dx && z === dz);
      };
      const current = active;
      current.onChange = () => { if (!cancelled) setSnapshot(current.snapshot()); };
      setSession(current);
      setSnapshot(current.snapshot());
      await current.start('manual');
    })().catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => {
      cancelled = true;
      if (active) void active.dispose();
    };
  }, []);

  useEffect(() => {
    const release = () => keys.current.clear();
    release();
    const keyDown = (event: KeyboardEvent) => {
      if (!isManual || !CONTROL_KEYS.has(event.code)) return;
      event.preventDefault();
      keys.current.add(event.code);
    };
    const keyUp = (event: KeyboardEvent) => keys.current.delete(event.code);
    const element = arena.current;
    element?.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      element?.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
    };
  }, [isManual]);

  const telemetry = snapshot?.telemetry;
  return <main>
    <header>
      <a className="brand" href="https://github.com/IgnitionAI/ignition">IGNITION<span>AI</span></a>
      <span className="eyebrow">PHYSICS × DEEP RL</span>
    </header>
    <section className="heading">
      <div><p className="eyebrow">IMPULSION · OBSERVATION · APPRENTISSAGE</p><h1>Ball Thrust <span>3D</span></h1>
        <p>Pilotez la sphère, entraînez un vrai DQN, puis observez sa politique sans apprentissage.</p></div>
      <div className="badge">RAPIER + TF.js<span>Physique 60 Hz · Actions 10 Hz · Réseau CPU</span></div>
    </section>
    {error && <p role="alert">{error}</p>}
    <div className="layout">
      <div className="stage">
        <div className="viewport" ref={arena} tabIndex={0} role="region" aria-label="Arène Ball Thrust, contrôles clavier" aria-describedby="controls"
          onPointerDown={() => arena.current?.focus()} onBlur={() => keys.current.clear()}>
          <div className="scene-label">ARÈNE 12 × 12 m <span>VUE ORBITALE</span></div>
          <SceneErrorBoundary>{session ? <Scene env={session.env} /> : <p className="scene-message" role="status">Initialisation Rapier et TensorFlow.js…</p>}</SceneErrorBoundary>
          <div className="legend"><span>● Sphère</span><span>◆ Cible</span><span>■ Obstacles</span></div>
        </div>
        {session && snapshot && <TrainingPanel session={session} snapshot={snapshot} />}
      </div>
      <aside>
        <section className="panel">
          <p className="eyebrow">TÉLÉMÉTRIE / RAPIER</p>
          <h2 role="status">{telemetry?.reached ? 'Cible atteinte !' : 'Rejoignez la balise'}</h2>
          <dl>
            <div><dt>Position x, y, z <small>m</small></dt><dd data-testid="position">{telemetry ? vector(telemetry.position) : '—'}</dd></div>
            <div><dt>Vitesse x, y, z <small>m/s</small></dt><dd data-testid="velocity">{telemetry ? vector(telemetry.velocity) : '—'}</dd></div>
            <div><dt>Vitesse absolue</dt><dd data-testid="speed">{telemetry?.speed.toFixed(2) ?? '—'} <small>m/s</small></dd></div>
            <div><dt>Distance horizontale</dt><dd data-testid="distance">{telemetry?.distance.toFixed(2) ?? '—'} <small>m</small></dd></div>
            <div><dt>Temps simulé</dt><dd data-testid="time">{telemetry?.elapsed.toFixed(1) ?? '0.0'} <small>s</small></dd></div>
          </dl>
        </section>
        <section className="panel" id="controls">
          <p className="eyebrow">MODE MANUEL</p>
          <p><kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> ou <b>ZQSD / WASD</b></p>
          <p>Huit directions. Haut = −z, droite = +x, quelle que soit la caméra.</p>
          <p><kbd>Espace</kbd> ou relâcher = no-op ; la direction opposée freine.</p>
          <p>Cliquez l’arène pour jouer. Glissez pour orbiter, molette pour zoomer. Le clavier n’intervient jamais dans la politique du réseau.</p>
        </section>
        {session && snapshot && <form className="panel" onSubmit={(event) => {
          event.preventDefault();
          const value = Number(new FormData(event.currentTarget).get('seed'));
          keys.current.clear();
          setError('');
          void session.newEpisode(value).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
        }}>
          <label htmlFor="seed">Graine du monde</label>
          <div className="reset"><input id="seed" name="seed" type="number" min="0" max="4294967295" step="1" required defaultValue="70" />
            <button type="submit" data-testid="new-episode" disabled={snapshot.busy}>Réinitialiser ↺</button></div>
          <p>Nouvel épisode en pause ; le réseau est conservé. Le monde physique est recréé à graine identique. Limite : 30 s simulées.</p>
        </form>}
      </aside>
    </div>
    <footer><span>PHYSIQUE → DQN → INFÉRENCE</span><span>60 Hz fixes · 9 actions · 21 observations · Aucun déplacement cinématique</span></footer>
  </main>;
}
