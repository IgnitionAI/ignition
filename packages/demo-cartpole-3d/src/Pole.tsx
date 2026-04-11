interface PoleProps {
  angle: number; // theta in radians
}

export function Pole({ angle }: PoleProps) {
  const poleLength = 0.8;

  return (
    <group rotation={[0, 0, -angle]}>
      {/* Pole — cylinder pivoted at bottom */}
      <mesh position={[0, poleLength / 2, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, poleLength, 12]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Tip ball */}
      <mesh position={[0, poleLength, 0]} castShadow>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Pivot point */}
      <mesh castShadow>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
