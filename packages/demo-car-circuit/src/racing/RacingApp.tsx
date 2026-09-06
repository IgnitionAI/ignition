import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useProgress } from "@react-three/drei";
import { DrivingWorld } from "./driving";
import { RacingScene } from "./RacingScene";
import "./racing.css";

const copy = {
  fr: {
    garage: "Garage",
    drive: "Essais libres",
    training: "Entraîner",
    race: "Course",
    tag: "LE LABORATOIRE DES PILOTES",
    title: "Votre voiture.\nVotre trajectoire.",
    intro:
      "Prenez le volant sur Alpine Park. Familiarisez-vous avec le circuit avant d’entraîner votre premier pilote.",
    vehicle: "VÉHICULE",
    racecar: "Formule R",
    sedan: "Sport GT",
    equal: "Même physique. Deux caractères.",
    start: "Prendre le volant",
    pause: "Pause",
    resume: "Reprendre",
    reset: "Retour aux stands",
    controls: "COMMANDES",
    gas: "Accélérer",
    brake: "Freiner",
    steer: "Tourner",
    track: "ALPINE PARK",
    layout: "10 virages · Circuit école",
    mode: "ESSAIS LIBRES",
    hint: "Accélérez avec ↑ ou Z. Freinez avant le virage.",
    loading: "Préparation du véhicule…",
    error: "Le véhicule n’a pas pu être chargé.",
    retry: "Réessayer",
    coming: "Disponible après les essais",
    paused: "Session en pause",
    pausedHint: "Reprenez quand vous êtes prêt.",
    speed: "VITESSE",
    local: "LOCAL · NAVIGATEUR",
  },
  en: {
    garage: "Garage",
    drive: "Free practice",
    training: "Train",
    race: "Race",
    tag: "THE DRIVER LAB",
    title: "Your car.\nYour racing line.",
    intro:
      "Take the wheel at Alpine Park. Learn the circuit before training your first driver.",
    vehicle: "VEHICLE",
    racecar: "Formula R",
    sedan: "Sport GT",
    equal: "Same physics. Two characters.",
    start: "Start driving",
    pause: "Pause",
    resume: "Resume",
    reset: "Back to pits",
    controls: "CONTROLS",
    gas: "Accelerate",
    brake: "Brake",
    steer: "Steer",
    track: "ALPINE PARK",
    layout: "10 corners · Training circuit",
    mode: "FREE PRACTICE",
    hint: "Accelerate with ↑ or W. Brake before the corner.",
    loading: "Preparing your vehicle…",
    error: "The vehicle could not be loaded.",
    retry: "Retry",
    coming: "Available after practice",
    paused: "Session paused",
    pausedHint: "Resume when you are ready.",
    speed: "SPEED",
    local: "LOCAL · BROWSER",
  },
};
class SceneBoundary extends Component<
  { children: ReactNode; message: string; retry: string },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="race-error">
        <p>{this.props.message}</p>
        <button onClick={() => location.reload()}>{this.props.retry}</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Loading({ label }: { label: string }) {
  const { active, progress } = useProgress();
  return active ? (
    <div className="race-loading" role="status">
      <span>{label}</span>
      <progress max={100} value={progress} />
    </div>
  ) : null;
}
export default function RacingApp() {
  const [lang, setLang] = useState<"fr" | "en">("fr"),
    t = copy[lang];
  const [world] = useState(() => new DrivingWorld());
  const keys = useRef(new Set<string>()).current;
  const [started, setStarted] = useState(false),
    [paused, setPaused] = useState(true),
    [model, setModel] = useState("race"),
    [speed, setSpeed] = useState(0);
  useEffect(() => {
    const handled = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyZ",
      "KeyQ",
    ]);
    const down = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        keys.clear();
        setPaused(true);
        return;
      }
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)
      )
        return;
      if (handled.has(e.code)) {
        e.preventDefault();
        keys.add(e.code);
      }
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => {
      keys.clear();
      setPaused(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", blur);
      keys.clear();
    };
  }, [keys]);
  return (
    <div className="racing-app">
      <header className="race-header">
        <a href="/" className="race-brand">
          ignition<span> / RACING</span>
        </a>
        <nav aria-label="Modes">
          <span className="active">{t.drive}</span>
          <button disabled title={t.coming}>
            {t.training}
          </button>
          <button disabled title={t.coming}>
            {t.race}
          </button>
        </nav>
        <button
          className="language"
          onClick={() => {
            keys.clear();
            setPaused(true);
            setLang(lang === "fr" ? "en" : "fr");
          }}
        >
          {lang.toUpperCase()} ↔
        </button>
      </header>
      <main className="race-layout">
        <aside className="race-sidebar">
          <div className="eyebrow">{t.tag}</div>
          <h1>
            {t.title.split("\n").map((s, i) => (
              <span key={i}>
                {s}
                <br />
              </span>
            ))}
          </h1>
          <p className="race-intro">{t.intro}</p>
          <div className="vehicle-label">{t.vehicle}</div>
          <div className="vehicle-options">
            {[
              ["race", t.racecar, "01"],
              ["sedan-sports", t.sedan, "02"],
            ].map(([id, label, index]) => (
              <button
                key={id}
                className={model === id ? "selected" : ""}
                onClick={() => {
                  keys.clear();
                  setPaused(true);
                  setModel(id);
                }}
                aria-pressed={model === id}
              >
                <span>{index}</span>
                {label}
                <b>{model === id ? "↗" : "+"}</b>
              </button>
            ))}
          </div>
          <p className="muted">{t.equal}</p>
          <button
            className="drive-button"
            onClick={() => {
              keys.clear();
              setStarted(true);
              setPaused(!paused);
              (document.activeElement as HTMLElement)?.blur();
            }}
          >
            {!started ? t.start : paused ? t.resume : t.pause}
            <span>↗</span>
          </button>
          <button
            className="reset-button"
            onClick={() => {
              keys.clear();
              world.reset();
              setSpeed(0);
              setPaused(true);
              setStarted(false);
            }}
          >
            {t.reset}
          </button>
          <div className="race-controls">
            <div className="vehicle-label">{t.controls}</div>
            <p>
              <kbd>↑ / Z / W</kbd>
              <span>{t.gas}</span>
            </p>
            <p>
              <kbd>↓ / S</kbd>
              <span>{t.brake}</span>
            </p>
            <p>
              <kbd>← →</kbd>
              <span>{t.steer}</span>
            </p>
            <p>
              <kbd>ESC</kbd>
              <span>{t.pause}</span>
            </p>
          </div>
          <div className="local-badge">
            <i />
            {t.local}
          </div>
        </aside>
        <section className="race-viewport" aria-label={t.track}>
          <SceneBoundary message={t.error} retry={t.retry}>
            <RacingScene
              world={world}
              keys={keys}
              paused={paused}
              model={model}
              onStats={setSpeed}
            />
          </SceneBoundary>
          <Loading label={t.loading} />
          <div className="track-label">
            <span>{t.track}</span>
            <small>{t.layout}</small>
          </div>
          <div className="session-pill">
            <i />
            {t.mode}
          </div>
          {started && paused && (
            <div className="pause-overlay">
              <h2>{t.paused}</h2>
              <p>{t.pausedHint}</p>
              <button
                onClick={() => {
                  keys.clear();
                  setPaused(false);
                  (document.activeElement as HTMLElement)?.blur();
                }}
              >
                {t.resume} →
              </button>
            </div>
          )}
          <div className="driving-hint">{t.hint}</div>
          <div className="speedometer">
            <span>{t.speed}</span>
            <strong>{Math.round(speed).toString().padStart(3, "0")}</strong>
            <small>KM/H</small>
            <div className="speed-track">
              <i style={{ width: `${(speed / 115) * 100}%` }} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
