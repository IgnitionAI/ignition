export function Rail() {
  return (
    <group>
      {/* Ground plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Rail track */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[5, 0.02, 0.08]} />
        <meshStandardMaterial color="#4a5568" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rail edges */}
      <mesh position={[0, 0.035, 0.05]}>
        <boxGeometry args={[5, 0.01, 0.01]} />
        <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.2} emissive="#6366f1" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.035, -0.05]}>
        <boxGeometry args={[5, 0.01, 0.01]} />
        <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.2} emissive="#6366f1" emissiveIntensity={0.3} />
      </mesh>

      {/* Boundary markers at x = ±2.4 */}
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]}>
          <boxGeometry args={[0.02, 0.2, 0.15]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.6} emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
