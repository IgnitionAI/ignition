import { useEffect, useRef, type ComponentRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { QuadraticBezierCurve3, Vector3 } from 'three';
import { L1, L2, PIVOT_Y, SUCCESS_DISTANCE } from './robot-arm-env';
import { useDemoStore } from './store';
import { makeT } from './i18n';

const DARK_METAL = { color: '#3f4b5f', metalness: 0.75, roughness: 0.35 };
const LIGHT_METAL = { color: '#8b98ac', metalness: 0.8, roughness: 0.3 };

/** Servo-style joint: housing cylinder along the pitch axis (X) + end caps. */
function ServoJoint({ radius = 0.105, length = 0.15 }: { radius?: number; length?: number }) {
  return (
    <group>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, length, 24]} />
        <meshStandardMaterial {...DARK_METAL} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * (length / 2 + 0.012), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.68, radius * 0.68, 0.024, 20]} />
          <meshStandardMaterial {...LIGHT_METAL} />
        </mesh>
      ))}
    </group>
  );
}

/** Rectangular link (rounded edges) with a lighter top spine and end collars. */
function Link({ length, width, color }: { length: number; width: number; color: string }) {
  return (
    <group>
      <RoundedBox args={[width, width, length]} radius={0.018} smoothness={4} position={[0, 0, length / 2]} castShadow>
        <meshStandardMaterial color={color} metalness={0.45} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, width / 2 + 0.012, length / 2]} castShadow>
        <boxGeometry args={[width * 0.4, 0.024, length * 0.84]} />
        <meshStandardMaterial {...LIGHT_METAL} />
      </mesh>
      {[0.06, length - 0.06].map((z) => (
        <mesh key={z} castShadow position={[0, 0, z]}>
          <boxGeometry args={[width + 0.018, width + 0.018, 0.045]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Flexible cable running from segment 1 to segment 2; the sag follows the
 * elbow angle so it visibly flexes when the joint moves.
 */
function ElbowCable({ q2, side }: { q2: number; side: 1 | -1 }) {
  const a = -q2;
  const start = new Vector3(side * 0.052, 0.11, 0.22);
  const end = new Vector3(
    side * 0.052,
    0.11 * Math.cos(a) - 0.3 * Math.sin(a),
    L1 + 0.11 * Math.sin(a) + 0.3 * Math.cos(a),
  );
  const mid = start.clone().add(end).multiplyScalar(0.5);
  mid.y += 0.05 + 0.1 * (1 - Math.cos(q2)); // sag grows as the elbow folds
  const curve = new QuadraticBezierCurve3(start, mid, end);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 16, 0.016, 8]} />
      <meshStandardMaterial color="#7d8aa0" metalness={0.3} roughness={0.6} />
    </mesh>
  );
}

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
      {/* Base: mounting plate, bolts, stepped pedestal, yaw hub and accent ring */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.04, 32]} />
        <meshStandardMaterial {...DARK_METAL} />
      </mesh>
      {[[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]].map(([x, z]) => (
        <mesh key={`${x}:${z}`} castShadow position={[x, 0.05, z]}>
          <cylinderGeometry args={[0.022, 0.022, 0.03, 12]} />
          <meshStandardMaterial {...LIGHT_METAL} />
        </mesh>
      ))}
      <mesh position={[0, PIVOT_Y / 2 - 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.17, PIVOT_Y - 0.04, 24]} />
        <meshStandardMaterial {...DARK_METAL} />
      </mesh>
      <mesh position={[0, PIVOT_Y - 0.075, 0]} castShadow>
        <cylinderGeometry args={[0.145, 0.145, 0.05, 24]} />
        <meshStandardMaterial {...LIGHT_METAL} />
      </mesh>
      {/* amber safety stripe + control box with status LED */}
      <mesh position={[0, 0.24, 0]}>
        <torusGeometry args={[0.155, 0.012, 10, 32]} />
        <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={0.55} />
      </mesh>
      <group position={[0, 0.34, 0.16]} rotation={[0.12, 0, 0]}>
        <RoundedBox args={[0.13, 0.17, 0.07]} radius={0.012} smoothness={4} castShadow>
          <meshStandardMaterial {...DARK_METAL} />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.037]}>
          <circleGeometry args={[0.014, 12]} />
          <meshStandardMaterial color={reached ? '#4ade80' : '#22d3ee'} emissive={reached ? '#16a34a' : '#0e7490'} emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Arm: yaw (base) → pitch (shoulder) → relative pitch (elbow) */}
      <group position={[0, PIVOT_Y, 0]} rotation={[0, q0, 0]}>
        {/* yaw hub + emissive ring showing the base joint */}
        <mesh castShadow position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.115, 0.12, 24]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        <mesh position={[0, -0.085, 0]}>
          <torusGeometry args={[0.125, 0.014, 12, 32]} />
          <meshStandardMaterial color="#6366f1" emissive="#4338ca" emissiveIntensity={0.6} />
        </mesh>
        <ServoJoint />
        <group rotation={[-q1, 0, 0]}>
          <Link length={L1} width={0.09} color="#93c5fd" />
          <ElbowCable q2={q2} side={1} />
          <ElbowCable q2={q2} side={-1} />
          <group position={[0, 0, L1]}>
            <ServoJoint radius={0.085} length={0.13} />
          </group>
          <group rotation={[-q2, 0, 0]} position={[0, 0, L1]}>
            <Link length={L2} width={0.07} color="#c7d2fe" />
            {/* wrist collar + tip: solid sphere, distinct from the octahedral target */}
            <mesh castShadow position={[0, 0, L2 - 0.035]}>
              <cylinderGeometry args={[0.05, 0.056, 0.06, 18]} />
              <meshStandardMaterial {...LIGHT_METAL} />
            </mesh>
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
      <color attach="background" args={['#0d1024']} />
      <hemisphereLight args={['#5b6b9e', '#141824', 0.55]} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <pointLight position={[-3, 3, -2]} intensity={0.25} color="#6366f1" />
      <pointLight position={[-2, 1.2, 2.5]} intensity={0.35} color="#93c5fd" />

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
        camera={{ position: [2.3, 2.1, 2.6], fov: 42 }}
        role="img"
        aria-label={t.canvasAlt}
      >
        <SceneContent />
      </Canvas>
      <p className="scene-fallback">{t.canvasAlt}</p>
    </div>
  );
}
