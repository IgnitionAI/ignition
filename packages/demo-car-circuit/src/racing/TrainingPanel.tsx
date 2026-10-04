import * as tf from "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import { trainQDriver } from "./q-training";
import { Q_PROTOCOL } from "./q-protocol";
import { LearnedDriver, type DriverCheckpoint } from "./learned-driver";
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
  onRace,
}: {
  lang: "fr" | "en";
  onWorld: (world: DrivingWorld) => void;
  onRace: (id: string) => void;
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
  const [algorithm, setAlgorithm] = useState<DriverCheckpoint["algorithm"]>("imitation-mlp");
  const [savedId, setSavedId] = useState("");
  const [ready, setReady] = useState(false);
  const activeAlgorithm = agent.current?.algorithm ?? algorithm;
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
      void (operation.current ?? Promise.resolve()).finally(() =>
        agent.current?.dispose(),
      );
    };
  }, []);
  const start = (fresh: boolean) => {
    if (busy) return;
    if (fresh || !agent.current) {
      agent.current?.dispose();
      agent.current = new LearnedDriver(seed, algorithm);
      setReports([]);
      setSaved("");
    }
    setReports([]);
    setSaved("");
    setSavedId("");

    const driver = agent.current;
    setSeed(driver.seed);
    setAlgorithm(driver.algorithm);
    setProgress({round:0,loss:null,samples:driver.samples,traffic:driver.algorithm === "imitation-mlp" ? driver.updates>=24 : driver.samples>=Q_PROTOCOL.trafficAfterTransitions});
    controller.current = new AbortController();
    setError("");
    setStatus("training");
    const common = {
      signal: controller.current.signal,
      onWorld: (r: import("./race").RaceWorld) => onWorld(r.drivers[0].world),
      onProgress: setProgress,
    };
    operation.current = (driver.algorithm === "imitation-mlp"
      ? trainDriver(driver, { ...common, seed:driver.seed, rounds:16 })
      : trainQDriver(driver.exportCheckpoint(), common).then(checkpoint => {
        const updated = LearnedDriver.fromCheckpoint(checkpoint);
        driver.dispose();
        agent.current = updated;
      }))
      .catch((e) => setError(String(e)))
      .finally(() => {
        const currentDriver = agent.current;
        if (currentDriver) {
          setProgress((previous) => ({
            ...previous,
            samples: currentDriver.samples,
            loss: controller.current?.signal.aborted ? null : previous.loss,
          }));
        }
        setStatus("idle");
      });
  };
  const evaluate = () => {
    if (!agent.current || busy) return;
    const frozen = LearnedDriver.fromCheckpoint(
      agent.current.exportCheckpoint(),
    );
    controller.current = new AbortController();
    setError("");
    setStatus("evaluating");
    setSavedId("");
    setReports([]);
    operation.current = (async () => {
      const results: DriverEvaluation[] = [];
      try {
        for (const test of [false, true])
          for (const traffic of [false, true])
            for (const evaluationSeed of frozen.algorithm === "imitation-mlp" ? [101, 307, 509] : Q_PROTOCOL.evaluationSeeds) {
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
        name: `${agent.current.algorithm} · ${agent.current.seed} · ${agent.current.updates}`,
        checkpoint: agent.current.exportCheckpoint(),
        reports,
      });
      setRecords(listDrivers());
      setSelected(id);
      setSavedId(id);
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
      setSavedId(record.id);
      setSeed(loaded.seed);
      setAlgorithm(loaded.algorithm);
      setReports(record.reports);
      setProgress({
        round: 0,
        loss: null as number | null,
        samples: loaded.samples,
        traffic: loaded.algorithm === "imitation-mlp" ? loaded.updates >= 24 : loaded.samples >= Q_PROTOCOL.trafficAfterTransitions,
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
  const trained = !!agent.current?.samples;
  const totalTests = activeAlgorithm === "imitation-mlp" ? 12 : 20;
  const tested = reports.length === totalTests;
  const budget = activeAlgorithm === "imitation-mlp" ? 16 : Q_PROTOCOL.transitions;
  const step = savedId ? 4 : tested ? 3 : trained && status !== "training" ? 2 : 1;
  const heading = !ready ? (fr ? "Préparation…" : "Preparing…")
    : status === "training" ? (fr ? "Votre pilote apprend" : "Your driver is learning")
    : status === "evaluating" ? (fr ? "Votre pilote passe les tests" : "Testing your driver")
    : savedId ? (fr ? "Votre pilote est dans le garage" : "Your driver is in the garage")
    : tested ? (fr ? "Tests terminés" : "Tests complete")
    : trained ? (fr ? "Votre pilote peut être testé" : "Your driver is ready to test")
    : (fr ? "Créez votre premier pilote" : "Create your first driver");
  return (
    <div className="training-panel">
      <div className="eyebrow">{fr ? "VOTRE PILOTE IA" : "YOUR AI DRIVER"}</div>
      <h1>{fr ? "Apprendre. Tester. Courir." : "Learn. Test. Race."}</h1>
      <ol className="training-steps" aria-label={fr ? "Étapes" : "Steps"}>
        {(fr ? ["Entraîner", "Tester", "Sauver", "Courir"] : ["Train", "Test", "Save", "Race"]).map((label,i)=><li key={label} aria-current={step===i+1 ? "step" : undefined}>{i+1}. {label}</li>)}
      </ol>
      <div className="training-guide" role="status">
        <strong>{heading}</strong>
        <p>{status === "training"
          ? (fr ? "Il s’exerce en accéléré, d’abord seul puis avec d’autres voitures. Attendez la fin ou arrêtez pour garder ses progrès." : "It practices at accelerated speed, first alone and then in traffic. Wait or stop to keep its progress.")
          : status === "evaluating"
          ? (fr ? `${reports.length}/${totalTests} courses testées. Ses connaissances ne changent pas pendant les tests.` : `${reports.length}/${totalTests} races tested. Its weights stay frozen during testing.`)
          : savedId ? (fr ? "Passez à la course : votre pilote sera déjà sélectionné sur la grille." : "Open racing: your driver will already be selected on the grid.")
          : tested ? (fr ? `${reports.filter(r=>r.success).length}/${totalTests} courses réussies. Sauvegardez le pilote pour le retrouver en course.` : `${reports.filter(r=>r.success).length}/${totalTests} successful races. Save the driver to race it.`)
          : trained ? (fr ? "L’entraînement a produit un pilote, pas une garantie de réussite. Testez-le sur les deux circuits." : "Training produced a driver, not a guarantee of success. Test it on both tracks.")
          : (fr ? "Un clic lance l’apprentissage. Vous pourrez ensuite tester votre pilote et courir contre lui." : "One click starts learning. Then test your driver and race against it.")}</p>
        {status === "training" && <><progress aria-label={fr ? "Progression de l’entraînement" : "Training progress"} max={budget} value={progress.round}/><span>{Math.round(progress.round/budget*100)} % · {fr ? (progress.traffic ? "Avec du trafic" : "Conduite en solo") : (progress.traffic ? "With traffic" : "Solo driving")}</span></>}
        {status === "evaluating" && <progress aria-label={fr ? "Progression des tests" : "Evaluation progress"} max={totalTests} value={reports.length}/>}
      </div>
      <div className="training-actions">
        <button className="drive-button" disabled={busy} onClick={()=>savedId ? onRace(savedId) : tested ? save() : trained ? evaluate() : start(true)}>
          {savedId ? (fr ? "Faire courir mon pilote →" : "Race my driver →") : tested ? (fr ? "Sauvegarder mon pilote" : "Save my driver") : trained ? (fr ? "Tester mon pilote" : "Test my driver") : (fr ? "Entraîner mon pilote" : "Train my driver")}
        </button>
        {busy && ready && <button onClick={()=>controller.current?.abort()}>{fr ? "Arrêter" : "Stop"}</button>}
      </div>
      <p className="training-preview-note">{fr ? "La voiture à droite est un aperçu de trajectoire par session, pas une course en direct. Pour voir votre pilote conduire en continu, terminez ces étapes puis lancez une course." : "The car is a trajectory snapshot per session, not a live race. To watch continuous driving, complete these steps and launch a race."}</p>
      {!trained && <label>{fr ? "Comment apprendre ?" : "How should it learn?"}<select value={algorithm} disabled={busy} onChange={e=>setAlgorithm(e.target.value as DriverCheckpoint["algorithm"])}>
        <option value="imitation-mlp">{fr ? "Imiter un pilote de référence" : "Imitate a reference driver"}</option><option value="dqn">DQN · {fr ? "essais et récompenses" : "trial and reward"}</option><option value="double-dqn">Double DQN · {fr ? "essais et récompenses" : "trial and reward"}</option>
      </select></label>}
      {reports.length > 0 && <details className="training-details"><summary>{fr ? "Voir les résultats des courses" : "Race test results"} ({reports.length}/{totalTests})</summary><p>{fr ? "Réussite : 3 tours, sans remise en piste et avec au plus 10 s de pénalité." : "Success: 3 laps, no rescue and at most 10 s penalty."}</p><ul>{reports.map(r=><li key={`${r.test}-${r.traffic}-${r.seed}`}>{r.test ? "Harbour" : "Alpine"} · {r.traffic ? (fr ? "trafic" : "traffic") : "solo"} · {r.seed} : {r.success ? "✓" : "×"} {r.completed ? `${r.finishSeconds?.toFixed(1)} s` : (fr ? "non terminé" : "unfinished")}</li>)}</ul></details>}
      <details className="training-details"><summary>{fr ? "Réglages et détails techniques" : "Settings and technical details"}</summary>
        {trained && <label>{fr ? "Méthode d’un nouveau pilote" : "New driver method"}<select value={algorithm} disabled={busy} onChange={e=>setAlgorithm(e.target.value as DriverCheckpoint["algorithm"])}><option value="imitation-mlp">Imitation</option><option value="dqn">DQN</option><option value="double-dqn">Double DQN</option></select></label>}
        <label>{fr ? "Graine de départ" : "Starting seed"}<input type="number" min="1" max="1000000" value={seed} disabled={busy} onChange={e=>setSeed(Math.max(1,Math.min(1000000,Math.round(Number(e.target.value))||1)))}/></label>
        <p>{activeAlgorithm} · {progress.samples.toLocaleString(lang)} {fr ? "exemples / transitions" : "samples / transitions"}</p>
        {progress.loss !== null && <p>{fr ? "Erreur d’imitation" : "Imitation loss"} : {progress.loss.toFixed(4)}</p>}
        {trained && <div className="training-actions"><button disabled={busy} onClick={()=>start(false)}>{fr ? "Continuer l’entraînement" : "Continue training"}</button><button disabled={busy} onClick={()=>start(true)}>{fr ? "Recommencer avec un nouveau pilote" : "Start a new driver"}</button><button disabled={busy} onClick={save}>{fr ? "Sauvegarder sans attendre les tests" : "Save without waiting for tests"}</button><button disabled={busy} onClick={evaluate}>{fr ? "Refaire les tests" : "Run tests again"}</button></div>}
        <p><a href={`${import.meta.env.BASE_URL}reports/racing-q-v3/index.html`}>{fr ? "Comparer DQN et Double DQN ↗" : "Compare DQN and Double DQN ↗"}</a></p>
      </details>
      <details className="training-details"><summary>{fr ? "Retrouver un pilote sauvegardé" : "Load a saved driver"}</summary><label>{fr ? "Garage local" : "Local garage"}<select value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}><option value="">{fr ? "Choisir un pilote" : "Choose a driver"}</option>{records.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><button disabled={busy || !selected} onClick={load}>{fr ? "Charger ce pilote" : "Load this driver"}</button></details>
      {saved && <p role="status">{saved}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
