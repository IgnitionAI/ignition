import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Scene } from './Scene';
import type { Telemetry } from './Scene';
import { CONTROL_KEYS } from './physics';
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

function vector(value: Telemetry['position']) {
  return `${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)}`;
}

export function App() {
  const keys = useRef(new Set<string>());
  const [seed, setSeed] = useState(70);
  const [generation, setGeneration] = useState(0);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [seedError, setSeedError] = useState('');
  const arena = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const release = () => keys.current.clear();
    const keyDown = (event: KeyboardEvent) => {
      if (!CONTROL_KEYS.has(event.code)) return;
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
  }, []);

  return <main>
    <header>
      <a className="brand" href="https://github.com/IgnitionAI/ignition">IGNITION<span>AI</span></a>
      <span className="eyebrow">PHYSICS LAB / 01</span>
    </header>
    <section className="heading">
      <div><p className="eyebrow">IMPULSION · INERTIE · COLLISION</p><h1>Ball Thrust <span>3D</span></h1>
        <p>Pilotez la sphère cyan jusqu’à la balise verte. Anticipez l’inertie.</p></div>
      <div className="badge">RAPIER<span>Simulation réelle · 60 Hz</span></div>
    </section>
    <div className="layout">
      <div className="viewport" ref={arena} tabIndex={0} role="region" aria-label="Arène Ball Thrust, contrôles clavier" aria-describedby="controls"
        onPointerDown={() => arena.current?.focus()} onBlur={() => keys.current.clear()}>
        <div className="scene-label">ARÈNE 12 × 12 m <span>VUE ORBITALE</span></div>
        <SceneErrorBoundary>
          <Scene generation={generation} seed={seed} keys={keys.current} onUpdate={setTelemetry} />
        </SceneErrorBoundary>
        <div className="legend"><span>● Sphère</span><span>◆ Cible</span><span>■ Obstacles</span></div>
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
          <p className="eyebrow">COMMANDES</p>
          <p><kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> ou <b>ZQSD / WASD</b></p>
          <p>Combinez deux axes pour les diagonales. Haut = −z, droite = +x, quelle que soit la caméra.</p>
          <p><kbd>Espace</kbd> ou relâcher = no-op. L’inertie continue ; la direction opposée freine.</p>
          <p>Sélectionnez l’arène avec un clic ou Tab. Glissez pour orbiter, molette pour zoomer.</p>
        </section>
        <form className="panel" onSubmit={(event) => {
          event.preventDefault();
          const value = Number(new FormData(event.currentTarget).get('seed'));
          if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
            setSeedError('Entrez un entier entre 0 et 4294967295.');
            return;
          }
          keys.current.clear();
          setSeedError('');
          setTelemetry(null);
          setSeed(value);
          setGeneration((current) => current + 1);
          arena.current?.focus();
        }}>
          <label htmlFor="seed">Graine du monde</label>
          <div className="reset"><input id="seed" name="seed" type="number" min="0" max="4294967295" step="1" required defaultValue="70" />
            <button type="submit">Réinitialiser ↺</button></div>
          {seedError && <p role="alert">{seedError}</p>}
          <p>Même graine, même départ. Le reset recrée le monde physique et remet le chrono à zéro.</p>
        </form>
      </aside>
    </div>
    <footer><span>01 / JEU PHYSIQUE</span><span>Sans IA · Impulsions 10 Hz · Masse 1 kg · Aucun déplacement cinématique</span></footer>
  </main>;
}
