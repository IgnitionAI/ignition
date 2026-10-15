import { Suspense, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics, useAfterPhysicsStep, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { PerspectiveCamera } from 'three';
import type { Mesh } from 'three';
import { BALL_RADIUS, GOAL_RADIUS, GRAVITY, SOLIDS, SOLVER, TIME_STEP, initialState, keyboardDirection, populateWorld, readState, thrust } from './physics';

export type Telemetry = ReturnType<typeof readState>;

interface SceneProps {
  seed: number;
  keys: Set<string>;
  onUpdate: (state: Telemetry) => void;
}

function Simulation({ seed, keys, onUpdate }: SceneProps) {
  const { world, rapier } = useRapier();
  const arena = useRef<ReturnType<typeof populateWorld> | null>(null);
  const mesh = useRef<Mesh>(null);
  const tick = useRef(0);
  const reached = useRef(false);

  useLayoutEffect(() => {
    const simulation = populateWorld(world, rapier, seed);
    arena.current = simulation;
    onUpdate(readState(simulation.ball, simulation.goal, 0));
    return () => {
      arena.current = null;
      // This Physics provider is dedicated to this arena, including StrictMode replay.
      const bodies: Parameters<typeof world.removeRigidBody>[0][] = [];
      world.forEachRigidBody((body) => bodies.push(body));
      bodies.forEach((body) => world.removeRigidBody(body));
    };
  }, [world, rapier, seed, onUpdate]);

  useBeforePhysicsStep(() => {
    if (arena.current) thrust(arena.current.ball, keyboardDirection(keys), tick.current);
  });
  useAfterPhysicsStep(() => {
    if (!arena.current) return;
    tick.current += 1;
    const state = readState(arena.current.ball, arena.current.goal, tick.current);
    reached.current ||= state.reached;
    if (tick.current % 6 === 0) onUpdate({ ...state, reached: reached.current });
  });
  useFrame(() => {
    if (!arena.current || !mesh.current) return;
    const ball = arena.current.ball;
    mesh.current.position.copy(ball.translation());
    mesh.current.quaternion.copy(ball.rotation());
  });

  const { goal } = initialState(seed);
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

export function Scene({ generation, ...props }: SceneProps & { generation: number }) {
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
    <Suspense fallback={null}>
      <Physics key={generation} gravity={[GRAVITY.x, GRAVITY.y, GRAVITY.z]} timeStep={TIME_STEP} interpolate={false} {...SOLVER}>
        <Simulation {...props} />
      </Physics>
    </Suspense>
    <CameraFraming />
    <OrbitControls makeDefault target={[0, 0, 0]} minDistance={11} maxDistance={25}
      minPolarAngle={0.15} maxPolarAngle={Math.PI / 2.3} enablePan={false} />
  </Canvas>;
}
