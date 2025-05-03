import React, { useState } from 'react';

interface LayerConfig {
  id: string;
  neurons: number;
}

interface AgentConfigPanelProps {
  onApplyConfig: (config: {
    inputSize: number;
    actionSize: number;
    hiddenLayers: number[];
    epsilon: number;
    epsilonDecay: number;
    minEpsilon: number;
    gamma: number;
    lr: number;
    batchSize: number;
    memorySize: number;
  }) => void;
}

export function AgentConfigPanel({ onApplyConfig }: AgentConfigPanelProps) {
  // Default configuration
  const [inputSize, setInputSize] = useState(9);
  const [actionSize, setActionSize] = useState(4);
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: 'layer1', neurons: 64 },
    { id: 'layer2', neurons: 64 }
  ]);
  const [epsilon, setEpsilon] = useState(0.9);
  const [epsilonDecay, setEpsilonDecay] = useState(0.97);
  const [minEpsilon, setMinEpsilon] = useState(0.05);
  const [gamma, setGamma] = useState(0.99);
  const [learningRate, setLearningRate] = useState(0.001);
  const [batchSize, setBatchSize] = useState(128);
  const [memorySize, setMemorySize] = useState(100000);
  
  // Function to add a new layer
  const addLayer = () => {
    const newId = `layer${layers.length + 1}`;
    setLayers([...layers, { id: newId, neurons: 32 }]);
  };
  
  // Function to remove a layer
  const removeLayer = (id: string) => {
    if (layers.length > 1) {
      setLayers(layers.filter(layer => layer.id !== id));
    }
  };
  
  // Function to update a layer's neuron count
  const updateLayer = (id: string, neurons: number) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, neurons } : layer
    ));
  };
  
  // Apply configuration
  const applyConfig = () => {
    onApplyConfig({
      inputSize,
      actionSize,
      hiddenLayers: layers.map(layer => layer.neurons),
      epsilon,
      epsilonDecay,
      minEpsilon,
      gamma,
      lr: learningRate,
      batchSize,
      memorySize
    });
  };
  
  return (
    <div className="agent-config-panel">
      <h3>Agent Configuration</h3>
      
      <div className="config-section">
        <h4>Network Architecture</h4>
        
        <div className="config-row">
          <label>Input Size:</label>
          <input 
            type="number" 
            value={inputSize} 
            onChange={(e) => setInputSize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
        
        <div className="config-row">
          <label>Action Size:</label>
          <input 
            type="number" 
            value={actionSize} 
            onChange={(e) => setActionSize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
        
        <div className="layers-container">
          <h5>Hidden Layers</h5>
          {layers.map((layer, index) => (
            <div key={layer.id} className="layer-row">
              <label>Layer {index + 1}:</label>
              <input 
                type="number" 
                value={layer.neurons} 
                onChange={(e) => updateLayer(layer.id, parseInt(e.target.value))} 
                min="1"
              />
              <button onClick={() => removeLayer(layer.id)}>Remove</button>
            </div>
          ))}
          <button onClick={addLayer}>Add Layer</button>
        </div>
      </div>
      
      <div className="config-section">
        <h4>Training Parameters</h4>
        
        <div className="config-row">
          <label>Epsilon (exploration rate):</label>
          <input 
            type="number" 
            value={epsilon} 
            onChange={(e) => setEpsilon(parseFloat(e.target.value))} 
            min="0" 
            max="1" 
            step="0.01"
          />
        </div>
        
        <div className="config-row">
          <label>Epsilon Decay:</label>
          <input 
            type="number" 
            value={epsilonDecay} 
            onChange={(e) => setEpsilonDecay(parseFloat(e.target.value))} 
            min="0" 
            max="1" 
            step="0.01"
          />
        </div>
        
        <div className="config-row">
          <label>Min Epsilon:</label>
          <input 
            type="number" 
            value={minEpsilon} 
            onChange={(e) => setMinEpsilon(parseFloat(e.target.value))} 
            min="0" 
            max="1" 
            step="0.01"
          />
        </div>
        
        <div className="config-row">
          <label>Gamma (discount factor):</label>
          <input 
            type="number" 
            value={gamma} 
            onChange={(e) => setGamma(parseFloat(e.target.value))} 
            min="0" 
            max="1" 
            step="0.01"
          />
        </div>
        
        <div className="config-row">
          <label>Learning Rate:</label>
          <input 
            type="number" 
            value={learningRate} 
            onChange={(e) => setLearningRate(parseFloat(e.target.value))} 
            min="0.0001" 
            max="1" 
            step="0.0001"
          />
        </div>
        
        <div className="config-row">
          <label>Batch Size:</label>
          <input 
            type="number" 
            value={batchSize} 
            onChange={(e) => setBatchSize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
        
        <div className="config-row">
          <label>Memory Size:</label>
          <input 
            type="number" 
            value={memorySize} 
            onChange={(e) => setMemorySize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
      </div>
      
      <button className="apply-button" onClick={applyConfig}>Apply Configuration</button>
    </div>
  );
}
