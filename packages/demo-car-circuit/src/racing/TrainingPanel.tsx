import * as tf from "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import { LearnedDriver } from "./learned-driver";
import {
  trainDriver,
  evaluateDriver,
  listDrivers,
  saveDriver,
  type SavedDriver,
  type DriverEvaluation,
} from "./training";
import { DrivingWorld } from "./driving";

const backendReady = tf.setBackend("cpu");

export default function TrainingPanel({
  lang,
  onWorld,
}: {
  lang: "fr" | "en";
  onWorld: (world: DrivingWorld) => void;
}) {
  const fr = lang === "fr";
  const agent = useRef<LearnedDriver | undefined>(undefined);
  const operation = useRef<Promise<void> | null>(null),
    controller = useRef<AbortController | undefined>(undefined);
  const [status, setStatus] = useState("idle"),
    [error, setError] = useState(""),
    [seed, setSeed] = useState(11);
  const [progress, setProgress] = useState({
    round: 0,
    loss: null as number | null,
    samples: 0,
    traffic: false,
  });
  const [records, setRecords] = useState<SavedDriver[]>([]),
    [reports, setReports] = useState<DriverEvaluation[]>([]);
  const [selected, setSelected] = useState(""),
    [saved, setSaved] = useState("");
  const [ready, setReady] = useState(false);
  const busy = !ready || status === "training" || status === "evaluating";
  useEffect(() => {
    let mounted = true;
    void backendReady
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch((e) => {
        if (mounted) setError(String(e));
      });
    try {
      setRecords(listDrivers());
    } catch (e) {
      setError(String(e));
    }
    return () => {
      mounted = false;
      controller.current?.abort();
      const old = agent.current;
      void (operation.current ?? Promise.resolve()).finally(() =>
        old?.dispose(),
      );
    };
  }, []);
  const start = (fresh: boolean) => {
    if (busy) return;
    if (fresh || !agent.current) {
      agent.current?.dispose();
      agent.current = new LearnedDriver(seed);
      setReports([]);
      setSaved("");
    }
    setReports([]);
    setSaved("");

    const driver = agent.current;
    setSeed(driver.seed);
    setProgress({round:0,loss:null,samples:driver.samples,traffic:driver.updates>=24});
    controller.current = new AbortController();
    setError("");
    setStatus("training");
    operation.current = trainDriver(driver, {
      seed: driver.seed,
      rounds: 16,
      signal: controller.current.signal,
      onWorld: (r) => onWorld(r.drivers[0].world),
      onProgress: setProgress,
    })
      .catch((e) => setError(String(e)))
      .finally(() => setStatus("idle"));
  };
  const evaluate = () => {
    if (!agent.current || busy) return;
    const frozen = LearnedDriver.fromCheckpoint(
      agent.current.exportCheckpoint(),
    );
    controller.current = new AbortController();
    setError("");
    setStatus("evaluating");
    setReports([]);
    operation.current = (async () => {
      const results: DriverEvaluation[] = [];
      try {
        for (const test of [false, true])
          for (const traffic of [false, true])
            for (const evaluationSeed of [101, 307, 509]) {
              results.push(
                await evaluateDriver(frozen, {
                  seed: evaluationSeed,
                  test,
                  traffic,
                  signal: controller.current!.signal,
                }),
              );
              setReports([...results]);
            }
      } finally {
        frozen.dispose();
      }
    })()
      .catch((e) => {
        if (!controller.current?.signal.aborted) setError(String(e));
      })
      .finally(() => setStatus("idle"));
  };
  const save = () => {
    if (!agent.current || busy) return;
    try {
      const id = `driver-${agent.current.seed}-${Date.now()}`;
      saveDriver({
        id,
        name: `Pilote ${agent.current.seed} · ${agent.current.updates}`,
        checkpoint: agent.current.exportCheckpoint(),
        reports,
      });
      setRecords(listDrivers());
      setSelected(id);
      setSaved(
        fr
          ? "Pilote sauvegardé dans ce navigateur."
          : "Driver saved in this browser.",
      );
      setError("");
    } catch (e) {
      setError(String(e));
    }
  };
  const load = () => {
    const record = records.find((r) => r.id === selected);
    if (!record || busy) return;
    try {
      const loaded = LearnedDriver.fromCheckpoint(record.checkpoint);
      agent.current?.dispose();
      agent.current = loaded;
      setSeed(loaded.seed);
      setReports(record.reports);
      setProgress({
        round: 0,
        loss: null as number | null,
        samples: loaded.samples,
        traffic: loaded.updates >= 24,
      });
      setError("");
      setSaved(
        fr
          ? "Poids rechargés. La reprise recrée l’optimiseur."
          : "Weights loaded. Resuming creates a fresh optimizer.",
      );
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <div className="training-panel">
      <div className="eyebrow">
        {fr ? "APPRENDRE À PILOTER" : "LEARN TO DRIVE"}
      </div>
      <h1>
        {fr
          ? "Un vrai pilote.\nDes progrès mesurés."
          : "A real driver.\nMeasured progress."}
      </h1>
      <p className="race-intro">
        {fr
          ? "Imitation · réseau de neurones. Il apprend sur Alpine Park, seul puis avec du trafic de référence figé. En course, seul le réseau décide."
          : "Imitation · neural network. Learn at Alpine Park, solo then with frozen reference traffic. Only the network decides during races."}
      </p>
      <label>
        {fr ? "Graine" : "Seed"}{" "}
        <input
          type="number"
          min="1"
          max="1000000"
          value={seed}
          disabled={busy}
          onChange={(e) =>
            setSeed(
              Math.max(
                1,
                Math.min(1000000, Math.round(Number(e.target.value)) || 1),
              ),
            )
          }
        />
      </label>
      <div className="training-actions">
        <button
          className="drive-button"
          disabled={busy}
          onClick={() => start(true)}
        >
          {fr ? "Nouveau pilote" : "New driver"}
        </button>
        <button disabled={busy || !agent.current} onClick={() => start(false)}>
          {fr ? "Reprendre les poids" : "Resume weights"}
        </button>
        <button disabled={!busy} onClick={() => controller.current?.abort()}>
          {fr ? "Arrêter" : "Stop"}
        </button>
      </div>
      <div className="training-metrics" role="status">
        <strong>
          {status === "training"
            ? fr
              ? "Entraînement"
              : "Training"
            : status === "evaluating"
              ? fr
                ? "Évaluation figée"
                : "Frozen evaluation"
              : fr
                ? "Prêt"
                : "Ready"}
        </strong>
        <p>
          {progress.round}/16 · {progress.samples.toLocaleString(lang)}{" "}
          {fr ? "exemples" : "samples"}
        </p>
        <p>
          {fr ? "Erreur d’imitation" : "Imitation loss"}:{" "}
          {progress.loss === null ? "—" : progress.loss.toFixed(4)}
        </p>
        <small>
          {progress.traffic
            ? fr
              ? "Trafic de référence"
              : "Reference traffic"
            : "Solo"}
        </small>
      </div>
      <div className="training-actions">
        <button disabled={busy || !agent.current} onClick={evaluate}>
          {fr ? "Évaluer les deux circuits" : "Evaluate both tracks"}
        </button>
        <button disabled={busy || !agent.current} onClick={save}>
          {fr ? "Sauvegarder" : "Save"}
        </button>
      </div>
      {reports.length > 0 && (
        <div className="training-metrics">
          <strong>
            {reports.filter((r) => r.success).length}/{reports.length}{" "}
            {fr ? "courses réussies" : "successful races"}
          </strong>
          <p>
            {fr
              ? "Réussite = 3 tours, aucune remise en piste, pénalité ≤ 10 s."
              : "Success = 3 laps, no rescue, penalty ≤ 10 s."}
          </p>
          <ul>
            {reports.map((r) => (
              <li key={`${r.test}-${r.traffic}-${r.seed}`}>
                {r.test ? "Harbour" : "Alpine"} · {r.traffic ? "×4" : "solo"} ·{" "}
                {r.seed}:{" "}
                {r.completed
                  ? `${r.finishSeconds?.toFixed(1)} s`
                  : fr
                    ? "inachevé"
                    : "unfinished"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <label>
        {fr ? "Garage local" : "Local garage"}
        <select
          value={selected}
          disabled={busy}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">
            {fr ? "Choisir un pilote" : "Choose a driver"}
          </option>
          {records.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="reset-button"
        disabled={busy || !selected}
        onClick={load}
      >
        {fr ? "Recharger ce pilote" : "Load this driver"}
      </button>
      {saved && <p role="status">{saved}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
