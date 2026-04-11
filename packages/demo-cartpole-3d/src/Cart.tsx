import { useRef } from 'react';
import { Mesh } from 'three';
import { RoundedBox } from '@react-three/drei';

export function Cart() {
  const ref = useRef<Mesh>(null);

  return (
    <RoundedBox ref={ref} args={[0.5, 0.15, 0.3]} radius={0.03} smoothness={4} castShadow receiveShadow>
      <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
    </RoundedBox>
  );
}
