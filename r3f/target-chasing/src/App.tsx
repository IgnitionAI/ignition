import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import Experience from "./Experience";

function App() {
  return (
    <>
      <Canvas camera={{ position: [30, 30, 30], fov: 60}} shadows >
        <OrbitControls />
        <color attach="background" args={["#171720"]} />
        <Physics>
          <Experience />
        </Physics>
      </Canvas>
    </>
  );
}

export default App;