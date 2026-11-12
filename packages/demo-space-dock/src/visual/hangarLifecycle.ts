import { Group, Mesh } from 'three';
import { createLoadSlot } from './modelLifecycle';
import type { AssetStatus } from './useGLB';

/** One parsed, static world-space asset per owner; no mixer or simulation link. */
export function createHangarLoad(parent: Group, compact: boolean, onStatus: (status: AssetStatus) => void) {
  const slot = createLoadSlot(parent);
  onStatus('loading');
  return {
    loaded(model: Group) {
      const accepted = slot.accept(model, () => {
        model.traverse(object => {
          if (object instanceof Mesh) {
            object.castShadow = !compact;
            object.receiveShadow = true;
          }
        });
        // Authored world coordinates: no recentering, rotation, scaling or clips.
        return { object: model, cleanup: () => {} };
      });
      if (accepted) onStatus('ready');
    },
    failed() { if (slot.alive) onStatus('NONFINAL'); },
    close() { slot.close(); },
  };
}
