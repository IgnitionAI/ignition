import { forwardRef, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLB } from './useGLB';
import type { AssetStatus } from './useGLB';
import { ENVELOPES } from './modelConfig';
import type { ModelKind } from './modelConfig';
import { updateMaterials } from './signals';
import type { Signals } from './signals';
type Props = { kind: ModelKind; compact: boolean; reducedMotion: boolean; signals: MutableRefObject<Signals>; status: AssetStatus; onStatus: (kind: ModelKind, status: AssetStatus) => void; position?: [number, number, number] };
export const MechanicalModel = forwardRef<Group, Props>(function MechanicalModel({ kind, compact, reducedMotion, signals, status, onStatus, position }, ref) {
  const assetRoot = useRef<Group>(null);
  const generation = useRef(-1);
  const loaded = useGLB(assetRoot, kind, compact, onStatus);
  useFrame((_, delta) => {
    if (!loaded.current) return;
    const { model, player } = loaded.current, state = signals.current;
    player.sync(state.generation, kind === 'drone' || state.outcome === 'success', reducedMotion);
    player.update(delta); updateMaterials(model, state, kind, reducedMotion || generation.current !== state.generation, delta);
    generation.current = state.generation;
  });
  return <group ref={ref} position={position}>
    <group ref={assetRoot} dispose={null} />
    {status === 'NONFINAL' && <mesh><boxGeometry args={kind === 'dock' ? [2, .1, 3] : [...ENVELOPES[kind]]} /><meshStandardMaterial color="#c58b40" wireframe /></mesh>}
  </group>;
});
