import { OnnxAgent } from '@ignitionai/backend-onnx';
const agent = new OnnxAgent({modelPath: './model.onnx', actionSize: 2, inputName: 'dense_dense1_input', outputName: 'dense_Dense2'});
await agent.load();
const outcomes = [];
for (const observation of [[0,0,0,0],[0.1,-0.2,0.03,0.4],[-0.4,0.2,-0.1,-0.3]]) {
 const action = await agent.getAction(observation);
 if (action !== 0 && action !== 1) throw new Error('Invalid action');
 outcomes.push(action);
}
console.log(JSON.stringify({names: agent.inspect(), actions: outcomes}));
agent.dispose();
