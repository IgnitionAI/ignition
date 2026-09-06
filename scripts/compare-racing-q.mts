import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const require=createRequire(new URL('../packages/backend-tfjs/package.json',import.meta.url));
const tf=require('@tensorflow/tfjs-node');
import { LearnedDriver } from '../packages/demo-car-circuit/src/racing/learned-driver';
const { trainQDriver } = createRequire(import.meta.url)('../packages/demo-car-circuit/src/racing/q-training.ts');
import { evaluateDriver } from '../packages/demo-car-circuit/src/racing/training';
import { Q_PROTOCOL } from '../packages/demo-car-circuit/src/racing/q-protocol';
const folder='.scratch/circuit-racing/q-comparison-v3';
await mkdir(folder,{recursive:true});
const sourceFiles=['packages/demo-car-circuit/src/racing/q-training.ts','packages/demo-car-circuit/src/racing/q-protocol.ts','packages/demo-car-circuit/src/racing/learned-driver.ts','packages/demo-car-circuit/src/racing/training.ts','packages/demo-car-circuit/src/racing/driving.ts','packages/demo-car-circuit/src/racing/race.ts','packages/demo-car-circuit/src/racing/observations.ts','packages/demo-car-circuit/src/racing/reference.ts','packages/backend-tfjs/src/agents/dqn.ts','packages/backend-tfjs/src/model/BuildMLP.ts','packages/backend-tfjs/src/memory/ReplayBuffer.ts'];
const hashes=Object.fromEntries(await Promise.all(sourceFiles.map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const manifest={protocol:Q_PROTOCOL,createdAt:new Date().toISOString(),node:process.version,tfjs:tf.version.tfjs,backend:tf.getBackend(),platform:process.platform,arch:process.arch,head:execFileSync('/usr/bin/git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes:hashes};
await writeFile(`${folder}/protocol.json`,JSON.stringify(manifest,null,2),{flag:'wx'});
for(const algorithm of ['dqn','double-dqn'] as const)for(const seed of Q_PROTOCOL.seeds){
  const initial=new LearnedDriver(seed,algorithm),start=performance.now();
  const checkpoint=await trainQDriver(initial.exportCheckpoint(),{onProgress:(p: {round:number})=>{if(p.round%5000===0)console.log(JSON.stringify({algorithm,seed,transitions:p.round,seconds:(performance.now()-start)/1000}));}});
  initial.dispose();
  const trainingSeconds=(performance.now()-start)/1000;
  await writeFile(`${folder}/${algorithm}-${seed}.json`,JSON.stringify(checkpoint));
  const frozen=LearnedDriver.fromCheckpoint(checkpoint),before=JSON.stringify(checkpoint.weights),reports=[];
  const evaluationStart=performance.now();
  try{
    for(const test of [false,true])for(const traffic of [false,true])for(const evaluationSeed of Q_PROTOCOL.evaluationSeeds){
      reports.push(await evaluateDriver(frozen,{seed:evaluationSeed,test,traffic}));
    }
    if(JSON.stringify(frozen.exportCheckpoint().weights)!==before)throw new Error('Evaluation mutated weights');
  }finally{frozen.dispose();}
  const report={algorithm,seed,trainingSeconds,evaluationSeconds:(performance.now()-evaluationStart)/1000,transitions:checkpoint.samples,updates:checkpoint.updates,backend:tf.getBackend(),reports};
  await writeFile(`${folder}/report-${algorithm}-${seed}.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({algorithm,seed,success:reports.filter(r=>r.success).length,total:reports.length,trainingSeconds}));
}
