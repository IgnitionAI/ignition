(async () => {
const assert = require('node:assert/strict');
const { IgnitionEnv } = require('@ignitionai/core');
const { CartPoleEnv } = require('@ignitionai/environments');
const { QTableAgent, DQNAgent, setBackend } = require('@ignitionai/backend-tfjs');
const { hfStorageConfigSchema } = require('@ignitionai/storage');
const { OnnxAgent } = require('@ignitionai/backend-onnx');
const env = new CartPoleEnv();
const runner = new IgnitionEnv(env);
assert.equal(runner.env, env);
const q = new QTableAgent({ inputSize: 4, actionSize: 2, epsilon: 0 });
const before = env.observe();
const action = await q.getAction(before, true);
env.step(action);
q.remember({state: before, action: 1, reward: 10, nextState: before, done: true, terminated: true});
await q.train();
assert.equal(await q.getAction(before, true), 1);
await setBackend('cpu');
const dqn = new DQNAgent({inputSize: 4, actionSize: 2, hiddenLayers: [8], backend: 'cpu', seed: 11});
const predicted = await dqn.getAction(env.observe(), true);
assert.ok(predicted === 0 || predicted === 1);
dqn.dispose();
assert.equal(hfStorageConfigSchema.safeParse({}).success, false);
const onnx = new OnnxAgent({modelPath: 'unloaded.onnx', actionSize: 2});
await assert.rejects(onnx.getAction(env.observe()), /call load/);
console.log('PASS: public runner/environment, Q-table update, real DQN inference, storage validation, ONNX lifecycle guard.');

})().catch(error => { console.error(error); process.exit(1); });
