import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { SceneProps } from './simulation-contract';

/** Maquette technique provisoire : primitives uniquement, remplacée à l'intégration des modèles finaux. */
export default function TechnicalPreview({ env }: SceneProps) {
  const drone = useRef<Group>(null), cargo = useRef<Group>(null), arm = useRef<Group>(null);
  useFrame(() => {
    if (!drone.current || !cargo.current || !arm.current) return;
    for (const [object, body] of [[drone.current, env.drone], [cargo.current, env.cargo]] as const) {
      object.position.copy(body.translation()); object.quaternion.copy(body.rotation());
    }
    const c = env.cargo.translation(), d = env.drone.translation();
    arm.current.position.set((c.x + d.x) / 2, 0, (c.z + d.z) / 2);
    arm.current.quaternion.copy(env.cargo.rotation());
  });
  return <>
    <color attach="background" args={['#101923']} />
    <ambientLight intensity={1.5} /><directionalLight position={[0, 15, 8]} intensity={2} />
    <gridHelper args={[30, 30, '#425667', '#243441']} position={[0, -0.7, 0]} />
    {env.solids.map(solid => <mesh key={solid.id} position={[solid.position.x, solid.position.y, solid.position.z]}>
      <boxGeometry args={[solid.size.x, solid.size.y, solid.size.z]} /><meshStandardMaterial color="#516274" transparent opacity={0.65} />
    </mesh>)}
    <mesh position={[env.goal.x, -0.65, env.goal.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.45, 0.55, 48]} /><meshBasicMaterial color="#63f5be" />
    </mesh>
    <group ref={cargo}><mesh><boxGeometry args={[2, 1.2, 1.6]} /><meshStandardMaterial color="#e8ac58" /></mesh></group>
    <group ref={drone}><mesh><boxGeometry args={[1.6, 0.8, 1.2]} /><meshStandardMaterial color="#7ac5f0" /></mesh>
      <mesh position={[0.81, 0, 0]}><boxGeometry args={[0.05, 0.5, 0.6]} /><meshBasicMaterial color="#fff" /></mesh>
    </group>
    <group ref={arm}><mesh><boxGeometry args={[0.5, 0.15, 0.15]} /><meshStandardMaterial color="#c6d5df" /></mesh></group>
  </>;
}
