import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Cart } from './Cart';
import { Pole } from './Pole';
import { Rail } from './Rail';
import { useDemoStore } from './store';

function SceneContent() {
  const { cartpole, mode } = useDemoStore();

  // Scale: 1 unit in CartPoleEnv = 1 unit in 3D
  const cartX = cartpole.x;
  const poleAngle = cartpole.theta;

  const glowColor = mode === 'training' ? '#22c55e' : mode === 'inference' ? '#3b82f6' : '#666';

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <pointLight position={[-3, 4, -3]} intensity={0.3} color="#6366f1" />

      {/* Environment */}
      <Environment preset="city" />
      <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={10} blur={2} />

      {/* Scene */}
      <Rail />
      <group position={[cartX, 0.15, 0]}>
        <Cart />
        <group position={[0, 0.15, 0]}>
          <Pole angle={poleAngle} />
        </group>
      </group>

      {/* Mode indicator: subtle ground glow */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 2]} />
        <meshStandardMaterial color={glowColor} transparent opacity={0.15} emissive={glowColor} emissiveIntensity={0.5} />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.5}
        enablePan={false}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
      />
    </>
  );
}

export function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 2, 4], fov: 45 }}
      style={{ borderRadius: 12 }}
    >
      <SceneContent />
    </Canvas>
  );
}
