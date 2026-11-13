import { useEffect, useMemo } from 'react';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type SolidView = { id: string; position: { x: number; y: number; z: number }; size: { x: number; y: number; z: number } };

function Panel({ size, position = [0, 0, 0], color = '#26363e', metalness = .75, roughness = .46 }: {
  size: [number, number, number]; position?: [number, number, number]; color?: string; metalness?: number; roughness?: number;
}) {
  const geometry = useMemo(() => new RoundedBoxGeometry(...size, 2, Math.min(.06, Math.min(...size) / 3)), [...size]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={position} castShadow receiveShadow>
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
  </mesh>;
}

export function IndustrialSolid({ solid }: { solid: SolidView }) {
  const p: [number, number, number] = [solid.position.x, solid.position.y, solid.position.z];
  const s = solid.size;
  if (solid.id === 'module-a' || solid.id === 'module-b') return <group position={p}>
    <Panel size={[s.x, s.y, s.z]} />
    <Panel size={[s.x + .06, .16, s.z + .06]} position={[0, s.y * .32, 0]} color="#a96f2b" />
    <Panel size={[s.x * .58, .48, .05]} position={[0, 0, s.z / 2 + .03]} color="#101a20" />
    {[-.32, 0, .32].map(x => <Panel key={x} size={[.1, .65, .08]} position={[x, 0, s.z / 2 + .07]} color="#829098" />)}
    <mesh position={[s.x / 2 + .06, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[.11, .11, s.y * .72, 12]} /><meshStandardMaterial color="#8c989c" metalness={.85} roughness={.3} />
    </mesh>
  </group>;
  return <group position={p}>
    <Panel size={[s.x, s.y, s.z]} color="#1d2a31" />
    {s.x > 2 && Array.from({ length: 12 }, (_, index) => -11 + index * 2).map(x => <group key={x}>
      <Panel size={[.13, s.y + .12, s.z + .12]} position={[x, 0, 0]} color="#738188" />
      <Panel size={[.75, .18, s.z + .14]} position={[x, s.y * .3, 0]} color="#a96f2b" />
    </group>)}
  </group>;
}

export function HangarFloor() {
  return <group position={[0, -.76, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[40, 26]} /><meshStandardMaterial color="#0c151b" metalness={.62} roughness={.75} />
    </mesh>
    <gridHelper args={[40, 40, '#31434b', '#17272e']} position={[0, .012, 0]} />
  </group>;
}
