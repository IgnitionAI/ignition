import { RoundedBox } from '@react-three/drei';

interface Car3DProps {
  x: number;
  y: number;
  angle: number;
}

export function Car3D({ x, y, angle }: Car3DProps) {
  return (
    <group position={[x, 0.15, y]} rotation={[0, -angle, 0]}>
      {/* Car body */}
      <RoundedBox args={[0.6, 0.15, 0.35]} radius={0.04} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Wheels */}
      {/* Front-left */}
      <mesh position={[0.2, -0.06, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Front-right */}
      <mesh position={[0.2, -0.06, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rear-left */}
      <mesh position={[-0.2, -0.06, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rear-right */}
      <mesh position={[-0.2, -0.06, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
