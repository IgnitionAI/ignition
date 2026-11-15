import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { PointLight, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { ContactSignal } from './signals';
import type { Signals } from './signals';
export function ContactBeacon({ signals, reducedMotion }: { signals: MutableRefObject<Signals>; reducedMotion: boolean }) {
  const light = useRef<PointLight>(null), contact = useRef(new ContactSignal());
  useFrame((_, delta) => { const energy = contact.current.update(signals.current, delta, reducedMotion); if (light.current) light.current.intensity = energy; });
  return <pointLight ref={light} color="#ff4938" distance={4} decay={2} intensity={0} />;
}
export function CommandBeacon({ signals }: { signals: MutableRefObject<Signals> }) {
  const material = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    if (!material.current) return;
    const state = signals.current, braking = state.action === 7, yaw = (state.action === 5 || state.action === 6) && state.torque !== 0;
    material.current.emissive.set(braking ? '#ffaa30' : state.torque > 0 ? '#69ddeb' : '#a997ff');
    material.current.emissiveIntensity = state.outcome === 'running' && (braking || yaw) ? 2 : 0;
  });
  return <mesh position={[0, .44, 0]}><sphereGeometry args={[.08, 8, 6]} /><meshStandardMaterial ref={material} color="#536571" /></mesh>;
}
