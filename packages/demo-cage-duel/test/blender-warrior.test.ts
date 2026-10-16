import { describe, it, expect } from 'vitest';
import { Group, PropertyBinding } from 'three';
import { BlenderWarrior } from '../src/blender-warrior';
import { Duel } from '../src/duel';

describe('Blender rigid animation', () => {
    it('animates exported pivots after GLTFLoader sanitizes their names without mutating the source', () => {
        const source = new Group();
        const arm = new Group();
        arm.name = PropertyBinding.sanitizeNodeName('UpperArm.R.001');
        source.add(arm);
        const warrior = new BlenderWarrior(source, false);
        const duel = new Duel();
        duel.fighters[0].phase = 'windup';
        duel.fighters[0].timer = 4;
        warrior.update(duel.fighters[0], duel.fighters[1], 1, false);
        expect(warrior.root.getObjectByName(arm.name)!.rotation.x).toBeLessThan(-.4);
        expect(arm.rotation.x).toBe(0);
    });
});
