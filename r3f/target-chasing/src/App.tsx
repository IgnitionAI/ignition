import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, OrbitControls } from "@react-three/drei";
import Experience from "./Experience";
import { useMemo, useRef, useState, useCallback } from "react"; // Added useCallback
import { TrainingControls } from "./TrainingControls";
import { VisualizationCharts } from "./components/VisualizationCharts";
import { AgentConfigPanel } from "./components/AgentConfigPanel";
import { NetworkDesigner } from "./components/NetworkDesigner"; // Import the network designer

import "./styles.css";

export const Controls = {
  forward: "forward",
  back: "back",
  left: "left",
  right: "right",
  jump: "jump",
};

// Define the structure for agent configuration
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

function App() {
  const map = useMemo(
    () => [
      { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
      { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
      { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
      { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
      { name: Controls.jump, keys: ["Space"] },
    ],
    []
  );
  
  // Reference to the Experience component
  const experienceRef = useRef<any>(null);
  
  // State to hold the current agent configuration
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    // Default config matching Experience.tsx initial setup
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
  });

  // Callback for the config panel to update the configuration
  const handleApplyConfig = useCallback((newConfig: AgentConfig) => {
    console.log("Applying new agent configuration from panel:", newConfig);
    setAgentConfig(newConfig);
    // Optionally, reset the environment when config changes
    // resetEnvironment(); 
  }, []);

  // Callback for the network designer to update hidden layers
  const handleNetworkChange = useCallback((newHiddenLayers: number[]) => {
    console.log("Applying new hidden layers from designer:", newHiddenLayers);
    setAgentConfig(prevConfig => ({
      ...prevConfig,
      hiddenLayers: newHiddenLayers,
    }));
    // Optionally, reset the environment when network structure changes
    // resetEnvironment();
  }, []);

  // Control functions passed to TrainingControls
  const startTraining = () => {
    experienceRef.current?.startTraining(agentConfig); // Pass config on start
  };
  
  const stopTraining = () => {
    experienceRef.current?.stopTraining();
  };
  
  const resetEnvironment = () => {
    experienceRef.current?.resetEnvironment(agentConfig); // Pass config on reset
  };
  
  return (
    <>
      {/* UI Panels Container */}
      <div className="ui-panels">
        <TrainingControls 
          startTraining={startTraining}
          stopTraining={stopTraining}
          resetEnvironment={resetEnvironment}
        />
        <VisualizationCharts />
        <AgentConfigPanel onApplyConfig={handleApplyConfig} />
        <NetworkDesigner onNetworkChange={handleNetworkChange} /> {/* Add the network designer */}
      </div>
      
      <KeyboardControls map={map}>
        <Canvas camera={{ position: [30, 100, 300], fov: 60, near: 0.1, far: 1000}} shadows >
          <OrbitControls />
          <color attach="background" args={["#171720"]} />
          <Physics debug={false}> {/* Disable physics debug view for clarity */}
            {/* Pass the agentConfig to the Experience component */}
            <Experience ref={experienceRef} agentConfig={agentConfig} />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </>
  );
}

export default App;
