import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Group, Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { adaptModel, MODEL_URLS } from './modelConfig';
import type { ModelKind } from './modelConfig';
import { createClipPlayer, createLoadSlot } from './modelLifecycle';
export type AssetStatus = 'loading' | 'ready' | 'NONFINAL';
export function useGLB(parent: RefObject<Group | null>, kind: ModelKind, compact: boolean, onStatus: (kind: ModelKind, status: AssetStatus) => void) {
  const current = useRef<{ model: Group; player: ReturnType<typeof createClipPlayer> } | null>(null);
  useEffect(() => {
    if (!parent.current) return;
    const slot = createLoadSlot(parent.current);
    onStatus(kind, 'loading');
    const base = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
    new GLTFLoader().load(`${base}models/${MODEL_URLS[kind]}.glb`, gltf => {
      const accepted = slot.accept(gltf.scene, () => {
        gltf.scene.traverse(object => { if (object instanceof Mesh) { object.castShadow = !compact; object.receiveShadow = true; } });
        const player = createClipPlayer(gltf.scene, gltf.animations, kind === 'dock' ? 'DockLock' : kind === 'drone' ? 'ClampClose' : undefined);
        current.current = { model: gltf.scene, player };
        return { object: adaptModel(gltf.scene, kind), cleanup: () => { player.dispose(); current.current = null; } };
      });
      if (accepted) onStatus(kind, 'ready');
    }, undefined, () => { if (slot.alive) onStatus(kind, 'NONFINAL'); });
    return () => slot.close();
  }, [parent, kind, compact, onStatus]);
  return current;
}
