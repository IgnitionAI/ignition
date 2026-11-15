import { Group, Mesh, MeshStandardMaterial } from 'three';
export type Signals = { generation: number; action: number; contacts: number; outcome: string; torque: number };
export const initialSignals = (): Signals => ({ generation: -1, action: 0, contacts: 0, outcome: 'running', torque: 0 });
export function nozzleActive(name: string, action: number): boolean {
  if (name.startsWith('ThrusterCore')) return action === 1;
  if (name.startsWith('RetroCore')) return action === 2;
  if (name.startsWith('LateralCore')) return name.endsWith('_R') ? action === 3 : action === 4;
  return false;
}
export function updateMaterials(model: Group, signals: Signals, kind: string, reduced: boolean, delta: number) {
  model.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      if (/(ThrusterCore|RetroCore|LateralCore)/.test(object.name)) {
        const target = signals.outcome === 'running' && nozzleActive(object.name, signals.action) ? 4.5 : .25;
        material.emissiveIntensity = reduced ? target : material.emissiveIntensity + (target - material.emissiveIntensity) * Math.min(1, delta * 18);
      }
      if (kind === 'dock' && object.name === 'Static_e2a13c') {
        const success = signals.outcome === 'success';
        material.color.set(success ? '#62c997' : '#b4772c');
        material.emissive.set(success ? '#45e68f' : '#ff9d28'); material.emissiveIntensity = success ? 2 : 1.4;
      }
    }
  });
}
export class ContactSignal {
  private generation = -1;
  private contacts = 0;
  energy = 0;
  update(signals: Signals, delta: number, reduced: boolean) {
    if (signals.generation !== this.generation) { this.generation = signals.generation; this.contacts = signals.contacts; this.energy = 0; }
    else if (signals.contacts > this.contacts) this.energy = reduced ? 2 : 9;
    this.contacts = signals.contacts;
    this.energy = Math.max(0, this.energy - delta * (reduced ? 4 : 12));
    return this.energy;
  }
}
