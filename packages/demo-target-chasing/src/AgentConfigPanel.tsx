import { useState, useEffect } from 'react';
import { useNetworkStore } from './stores/networkStore';

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
  const { hiddenLayers, inputSize: storeInputSize, actionSize: storeActionSize, setHiddenLayers, setSizes } = useNetworkStore();

  const [inputSize, setInputSize] = useState(storeInputSize);
  const [actionSize, setActionSize] = useState(storeActionSize);
  const [layers, setLayers] = useState<LayerConfig[]>(
    hiddenLayers.map((n, i) => ({ id: `layer${i}`, neurons: n }))
  );
  const [epsilon, setEpsilon] = useState(0.9);
  const [epsilonDecay, setEpsilonDecay] = useState(0.97);
  const [minEpsilon, setMinEpsilon] = useState(0.05);
  const [gamma, setGamma] = useState(0.99);
  const [learningRate, setLearningRate] = useState(0.001);
  const [batchSize, setBatchSize] = useState(128);
  const [memorySize, setMemorySize] = useState(100000);

  // Sync from networkStore → local layers state (when graph changes)
  useEffect(() => {
    setLayers(hiddenLayers.map((n, i) => ({ id: `layer${i}`, neurons: n })));
  }, [hiddenLayers]);

  useEffect(() => {
    setInputSize(storeInputSize);
    setActionSize(storeActionSize);
  }, [storeInputSize, storeActionSize]);

  const addLayer = () => {
    const updated = [...layers, { id: `layer${Date.now()}`, neurons: 32 }];
    setLayers(updated);
    setHiddenLayers(updated.map((l) => l.neurons));
  };

  const removeLayer = (id: string) => {
    if (layers.length > 1) {
      const updated = layers.filter((layer) => layer.id !== id);
      setLayers(updated);
      setHiddenLayers(updated.map((l) => l.neurons));
    }
  };

  const updateLayer = (id: string, neurons: number) => {
    const updated = layers.map((layer) =>
      layer.id === id ? { ...layer, neurons } : layer
    );
    setLayers(updated);
    setHiddenLayers(updated.map((l) => l.neurons));
  };

  const applyConfig = () => {
    setSizes(inputSize, actionSize);
    onApplyConfig({
      inputSize,
      actionSize,
      hiddenLayers: layers.map((layer) => layer.neurons),
      epsilon,
      epsilonDecay,
      minEpsilon,
      gamma,
      lr: learningRate,
      batchSize,
      memorySize,
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
