import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { LearnedRace, type RaceEntry } from "./learned-race";
import { type SavedDriver } from "./training";
import { loadGarage } from "./garage";
const backendReady = tf.setBackend("cpu");

export default function RaceGarage({
  lang,
  onStart,
  onPractice,
}: {
  lang: "fr" | "en";
  onStart: (race: LearnedRace) => void;
  onPractice: (references: boolean) => void;
}) {
  const fr = lang === "fr";
  const [drivers, setDrivers] = useState<SavedDriver[]>([]),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false);
  const [slots, setSlots] = useState(["bundled-11", "bundled-29"]);
  const [models, setModels] = useState<("race" | "sedan-sports")[]>([
    "race",
    "sedan-sports",
    "race",
    "sedan-sports",
  ]);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      await backendReady;
      const garage = await loadGarage({
        storage: localStorage,
        base: import.meta.env.BASE_URL,
      });
      if (mounted) {
        setDrivers(garage.drivers);
        setError(garage.errors.join(" · "));
        setReady(true);
      }
    })().catch((e) => {
      if (mounted) setError(String(e));
    });
    return () => {
      mounted = false;
    };
  }, [fr]);
  const start = () => {
    try {
      const entries: RaceEntry[] = slots.map((id, i) => {
        const saved = drivers.find((d) => d.id === id);
        if (!saved)
          throw new Error(
            fr ? "Choisissez un pilote valide." : "Choose a valid driver.",
          );
        return {
          id: saved.id,
          name: saved.name,
          model: models[i],
          checkpoint: saved.checkpoint,
        };
      });
      const session = new LearnedRace(entries);
      onStart(session);
      setError("");
      (document.activeElement as HTMLElement)?.blur();
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <div className="training-panel">
      <div className="eyebrow">
        {fr ? "LA GRILLE DE DÉPART" : "THE STARTING GRID"}
      </div>
      <h1>
        {fr ? "Les pilotes\nentrent en piste." : "Drivers take\nthe track."}
      </h1>
      <p className="race-intro">
        {fr
          ? "Choisissez 2 à 4 checkpoints. Chaque voiture utilise sa propre copie figée du réseau appris."
          : "Choose 2–4 checkpoints. Every car uses its own frozen copy of the learned network."}
      </p>
      <label>
        {fr ? "Nombre de pilotes" : "Driver count"}
        <select
          value={slots.length}
          onChange={(e) =>
            setSlots(
              Array.from(
                { length: Number(e.target.value) },
                (_, i) => slots[i] ?? `bundled-${[11, 29, 47][i % 3]}`,
              ),
            )
          }
        >
          {[2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {slots.map((id, i) => {
        const selected = drivers.find((d) => d.id === id);
        return (
          <div className="grid-driver" key={i}>
            <label>
              {fr ? "Pilote" : "Driver"} {i + 1}
              <select
                disabled={!ready}
                value={drivers.some((d) => d.id === id) ? id : ""}
                onChange={(e) =>
                  setSlots(slots.map((v, j) => (j === i ? e.target.value : v)))
                }
              >
                <option value="">
                  {fr ? "Choisir un pilote" : "Choose a driver"}
                </option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {fr ? "Véhicule" : "Vehicle"} {i + 1}
              <select
                value={models[i]}
                onChange={(e) =>
                  setModels(
                    models.map((v, j) =>
                      j === i ? (e.target.value as "race" | "sedan-sports") : v,
                    ),
                  )
                }
              >
                <option value="race">Formule R</option>
                <option value="sedan-sports">Sport GT</option>
              </select>
            </label>
            {selected && (
              <small>
                {selected.reports.filter((r) => r.success).length}/
                {selected.reports.length}{" "}
                {fr ? "évaluations réussies" : "successful evaluations"} ·{" "}
                {selected.id}
              </small>
            )}
          </div>
        );
      })}
      <div className="training-actions">
        <button className="drive-button" disabled={!ready} onClick={start}>
          {fr ? "Lancer la course IA" : "Start AI race"}
        </button>
      </div>
      <p className="race-intro">
        {fr
          ? "Les pilotes fournis sont imparfaits : leurs échecs d’évaluation restent visibles. Aucun contrôleur à règles ne les remplace."
          : "Bundled drivers are imperfect: evaluation failures remain visible. No rule controller replaces them."}
      </p>
      <button className="reset-button" onClick={() => onPractice(false)}>
        {fr ? "Course solo au clavier" : "Solo keyboard race"}
      </button>
      <button className="reset-button" onClick={() => onPractice(true)}>
        {fr ? "Observer les références à règles" : "Watch rule references"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
