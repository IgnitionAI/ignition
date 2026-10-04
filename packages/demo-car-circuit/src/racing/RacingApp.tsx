import {
  lazy,
  Suspense,
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useProgress } from "@react-three/drei";
import { RaceWorld, RACE_PROTOCOL } from "./race";
import { DrivingWorld } from "./driving";
import { RaceMap } from "./RaceMap";
import { RacingScene } from "./RacingScene";
import "./racing.css";

import type { LearnedRace } from "./learned-race";
const RaceGarage = lazy(() => import("./RaceGarage"));
const TrainingPanel = lazy(() => import("./TrainingPanel"));

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
  const [world, setWorld] = useState(() => new DrivingWorld());
  const [race, setRace] = useState<RaceWorld>();
  const [reference, setReference] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [garageMode, setGarageMode] = useState(false);
  const [preferredDriver, setPreferredDriver] = useState<string>();
  const [learned, setLearned] = useState<LearnedRace>();
  const [follow, setFollow] = useState(0);
  const displayedDriver = race?.drivers[learned ? follow : 0];
  useEffect(() => () => learned?.dispose(), [learned]);
  const [, updateHUD] = useState(0);
  const resetSession = (competitive: boolean, references = false) => {
    setTrainingMode(false);
    setGarageMode(false);
    setLearned(undefined);
    setFollow(0);
    const next = competitive
      ? new RaceWorld({ count: references ? 4 : 1 })
      : undefined;
    setReference(references);
    setRace(next);
    setWorld(next ? next.drivers[0].world : new DrivingWorld());
    keys.clear();
    setSpeed(0);
    setPaused(true);
    setStarted(false);
  };
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
          <button
            className={!race && !trainingMode && !garageMode ? "active" : ""}
            onClick={() => resetSession(false)}
          >
            {t.drive}
          </button>
          <button
            className={trainingMode ? "active" : ""}
            onClick={() => {
              keys.clear();
              setPaused(true);
              setRace(undefined);
              setStarted(false);
              setTrainingMode(true);
              setGarageMode(false);
              setLearned(undefined);
              setFollow(0);
            }}
          >
            {t.training}
          </button>
          <button
            className={race || garageMode ? "active" : ""}
            onClick={() => {
              keys.clear();
              setPaused(true);
              setTrainingMode(false);
              setGarageMode(true);
            }}
          >
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
          {garageMode ? (
            <Suspense fallback={<p>{t.loading}</p>}>
              <RaceGarage
                initialDriverId={preferredDriver}
                onConfigure={() => {
                  keys.clear();
                  setPaused(true);
                }}
                lang={lang}
                onPractice={(r) => resetSession(true, r)}
                onStart={(session) => {
                  keys.clear();
                  setLearned(session);
                  setRace(session.race);
                  setWorld(session.race.drivers[0].world);
                  setFollow(0);
                  setStarted(true);
                  setPaused(false);
                  setReference(false);
                }}
              />
            </Suspense>
          ) : trainingMode ? (
            <Suspense fallback={<p>{t.loading}</p>}>
              <TrainingPanel lang={lang} onWorld={setWorld} onRace={(id) => { setPreferredDriver(id); setTrainingMode(false); setGarageMode(true); setWorld(new DrivingWorld()); setSpeed(0); setPaused(true); keys.clear(); }} />
            </Suspense>
          ) : (
            <>
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
                  resetSession(!!race, reference);
                }}
              >
                {t.reset}
              </button>
              {race && (
                <button
                  className="reset-button"
                  onClick={() => resetSession(true, !reference)}
                >
                  {reference
                    ? lang === "fr"
                      ? "Piloter en solo"
                      : "Drive solo"
                    : lang === "fr"
                      ? "Observer 4 références à règles"
                      : "Watch 4 rule-based references"}
                </button>
              )}
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
            </>
          )}
        </aside>
        <section className="race-viewport" aria-label={t.track}>
          {!trainingMode && !garageMode && !reference && (!learned || learned.human) && (
            <button className="recovery-button" disabled={!!race && (race.finished || race.countdown > 0)} onClick={() => {
              keys.clear();
              if (race) race.rescue(0);
              else {
                const p = world.track.nearest(world.car.x, world.car.z);
                Object.assign(world.car, {x:p.x,z:p.z,angle:p.angle,speed:0,steering:0});
              }
              setSpeed(0);
              updateHUD(n => n + 1);
              (document.activeElement as HTMLElement)?.blur();
            }}>
              {lang === "fr" ? "Remettre sur piste" : "Return to track"}{race ? " (+5 s)" : ""}
            </button>
          )}
          <SceneBoundary message={t.error} retry={t.retry}>
            <RacingScene
              world={learned ? learned.race.drivers[follow].world : world}
              keys={keys}
              paused={paused}
              model={model}
              race={race}
              reference={reference}
              learned={learned}
              onStats={(value) => {
                setSpeed(value);
                updateHUD((n) => n + 1);
              }}
            />
          </SceneBoundary>
          <Loading label={t.loading} />
          {race && <RaceMap race={race} follow={learned ? follow : 0} />}
          {learned && (
            <div className="spectator-controls">
              <label>
                {lang === "fr" ? "Caméra" : "Camera"}
                <select
                  disabled={learned.human}
                  value={follow}
                  onChange={(e) => setFollow(Number(e.target.value))}
                >
                  {learned.competitors.map((entry, i) => (
                    <option key={i} value={i}>
                      {entry.id === "player" ? (lang === "fr" ? "Vous" : "You") : entry.name}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => {keys.clear();setPaused(!paused);(document.activeElement as HTMLElement)?.blur();}}>
                {paused ? t.resume : t.pause}
              </button>
            </div>
          )}

          <div className="track-label">
            <span>{t.track}</span>
            <small>{trainingMode ? (lang === "fr" ? "Aperçu par session · apprentissage accéléré" : "Session snapshot · accelerated learning") : t.layout}</small>
          </div>
          <div className="session-pill">
            <i />
            {race
              ? `${reference ? (lang === "fr" ? "RÉFÉRENCES À RÈGLES" : "RULE-BASED REFERENCES") : t.race} · ${Math.min(3, race.drivers[learned ? follow : 0].laps + 1)}/3`
              : trainingMode
                ? t.training
                : t.mode}
          </div>
          {race && started && !paused && race.countdown > 0 && (
            <div className="race-countdown" role="status">
              {Math.ceil(race.countdown)}
            </div>
          )}
          {race && (
            <div className="race-timing">
              {race.standings.findIndex(
                (d) => d.id === (learned ? follow : 0),
              ) + 1}
              /{race.drivers.length} · {(race.elapsedTicks / 60).toFixed(1)} s ·
              +{race.drivers[learned ? follow : 0].penaltySeconds} s
              <br />
              <span>{lang === "fr" ? "Tour" : "Lap"} {Math.min(3, race.drivers[learned ? follow : 0].laps + 1)}/3</span>
              {!race.finished && race.drivers[learned ? follow : 0].finishSeconds === null && <small className="race-next-pass">{lang === "fr" ? "Passage suivant" : "Next gate"} {(race.drivers[learned ? follow : 0].gates % RACE_PROTOCOL.checkpoints) + 1}/{RACE_PROTOCOL.checkpoints}</small>}
              {race.ghost && <small className="ghost-race-label">{lang === "fr" ? "MODE FANTÔME" : "GHOST MODE"}</small>}
            </div>
          )}
          {race?.finished && displayedDriver && (
            <div className="pause-overlay">
              <h2>{lang === "fr" ? "Résultat" : "Result"}</h2>
              {race.ghost && <p>{lang === "fr" ? "Course en mode fantôme" : "Ghost race"}</p>}
              {learned && <p>{learned.competitors[follow].name}</p>}
              <p>
                {displayedDriver.finishSeconds === null
                  ? lang === "fr"
                    ? "Temps limite atteint"
                    : "Time limit reached"
                  : `${displayedDriver.finishSeconds.toFixed(2)} s · 3/3`}
              </p>
              <p>
                {lang === "fr" ? "Remises en piste" : "Rescues"}:{" "}
                {displayedDriver.rescues} (+
                {race.drivers[learned ? follow : 0].penaltySeconds} s)
              </p>
              <ol>
                {race.standings.map((d) => (
                  <li key={d.id}>
                    <span className="result-driver">
                      {learned?.competitors[d.id]?.name ?? `#${d.id + 1}`}
                      {learned && <small>{learned.competitors[d.id].id}</small>}
                    </span>
                    <span className="result-time">{d.finishSeconds === null ? "DNF" : `${d.finishSeconds.toFixed(2)} s`}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => {
                  if (learned) {
                    setGarageMode(true);
                    setPaused(true);
                    setStarted(false);
                    setLearned(undefined);
                    setRace(undefined);
                  } else resetSession(true, reference);
                }}
              >
                {t.reset}
              </button>
            </div>
          )}
          {started && paused && !race?.finished && (
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
          <div className="driving-hint">
            {learned && !learned.human
              ? lang === "fr"
                ? "Course de réseaux appris · poids figés"
                : "Learned networks racing · frozen weights"
              : trainingMode
                ? lang === "fr"
                  ? "Trajectoires collectées pendant l’apprentissage"
                  : "Trajectories collected during learning"
                : t.hint}
          </div>
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
