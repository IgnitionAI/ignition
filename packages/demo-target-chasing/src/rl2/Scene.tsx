// Same scene as the PPO replay page (camera, floor, agent, target): only the
// environment objects are drawn, never a variant colour.
export const TARGET = 0.75;

export function xOf(pos: number): number {
  return pos * 6 - 3;
}

export function nav1dStep(pos: number, action: number): { newPos: number; reward: number; done: boolean } {
  const delta = action === 1 ? 0.15 : -0.15;
  const newPos = Math.max(0, Math.min(1, pos + delta));
  const done = newPos > 0.7;
  return { newPos, reward: done ? 1.0 : -0.05, done };
}

export function Scene({ position }: { position: number }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 8, 4]} intensity={1.1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#1e2937" />
      </mesh>
      <mesh position={[xOf(position), 0, 0]} castShadow>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[xOf(TARGET), 0, 0]}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </>
  );
}
