import { useEffect, useRef } from 'react';
import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createHangarLoad } from './hangarLifecycle';
import type { AssetStatus } from './useGLB';

export function StaticHangar({ compact, onStatus }: { compact: boolean; onStatus: (status: AssetStatus) => void }) {
  const parent = useRef<Group>(null);
  useEffect(() => {
    if (!parent.current) return;
    const owner = createHangarLoad(parent.current, compact, onStatus);
    const base = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
    try {
      new GLTFLoader().load(`${base}models/hangar-orbital.glb`, gltf => owner.loaded(gltf.scene), undefined, () => owner.failed());
    } catch {
      owner.failed();
    }
    return () => owner.close();
  }, [compact, onStatus]);
  return <group ref={parent} dispose={null} />;
}
