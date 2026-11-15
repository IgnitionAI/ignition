import { ACTIONS, PARAMETERS as P } from './simulation-contract';
import { PD_GAINS } from './pd-controller';
import type { DockRuntime } from './runtime';
export default function Hud({ runtime }: { runtime: DockRuntime }) {
  const t = runtime.env.telemetry;
  return <section aria-label="Télémétrie">
    <dl className="metrics">
      <div><dt>Temps simulé</dt><dd>{t.elapsed.toFixed(1)} / 90 s</dd></div>
      <div><dt>Distance cargo → but</dt><dd>{t.distance.toFixed(2)} m</dd></div>
      <div><dt>Vitesse cargo</dt><dd>{Math.hypot(t.cargo.velocity.x, t.cargo.velocity.z).toFixed(2)} m/s</dd></div>
      <div><dt>Erreur lacet</dt><dd>{(t.yawError * 180 / Math.PI).toFixed(1)}°</dd></div>
      <div><dt>Vitesse angulaire</dt><dd>{t.cargo.angularVelocity.y.toFixed(3)} rad/s</dd></div>
      <div><dt>Maintien continu</dt><dd>{t.holdSeconds.toFixed(2)} / 1,50 s</dd></div>
      <div><dt>Résultat</dt><dd>{t.outcome}</dd></div>
      <div><dt>Contacts nouveaux</dt><dd>{t.contacts}</dd></div>
      <div><dt>Commande</dt><dd>{ACTIONS[t.action]}</dd></div>
      <div><dt>Force / couple</dt><dd>{Math.hypot(t.force.x, t.force.z).toFixed(0)} N / {t.torque.toFixed(0)} Nm</dd></div>
      <div><dt>Récompense transition</dt><dd>{t.reward.toFixed(4)}</dd></div>
    </dl>
    <p>Objectif : ≤ 0,45 m · ≤ 8° · ≤ 0,20 m/s · ≤ 0,10 rad/s pendant 1,5 s.</p>
    <details><summary>Paramètres et interface d’apprentissage</summary>
      <p>Microgravité, amortissement nul. Cargo 300 kg + remorqueur 120 kg. Joint fixe, bras sans masse.
        Collisions réelles ; aucun détecteur d’impact dur qualifié. Limites : |x| ≤ 14 m, |z| ≤ 9 m.</p>
      <p>Physique 60 Hz, actions 10 Hz ({P.substeps} sous-pas). Poussée {P.thrust} N, latérale {P.lateralThrust} N,
        couple {P.torque} Nm. Frein : −840 v, −1315 ω, bornés à 600 N / 300 Nm.</p>
      <p>PD NON ENTRAÎNÉ : Kp {PD_GAINS.position}, Kd {PD_GAINS.velocity}, lacet Kp {PD_GAINS.yaw}, Kd {PD_GAINS.angularVelocity}.
        Qualification limitée aux départs axiaux seedés, sans évitement d’obstacles.</p>
      <p>Contrat TrainingEnv disponible : 26 observations normalisées, 8 actions discrètes.
        Aucun entraînement ni checkpoint livré. Récompense : progression signée + orientation, coûts temps/poussée/contact, bonus terminal unique.</p>
    </details>
    <details><summary>Historique des 64 dernières transitions</summary><ol>
      {runtime.history.map((r, i) => <li key={`${r.elapsed}-${i}`}>{r.elapsed.toFixed(2)} s · {ACTIONS[r.action]} · r={r.reward.toFixed(4)}</li>)}
    </ol></details>
  </section>;
}
