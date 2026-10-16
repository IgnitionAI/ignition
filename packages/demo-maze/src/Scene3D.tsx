import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import * as React from 'react';
import * as THREE from 'three';
import {
  ARENA_DEPTH,
  ARENA_WIDTH,
  CHECKPOINTS,
  DOOR,
  DOOR_PAD,
  GOAL,
  SENSOR_RANGE,
  WALLS,
  type RectModule,
} from './maze-layout';
import { useDemoStore } from './store';

const FLOOR_Y = -0.04;

function WallModule({ wall }: { wall: RectModule }) {
  return (
    <RigidBody type="fixed" colliders={false} position={[wall.x, wall.h / 2, wall.z]}>
      <CuboidCollider args={[wall.w / 2, wall.h / 2, wall.d / 2]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[wall.w, wall.h, wall.d]} />
        <meshStandardMaterial color="#273447" roughness={0.72} metalness={0.05} />
      </mesh>
      <mesh position={[0, wall.h / 2 + 0.012, 0]}>
        <boxGeometry args={[wall.w + 0.05, 0.035, wall.d + 0.05]} />
        <meshStandardMaterial color="#6ee7b7" emissive="#14b8a6" emissiveIntensity={0.18} roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}

function DoorModule() {
  const doorOpen = useDemoStore((s) => s.maze.doorOpen);
  const y = doorOpen ? 1.34 : DOOR.h / 2;
  const opacity = doorOpen ? 0.32 : 0.92;

  return (
    <RigidBody type="fixed" colliders={false} position={[DOOR.x, y, DOOR.z]}>
      {!doorOpen && <CuboidCollider args={[DOOR.w / 2, DOOR.h / 2, DOOR.d / 2]} />}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[DOOR.w, DOOR.h, DOOR.d]} />
        <meshStandardMaterial
          color={doorOpen ? '#38bdf8' : '#f59e0b'}
          emissive={doorOpen ? '#0284c7' : '#b45309'}
          emissiveIntensity={doorOpen ? 0.28 : 0.5}
          transparent
          opacity={opacity}
          roughness={0.44}
        />
      </mesh>
    </RigidBody>
  );
}

function SpawnPad() {
  return (
    <group position={[-4.35, 0.012, -3.15]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.58, 48]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.72} />
      </mesh>
      <pointLight position={[0, 0.55, 0]} color="#60a5fa" intensity={0.7} distance={2.2} />
    </group>
  );
}

function GoalBeacon() {
  return (
    <RigidBody type="fixed" colliders={false} position={[GOAL.x, 0, GOAL.z]}>
      <CuboidCollider args={[GOAL.radius, 0.05, GOAL.radius]} sensor />
      <mesh position={[0, 0.62, 0]} castShadow>
        <octahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={1.3} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.52, 48]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.78} />
      </mesh>
      <pointLight position={[0, 1.1, 0]} color="#22c55e" intensity={2.3} distance={4.2} />
    </RigidBody>
  );
}

function HazardModule({ id }: { id: string }) {
  const hazard = useDemoStore((s) => s.maze.hazards.find((item) => item.id === id));
  const ref = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current || !hazard) return;
    ref.current.rotation.y += delta * 4.2;
  });

  if (!hazard) return null;

  return (
    <RigidBody type="kinematicPosition" colliders={false} position={[hazard.x, 0.18, hazard.z]}>
      <CuboidCollider args={[hazard.radius, 0.16, hazard.radius]} sensor />
      <group ref={ref}>
        <mesh castShadow>
          <cylinderGeometry args={[hazard.radius, hazard.radius, 0.25, 6]} />
          <meshStandardMaterial color="#f43f5e" emissive="#be123c" emissiveIntensity={0.65} roughness={0.38} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[hazard.radius * 2.4, 0.055, 0.055]} />
          <meshBasicMaterial color="#fecdd3" transparent opacity={0.82} />
        </mesh>
        <pointLight color="#fb7185" intensity={0.9} distance={2.1} />
      </group>
    </RigidBody>
  );
}

function SensorRayFan() {
  const { sensors, heading } = useDemoStore((s) => s.maze);
  const angles = React.useMemo(() => [-90, -50, -18, 18, 50, 90].map((deg) => (deg * Math.PI) / 180), []);

  return (
    <group>
      {sensors.map((sensor, index) => {
        const rayLength = Math.max(0.12, sensor * SENSOR_RANGE);
        const angle = heading + angles[index];
        const x = Math.cos(angle) * rayLength;
        const z = Math.sin(angle) * rayLength;
        const points = [new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(x, 0.12, z)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={index} geometry={geometry}>
            <lineBasicMaterial color={sensor < 0.28 ? '#fb7185' : '#67e8f9'} transparent opacity={0.42} />
          </line>
        );
      })}
    </group>
  );
}

