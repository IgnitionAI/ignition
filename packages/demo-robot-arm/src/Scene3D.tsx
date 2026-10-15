import { useEffect, useRef, type ComponentRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { L1, L2, PIVOT_Y, SUCCESS_DISTANCE } from './robot-arm-env';
import { useDemoStore } from './store';
import { makeT } from './i18n';

function Arm() {
  const hud = useDemoStore((s) => s.hud);
  const reached = hud !== null && hud.distance <= (hud.successDistance ?? SUCCESS_DISTANCE);
  const q0 = hud?.q0 ?? 0;
  const q1 = hud?.q1 ?? (45 * Math.PI) / 180;
  const q2 = hud?.q2 ?? (-30 * Math.PI) / 180;
  const target: [number, number, number] = hud
    ? [hud.target.x, hud.target.y, hud.target.z]
    : [0.9, 1.4, 0.9];

  return (
    <>
      {/* Pedestal up to the pivot */}
      <mesh position={[0, PIVOT_Y / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.2, PIVOT_Y, 24]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Arm: yaw (base) → pitch (shoulder) → relative pitch (elbow) */}
      <group position={[0, PIVOT_Y, 0]} rotation={[0, q0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.09, 24, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>
        <group rotation={[-q1, 0, 0]}>
          <mesh position={[0, 0, L1 / 2]} castShadow>
            <boxGeometry args={[0.09, 0.09, L1]} />
            <meshStandardMaterial color="#818cf8" metalness={0.5} roughness={0.45} />
          </mesh>
          <mesh position={[0, 0, L1]} castShadow>
            <sphereGeometry args={[0.075, 24, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
          </mesh>
          <group rotation={[-q2, 0, 0]}>
            <mesh position={[0, 0, L2 / 2]} castShadow>
              <boxGeometry args={[0.07, 0.07, L2]} />
              <meshStandardMaterial color="#a5b4fc" metalness={0.5} roughness={0.45} />
            </mesh>
            {/* Tip: solid sphere, distinct from the octahedral target */}
            <mesh position={[0, 0, L2]} castShadow>
              <sphereGeometry args={[0.06, 24, 16]} />
              <meshStandardMaterial
                color={reached ? '#4ade80' : '#fbbf24'}
                emissive={reached ? '#22c55e' : '#b45309'}
                emissiveIntensity={0.7}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* Target: octahedron (+ wireframe shell) — distinct geometry from the tip */}
      <group position={target}>
        <mesh>
          <octahedronGeometry args={[0.075]} />
          <meshStandardMaterial
            color={reached ? '#4ade80' : '#f472b6'}
            emissive={reached ? '#16a34a' : '#be185d'}
            emissiveIntensity={0.6}
            transparent
            opacity={0.9}
          />
        </mesh>
        <mesh>
          <octahedronGeometry args={[0.11]} />
          <meshBasicMaterial color={reached ? '#4ade80' : '#f9a8d4'} wireframe transparent opacity={0.35} />
        </mesh>
        {reached && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.012, 12, 40]} />
            <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.8} />
          </mesh>
        )}
      </group>
    </>
  );
}

function SceneContent() {
  const cameraResetSignal = useDemoStore((s) => s.cameraResetSignal);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  useEffect(() => {
    if (cameraResetSignal > 0) controlsRef.current?.reset();
  }, [cameraResetSignal]);

  return (
    <>
      <color attach="background" args={['#0a0a1a']} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <pointLight position={[-3, 3, -2]} intensity={0.25} color="#6366f1" />

      {/* Ground + XYZ frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <gridHelper args={[6, 12, '#334155', '#1e293b']} />
      <axesHelper args={[0.5]} position={[0, 0.002, 0]} />

      <Arm />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        enablePan={false}
        target={[0, 0.9, 0]}
        minDistance={1.2}
        maxDistance={7}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

export function Scene3D() {
  const lang = useDemoStore((s) => s.lang);
  const t = makeT(lang);
  return (
    <div className="scene-wrap">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [2.8, 2.4, 3.0], fov: 42 }}
        role="img"
        aria-label={t.canvasAlt}
      >
        <SceneContent />
      </Canvas>
      <p className="scene-fallback">{t.canvasAlt}</p>
    </div>
  );
}
