# TensorFlow.js DQN Model
    
## Model Information
- Framework: TensorFlow.js
- Type: Deep Q-Network (DQN)
- Created by: Ignition AI

## Usage in TensorFlow.js
```javascript
// Load the model
const model = await tf.loadLayersModel('https://huggingface.co/salim4n/tfjs-dqn-2025-04-13-1744559537521/resolve/main/model.json');

// Use the model
const input = tf.tensor2d([[/* your input values */]]);
const output = model.predict(input);
```

## Files
- model.json: Model architecture
- *.bin: Model weights

## Repository
This model was uploaded via the IgnitionAI TensorFlow.js integration.
