import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Track3D } from './Track3D';
import { Car3D } from './Car3D';
import { useDemoStore } from './store';

function ChaseCamera() {
  const { camera } = useThree();
  const desiredPos = new THREE.Vector3();

  useFrame(() => {
    const { carX, carY, carAngle } = useDemoStore.getState();
    // Behind the car by 4 units, above by 3 units
    desiredPos.set(
      carX - Math.cos(carAngle) * 4,
      3,
      carY - Math.sin(carAngle) * 4,
    );
    camera.position.lerp(desiredPos, 0.06);
    camera.lookAt(carX, 0.3, carY);
  });

  return null;
}

function SceneContent() {
  const { carX, carY, carAngle, mode } = useDemoStore();

  const glowColor = mode === 'training' ? '#22c55e' : mode === 'inference' ? '#3b82f6' : '#666';

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 12, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={40}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-5, 6, -5]} intensity={0.3} color="#6366f1" />

      {/* Environment */}
      <Environment preset="sunset" />
      <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={30} blur={2} />

      {/* Scene */}
      <Track3D />
      <Car3D x={carX} y={carY} angle={carAngle} />

      {/* Mode indicator: subtle ground glow */}
      <mesh position={[0, -0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color={glowColor} transparent opacity={0.1} emissive={glowColor} emissiveIntensity={0.4} />
      </mesh>

      {/* Chase camera */}
      <ChaseCamera />
    </>
  );
}

export function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 20, 15], fov: 45 }}
      style={{ borderRadius: 12 }}
    >
      <SceneContent />
    </Canvas>
  );
}
