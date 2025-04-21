import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { KeyboardControls, OrbitControls } from "@react-three/drei";
import Experience from "./Experience";
import { useMemo } from "react";

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
  return (
    <>
     <KeyboardControls map={map}>
      <Canvas camera={{ position: [30, 100, 300], fov: 60}} shadows >
        <OrbitControls />
        <color attach="background" args={["#171720"]} />
        <Physics debug={true}>
          <Experience />
        </Physics>
      </Canvas>
      </KeyboardControls>
    </>
  );
}

export default App;