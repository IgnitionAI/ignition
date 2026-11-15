import { Box3, Group, Vector3 } from 'three';
export const MODEL_SCALE = Object.freeze({ drone: .5, cargo: .65, dock: 1 });
export const MODEL_ROTATION: [number, number, number] = [0, -Math.PI / 2, 0];
export const DOCK_DECK_HEIGHT = -.65;
export const MODEL_URLS = Object.freeze({ drone: 'drone-remorqueur', cargo: 'cargo-orbitale', dock: 'poste-arrimage' });
export type ModelKind = keyof typeof MODEL_URLS;
export const ENVELOPES = { drone: [1.6, .8, 1.2], cargo: [2, 1.2, 1.6] } as const;
// Adapt runtime instances only; original GLBs and their nodal pivots remain untouched.
export function adaptModel(model: Group, kind: ModelKind): Group {
  const adapter = new Group(), oriented = new Group();
  oriented.rotation.y = kind === 'cargo' ? 0 : -Math.PI / 2;
  oriented.scale.setScalar(MODEL_SCALE[kind]); oriented.add(model); adapter.add(oriented);
  if (kind !== 'dock') {
    adapter.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(adapter), size = bounds.getSize(new Vector3());
    oriented.position.copy(bounds.getCenter(new Vector3()).negate());
    const target = ENVELOPES[kind];
    // 2% clearance contains the slight ClampClose sweep beyond authored rest bounds.
    const clearance = kind === 'drone' ? .98 : 1;
    adapter.scale.set(target[0] / size.x * clearance, target[1] / size.y * clearance, target[2] / size.z * clearance);
  }
  return adapter;
}
