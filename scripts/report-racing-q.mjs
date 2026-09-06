import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
const source='.scratch/circuit-racing/q-comparison-v3';
const destination='packages/demo-car-circuit/src/public/reports/racing-q-v3';
const manifest=JSON.parse(await readFile(`${source}/protocol.json`,'utf8'));
const reports=[];
for(const algorithm of ['dqn','double-dqn'])for(const seed of manifest.protocol.seeds){
  const report=JSON.parse(await readFile(`${source}/report-${algorithm}-${seed}.json`,'utf8'));
  if(report.algorithm!==algorithm||report.seed!==seed||report.reports.length!==20||report.transitions!==manifest.protocol.transitions||report.backend!==manifest.backend)throw Error('Incomplete or incompatible benchmark');
  reports.push(report);
}
await mkdir(destination,{recursive:true});
const referencePath='packages/demo-car-circuit/src/racing/reference.ts';
const reference=await readFile(referencePath);
if(!reference.equals(execFileSync('/usr/bin/git',['show',`${manifest.head}:${referencePath}`])))throw Error('Reference controller changed since recorded HEAD');
const implementationCommit=execFileSync('/usr/bin/git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
for(const [path,hash] of Object.entries(manifest.sourceHashes)){
  if(createHash('sha256').update(execFileSync('/usr/bin/git',['show',`${implementationCommit}:${path}`])).digest('hex')!==hash)throw Error(`Committed source mismatch: ${path}`);
}
const additionalProvenance={implementationCommit,allRecordedSourcesVerifiedAtCommit:true,reference:{path:referencePath,sha256:createHash('sha256').update(reference).digest('hex'),verifiedIdenticalToRecordedHead:manifest.head,capturedAfterRun:true}};
await writeFile(`${destination}/results.json`,JSON.stringify({manifest,additionalProvenance,reports},null,2));
const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const std=xs=>Math.sqrt(mean(xs.map(x=>(x-mean(xs))**2)));
const stats=['dqn','double-dqn'].map(algorithm=>{
 const rows=reports.filter(r=>r.algorithm===algorithm), rates=rows.map(r=>r.reports.filter(e=>e.success).length/20*100), all=rows.flatMap(r=>r.reports);
 return {algorithm,success:all.filter(r=>r.success).length,completed:all.filter(r=>r.completed).length,mean:mean(rates),std:std(rates),min:Math.min(...rates),max:Math.max(...rates),trainingSeconds:mean(rows.map(r=>r.trainingSeconds)),evaluationSeconds:mean(rows.map(r=>r.evaluationSeconds)),meanLaps:mean(all.map(r=>r.laps))};
});
const f=n=>n.toFixed(1);
const rows=reports.map(r=>`<tr><td>${r.algorithm}</td><td>${r.seed}</td><td>${r.reports.filter(e=>e.success).length}/20</td><td>${r.reports.filter(e=>e.completed).length}/20</td><td>${f(r.trainingSeconds)} s</td><td>${f(r.evaluationSeconds)} s</td><td><a href="${r.algorithm}-${r.seed}.json">Poids</a></td></tr>`).join('');
for(const r of reports)await copyFile(`${source}/${r.algorithm}-${r.seed}.json`,`${destination}/${r.algorithm}-${r.seed}.json`);
const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DQN / Double DQN — Circuit Racing</title><style>
*{box-sizing:border-box}body{margin:0;background:#101517;color:#e8ecea;font:16px/1.65 system-ui,sans-serif}main{max-width:1080px;margin:auto;padding:48px 24px}a{color:#e6ee58}h1{font-size:clamp(32px,5vw,54px);line-height:1.1;letter-spacing:-.04em}h2{margin-top:44px;font-size:24px}.eyebrow{color:#e6ee58;font-size:12px;letter-spacing:.16em}.muted{color:#a7b4b0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:20px}.card{padding:24px;border:1px solid #37403d}.score{font-size:44px;color:#e6ee58;font-weight:700}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}td,th{text-align:left;padding:14px 12px;border-bottom:1px solid #37403d;white-space:nowrap}th{color:#a7b4b0;font-size:13px}code{overflow-wrap:anywhere}.note{padding:20px;border-left:3px solid #e6ee58;background:#1b2222}li{margin-bottom:8px}</style>
<main><a href="../../">← Circuit Racing</a><p class="eyebrow">EXPÉRIENCE REPRODUCTIBLE · RACING Q-LEARNING V3</p><h1>DQN et Double DQN,<br>à budget égal.</h1><p class="muted">Cinq graines par méthode · 20 courses figées par pilote · 20 000 transitions d’entraînement · ${manifest.backend}, TensorFlow.js ${manifest.tfjs}</p>
<div class="cards">${stats.map(s=>`<section class="card"><h2 style="margin:0">${s.algorithm==='dqn'?'DQN':'Double DQN'}</h2><div class="score">${s.success}/100</div><p>courses réussies · ${s.completed}/100 terminées</p><p class="muted">Réussite par graine : moyenne ${f(s.mean)} %, écart-type ${f(s.std)} points ; ${f(s.min)}–${f(s.max)} %.</p></section>`).join('')}</div>
<p class="note">Ces résultats décrivent ce circuit, ce curriculum et ce budget. Ils ne démontrent pas une supériorité générale de l’un des algorithmes. Les graines d’évaluation ne varient que légèrement le cap initial ; ces courses ne constituent pas 200 scénarios indépendants. Tous les checkpoints finaux et tous les échecs sont conservés.</p>
<h2>Chaque graine, sans sélection</h2><div class="scroll"><table><thead><tr><th>Méthode</th><th>Graine</th><th>Réussies</th><th>Terminées</th><th>Entraînement</th><th>Évaluation</th><th>Checkpoint</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>Ce qui est identique</h2><ul><li>Réseau 20 → 32 → 32 → 9, ReLU et sorties Q linéaires ; Adam 0,001 ; replay 10 000 ; batch 32 ; gamma 0,99.</li><li>20 000 décisions, chacune maintenue six ticks physiques de 1/60 s. Mise à jour toutes les quatre transitions et copie cible toutes les 100 mises à jour. Dernier checkpoint programmé ; aucune sélection sur l’évaluation.</li><li>Exploration, replay et initialisation pilotés par la graine. Pas de mélange aléatoire supplémentaire dans fit.</li><li>Entraînement sur Alpine Park : 10 000 décisions solo, puis 10 000 avec trois références figées ; départs variés sur la piste, vitesse initiale 4–12 m/s, épisodes limités à 600 décisions. Les sorties restent récupérables avec les mêmes remises en piste et pénalités que la course. Récompense de progression, checkpoints et pénalités. Aucun label ni remplacement par un pilote à règles.</li><li>Évaluation complète : cinq caps initiaux par circuit et par condition solo/trafic. Alpine Park et Harbour Test, trois tours, plafond 300 s. Trafic constitué de références à règles figées identiques pour les deux méthodes.</li><li>Réussite : trois tours, aucune remise en piste, pénalité ≤ 10 s. Une course terminée peut échouer à ce critère.</li></ul>
<h2>Temps et limites</h2><p>Temps réels mesurés sur ${manifest.platform}/${manifest.arch}, Node ${manifest.node}. Le premier passage inclut davantage de démarrage à froid ; les temps ne servent pas de classement de vitesse. Les départs variés du curriculum d’entraînement diffèrent des départs de course arrêtés : les échecs de transfert restent mesurés.</p><p>Les reprises navigateur rechargent les poids et recréent optimiseur, replay et exploration. Ce benchmark utilise uniquement des entraînements neufs. Les poids de cette page sont des résultats expérimentaux ; leur présence ne garantit pas un adversaire compétent.</p>
<p><a href="results.json" download>Télécharger les 200 résultats bruts, paramètres, versions et empreintes des sources</a></p><p class="muted">Reproduction : <code>pnpm exec tsx --tsconfig scripts/tsconfig.racing.json scripts/compare-racing-q.mts</code>, puis <code>node scripts/report-racing-q.mjs</code>. Le script refuse d’écraser un protocole existant ; déplacer le dossier de résultats avant une nouvelle expérience.</p><p>Calcul Double DQN : sélection online, évaluation cible, selon <a href="https://arxiv.org/abs/1509.06461">van Hasselt, Guez et Silver</a>.</p></main></html>`;
await writeFile(`${destination}/index.html`,html);
console.log(JSON.stringify(stats,null,2));
