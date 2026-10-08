import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTrainingStore } from '../store/trainingStore';

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
  const { t } = useTranslation();
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
      <h3>{t('config.title')}</h3>
      
      <div className="config-section">
        <h4>{t('config.architecture')}</h4>
        
        <div className="config-row">
          <label>{t('config.inputSize')}</label>
          <input 
            type="number" 
            value={inputSize} 
            onChange={(e) => setInputSize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
        
        <div className="config-row">
          <label>{t('config.actionSize')}</label>
          <input 
            type="number" 
            value={actionSize} 
            onChange={(e) => setActionSize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
        
        <div className="layers-container">
          <h5>{t('config.hiddenLayers')}</h5>
          {layers.map((layer, index) => (
            <div key={layer.id} className="layer-row">
              <label>{t('config.layer', { index: index + 1 })}</label>
              <input 
                type="number" 
                value={layer.neurons} 
                onChange={(e) => updateLayer(layer.id, parseInt(e.target.value))} 
                min="1"
              />
              <button onClick={() => removeLayer(layer.id)}>{t('config.remove')}</button>
            </div>
          ))}
          <button onClick={addLayer}>{t('config.addLayer')}</button>
        </div>
      </div>
      
      <div className="config-section">
        <h4>{t('config.parameters')}</h4>
        
        <div className="config-row">
          <label>{t('config.epsilon')}</label>
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
          <label>{t('config.epsilonDecay')}</label>
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
          <label>{t('config.minEpsilon')}</label>
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
          <label>{t('config.gamma')}</label>
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
          <label>{t('config.learningRate')}</label>
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
          <label>{t('config.batchSize')}</label>
          <input 
            type="number" 
            value={batchSize} 
            onChange={(e) => setBatchSize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
        
        <div className="config-row">
          <label>{t('config.memorySize')}</label>
          <input 
            type="number" 
            value={memorySize} 
            onChange={(e) => setMemorySize(parseInt(e.target.value))} 
            min="1"
          />
        </div>
      </div>
      
      <button className="apply-button" onClick={applyConfig}>{t('config.apply')}</button>
    </div>
  );
}