function AgentRig() {
  const { maze, mode } = useDemoStore();
  const color = mode === 'training' ? '#22c55e' : mode === 'inference' ? '#60a5fa' : '#94a3b8';
  const alertColor = maze.lastHazardHit ? '#fb7185' : maze.lastActionBlocked ? '#f59e0b' : color;

  return (
    <RigidBody type="kinematicPosition" colliders={false} position={[maze.agentX, 0, maze.agentZ]}>
      <CuboidCollider args={[0.2, 0.45, 0.2]} />
      <group>
        <SensorRayFan />
        <group rotation={[0, -maze.heading + Math.PI / 2, 0]}>
          <mesh position={[0, 0.78, 0]} castShadow>
            <dodecahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[0.34, 0.44, 0.2]} />
            <meshStandardMaterial color={alertColor} emissive={alertColor} emissiveIntensity={0.3} roughness={0.42} />
          </mesh>
          <mesh position={[-0.24, 0.49, 0]} rotation={[0, 0, 0.25]} castShadow>
            <boxGeometry args={[0.1, 0.38, 0.1]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
          <mesh position={[0.24, 0.49, 0]} rotation={[0, 0, -0.25]} castShadow>
            <boxGeometry args={[0.1, 0.38, 0.1]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
          <mesh position={[-0.11, 0.16, 0]} castShadow>
            <boxGeometry args={[0.11, 0.34, 0.11]} />
            <meshStandardMaterial color="#64748b" roughness={0.62} />
          </mesh>
          <mesh position={[0.11, 0.16, 0]} castShadow>
            <boxGeometry args={[0.11, 0.34, 0.11]} />
            <meshStandardMaterial color="#64748b" roughness={0.62} />
          </mesh>
        </group>
        <pointLight position={[0, 0.75, 0]} color={alertColor} intensity={0.8} distance={2.4} />
      </group>
    </RigidBody>
  );
}

function Trail() {
  const trail = useDemoStore((s) => s.maze.trail);

  return (
    <>
      {trail.map(([x, z], index) => {
        const opacity = 0.08 + (index / Math.max(trail.length - 1, 1)) * 0.32;
        return (
          <mesh key={`${x}-${z}-${index}`} position={[x, 0.018, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.11, 14]} />
            <meshBasicMaterial color="#a5b4fc" transparent opacity={opacity} />
          </mesh>
        );
      })}
    </>
  );
}

function CheckpointPads() {
  return (
    <>
      {CHECKPOINTS.map((checkpoint) => (
        <mesh key={checkpoint.id} position={[checkpoint.x, 0.008, checkpoint.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[checkpoint.radius * 0.62, checkpoint.radius, 42]} />
          <meshBasicMaterial color={checkpoint.id === 'door-pad' ? '#fbbf24' : '#93c5fd'} transparent opacity={0.35} />
        </mesh>
      ))}
      <mesh position={[DOOR_PAD.x, 0.02, DOOR_PAD.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[DOOR_PAD.radius * 0.42, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.22} />
      </mesh>
    </>
  );
}

function Floor() {
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[0, FLOOR_Y, 0]}>
        <CuboidCollider args={[ARENA_WIDTH / 2, 0.04, ARENA_DEPTH / 2]} />
        <mesh receiveShadow>
          <boxGeometry args={[ARENA_WIDTH, 0.08, ARENA_DEPTH]} />
          <meshStandardMaterial color="#0b1020" roughness={0.93} />
        </mesh>
      </RigidBody>
      <gridHelper args={[10, 20, '#334155', '#172033']} position={[0, 0.01, 0]} />
    </>
  );
}

function CameraRig() {
  const { camera, size } = useThree();

  React.useEffect(() => {
    camera.position.set(7.8, 8.9, 7.4);
    camera.lookAt(0, 0, 0);
    if ('zoom' in camera) {
      camera.zoom = size.width < 700 ? 54 : 68;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width]);

  return null;
}

function SceneContent() {
  const mode = useDemoStore((s) => s.mode);
  const hazards = useDemoStore((s) => s.maze.hazards);
  const wash = mode === 'training' ? '#064e3b' : mode === 'inference' ? '#1d4ed8' : '#111827';

  return (
    <>
      <PerspectiveCamera makeDefault={false} />
      <ambientLight intensity={0.34} />
      <directionalLight
        position={[4.8, 9.2, 5.4]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <pointLight position={[-4, 3, -3.8]} color="#818cf8" intensity={0.8} />
      <Environment preset="warehouse" />
      <ContactShadows position={[0, 0, 0]} opacity={0.38} scale={12} blur={2.4} />

      <Physics gravity={[0, -9.81, 0]}>
        <Floor />
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[ARENA_WIDTH - 0.65, ARENA_DEPTH - 0.65]} />
          <meshStandardMaterial color={wash} emissive={wash} emissiveIntensity={0.16} transparent opacity={0.28} />
        </mesh>
        <CheckpointPads />
        <SpawnPad />
        {WALLS.map((wall) => <WallModule key={wall.id} wall={wall} />)}
        <DoorModule />
        {hazards.map((hazard) => <HazardModule key={hazard.id} id={hazard.id} />)}
        <Trail />
        <GoalBeacon />
        <AgentRig />
      </Physics>

      <CameraRig />
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.76} maxPolarAngle={0.96} />
    </>
  );
}

export function Scene3D() {
  return (
    <Canvas shadows orthographic camera={{ position: [7.8, 8.9, 7.4], zoom: 68, near: 0.1, far: 80 }} dpr={[1, 2]}>
      <SceneContent />
    </Canvas>
  );
}
