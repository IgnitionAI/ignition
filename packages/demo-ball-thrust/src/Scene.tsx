import { useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PerspectiveCamera } from 'three';
import type { Mesh } from 'three';
import type { BallThrustEnv } from './ball-thrust-env';
import { BALL_RADIUS, GOAL_RADIUS, SOLIDS } from './physics';

function Arena({ env }: { env: BallThrustEnv }) {
  const mesh = useRef<Mesh>(null);
  // The environment is the only simulation owner. Rendering never steps Rapier.
  useFrame(() => {
    if (!mesh.current) return;
    mesh.current.position.copy(env.ball.translation());
    mesh.current.quaternion.copy(env.ball.rotation());
  });
  const { goal } = env;
  return <>
    {SOLIDS.map((solid) => <mesh key={solid.id} position={[...solid.position]} castShadow receiveShadow>
      <boxGeometry args={[...solid.size]} />
      <meshStandardMaterial color={solid.id === 'floor' ? '#182d41' : solid.id.startsWith('obstacle') ? '#d98b4a' : '#415a70'} roughness={0.72} />
    </mesh>)}
    <gridHelper args={[12, 12, '#476077', '#284056']} position={[0, 0.006, 0]} />
    <mesh ref={mesh} castShadow>
      <sphereGeometry args={[BALL_RADIUS, 32, 20]} />
      <meshStandardMaterial color="#64d9eb" roughness={0.24} metalness={0.3} />
      <mesh scale={1.006}>
        <sphereGeometry args={[BALL_RADIUS, 12, 8]} />
        <meshBasicMaterial color="#193e56" wireframe />
      </mesh>
    </mesh>
    <group position={[goal.x, 0.015, goal.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[GOAL_RADIUS * 0.78, GOAL_RADIUS, 48]} />
        <meshBasicMaterial color="#b7ee76" side={2} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <octahedronGeometry args={[0.22]} />
        <meshStandardMaterial color="#b7ee76" emissive="#76a643" emissiveIntensity={0.7} />
      </mesh>
    </group>
  </>;
}

function CameraFraming() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspectCorrection = Math.max(1, 1.35 / (size.width / size.height));
    camera.fov = 2 * Math.atan(Math.tan(48 * Math.PI / 360) * aspectCorrection) * 180 / Math.PI;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

export function Scene({ env }: { env: BallThrustEnv }) {
  const [supported] = useState(supportsWebGL);
  if (!supported) return <p className="scene-message" role="alert">
    WebGL indisponible. Activez l’accélération graphique ou utilisez un navigateur compatible.
  </p>;
  return <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 13.5, 12.5], fov: 48, near: 0.1, far: 80 }}
    fallback={<p role="alert">WebGL indisponible. Activez l’accélération graphique ou utilisez un navigateur compatible.</p>}>
    <color attach="background" args={['#101b29']} />
    <ambientLight intensity={1.2} />
    <directionalLight position={[-4, 12, 5]} intensity={2.5} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8}
      shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={0.03} />
    <Arena env={env} />
    <CameraFraming />
    <OrbitControls makeDefault target={[0, 0, 0]} minDistance={11} maxDistance={25}
      minPolarAngle={0.15} maxPolarAngle={Math.PI / 2.3} enablePan={false} />
  </Canvas>;
}
