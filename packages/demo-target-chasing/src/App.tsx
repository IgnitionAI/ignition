import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

import Experience from './Experience';
import { AgentConfigPanel } from './AgentConfigPanel';
import { TrainingControls } from './TrainingControls';
import { NetworkDesigner } from './components/NetworkDesigner/NetworkDesigner';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Notifications } from './components/Notifications';
import { useNotificationStore } from './stores/notificationStore';

interface AgentConfig {
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
}

const DEFAULT_CONFIG: AgentConfig = {
  inputSize: 9,
  actionSize: 4,
  hiddenLayers: [64, 64],
  epsilon: 0.9,
  epsilonDecay: 0.97,
  minEpsilon: 0.05,
  gamma: 0.99,
  lr: 0.001,
  batchSize: 128,
  memorySize: 100000,
};

export default function App() {
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const experienceRef = useRef<{
    startTraining: (config: AgentConfig) => void;
    stopTraining: () => void;
    resetEnvironment: (config: AgentConfig) => void;
  }>(null);

  const { notify } = useNotificationStore();

  const handleApplyConfig = (config: AgentConfig) => {
    setAgentConfig(config);
    notify(`Agent recreated with [${config.hiddenLayers.join(', ')}]`, 'success');
  };

  const handleStart = () => {
    experienceRef.current?.startTraining(agentConfig);
    notify('Training started', 'info');
  };

  const handleStop = () => {
    experienceRef.current?.stopTraining();
    notify('Training stopped', 'warning');
  };

  const handleReset = () => {
    experienceRef.current?.resetEnvironment(agentConfig);
    notify('Environment reset', 'info');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a1a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Left sidebar */}
      <div style={{ width: 360, overflowY: 'auto', borderRight: '1px solid #333', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TrainingControls
          startTraining={handleStart}
          stopTraining={handleStop}
          resetEnvironment={handleReset}
        />
        <NetworkDesigner />
        <AgentConfigPanel onApplyConfig={handleApplyConfig} />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 300 }}>
          <Canvas shadows camera={{ position: [200, 200, 200], fov: 60 }}>
            <Physics gravity={[0, -9.81, 0]}>
              <Experience ref={experienceRef} agentConfig={agentConfig} />
            </Physics>
          </Canvas>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto', borderTop: '1px solid #333' }}>
          <Dashboard currentConfig={agentConfig as unknown as Record<string, unknown>} />
        </div>
      </div>

      <Notifications />
    </div>
  );
}
