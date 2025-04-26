import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, OrbitControls } from "@react-three/drei";
import Experience from "./Experience";
import { useMemo, useRef } from "react";
import { TrainingControls } from "./TrainingControls";

import "./styles.css";

export const Controls = {
  forward: "forward",
  back: "back",
  left: "left",
  right: "right",
  jump: "jump",
};

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
  
  // Référence à l'Experience pour accéder à ses méthodes
  const experienceRef = useRef<any>(null);
  
  // Fonctions de contrôle qui seront passées à TrainingControls
  const startTraining = () => {
    experienceRef.current?.startTraining();
  };
  
  const stopTraining = () => {
    experienceRef.current?.stopTraining();
  };
  
  const resetEnvironment = () => {
    experienceRef.current?.resetEnvironment();
  };
  
  return (
    <>
      {/* Panneau de contrôle positionné en haut à gauche */}
      <TrainingControls 
        startTraining={startTraining}
        stopTraining={stopTraining}
        resetEnvironment={resetEnvironment}
      />
      
      <KeyboardControls map={map}>
        <Canvas camera={{ position: [30, 100, 300], fov: 60, near: 0.1, far: 1000}} shadows >
          <OrbitControls />
          <color attach="background" args={["#171720"]} />
          <Physics debug={true}>
            <Experience ref={experienceRef} />
          </Physics>
        </Canvas>
      </KeyboardControls>
    </>
  );
}

export default App;