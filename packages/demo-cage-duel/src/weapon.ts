import type { Object3D } from 'three';
export type Weapon = 'chainsword' | 'chainaxe';
/** The sword was exported from Blender in the Blood Angel Hand.R local frame. */
export function attachChainsword(character: Object3D, sword: Object3D): void {
    const hand = character.getObjectByName('HandR') ?? character.getObjectByName('Hand.R');
    if (!hand) throw new Error('Point de prise Hand.R absent du personnage');
    const instance = sword.clone(true); instance.name = 'EquippedChainsword';
    // Undo the standalone glTF Z-up→Y-up conversion: exported joint-local axes stay in Blender's bone frame.
    instance.rotation.x = Math.PI / 2; hand.add(instance);
    selectWeapon(character, 'chainsword');
}
export function selectWeapon(character: Object3D, weapon: Weapon): void {
    character.traverse(object => {
        if (object.name === 'EquippedChainsword') object.visible = weapon === 'chainsword';
        if (/^Chainaxe|^Grip[ _]ring/.test(object.name)) object.visible = weapon === 'chainaxe';
    });
}
