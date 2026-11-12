import { AnimationClip, AnimationMixer, BufferGeometry, Group, LoopOnce, Material, Mesh, Texture } from 'three';

// One owner per parsed GLB. Capture originals before per-node material isolation.
export function ownModel(root: Group) {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>();
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    const source: Material[] = Array.isArray(object.material) ? object.material : [object.material];
    const clones = source.map(material => {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
      const clone = material.clone(); materials.add(clone); return clone;
    });
    object.material = Array.isArray(object.material) ? clones : clones[0];
  });
  let disposed = false;
  return () => {
    if (disposed) return; disposed = true;
    root.removeFromParent(); // No disposed object remains attached during a swap.
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
  };
}

export function createClipPlayer(root: Group, clips: AnimationClip[], name?: string) {
  const mixer = new AnimationMixer(root), clip = clips.find(item => item.name === name);
  const action = clip ? mixer.clipAction(clip) : null;
  let generation = -1, enabled = false, reduced = false;
  return {
    sync(nextGeneration: number, active: boolean, reducedMotion: boolean) {
      if (!action || !clip) return;
      if (generation !== nextGeneration || enabled !== active || reduced !== reducedMotion) {
        // stop restores the original property bindings, including after a completed clip.
        action.stop(); generation = nextGeneration; enabled = active; reduced = reducedMotion;
        action.reset().setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play();
        // Inactive means hold the first clip key, which can differ from exported rest.
        action.time = active && reducedMotion ? clip.duration : 0;
        mixer.update(0); action.paused = !active || reducedMotion;
      }
    },
    update(delta: number) { if (enabled && !reduced) mixer.update(Math.min(delta, .05)); },
    dispose() { mixer.stopAllAction(); mixer.uncacheRoot(root); },
  };
}

// Async owner used by the hook and tested with real Three trees, including late replies.
export function createLoadSlot(parent: Group) {
  let alive = true, release: (() => void) | undefined;
  return {
    accept(root: Group, prepare: () => { object: Group; cleanup: () => void }) {
      const dispose = ownModel(root);
      if (!alive) { dispose(); return false; }
      release?.();
      const prepared = prepare(); parent.add(prepared.object);
      release = () => { prepared.object.removeFromParent(); prepared.cleanup(); dispose(); };
      return true;
    },
    close() { alive = false; release?.(); release = undefined; },
    get alive() { return alive; },
  };
}
