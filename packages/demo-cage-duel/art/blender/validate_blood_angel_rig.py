"""Validate saved diagnostic actions and render two poses in the private asset folder."""
import json
from pathlib import Path
import bpy

root = Path.home() / '.local/share/ignition-assets/blood-angel'
scene = bpy.data.scenes['Blood Angel Rigged']
bpy.context.window.scene = scene
rig = next(obj for obj in scene.objects if obj.type == 'ARMATURE')
assert len(rig.data.bones) == 55
meshes = [obj for obj in scene.objects if obj.type == 'MESH' and obj.parent == rig]
assert len(meshes) == 71
for obj in meshes:
    assert len(obj.vertex_groups) == 1
    assert obj.vertex_groups[0].name in rig.data.bones
    assert any(mod.type == 'ARMATURE' and mod.object == rig for mod in obj.modifiers)

def select_frame(action, frame):
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    scene.frame_set(frame)
    bpy.context.view_layer.update()

results = {}
for name, probe, minimum in [('Guard Test', 'Hand.R', .1), ('Strike Test', 'Hand.R', .1), ('Step Test', 'Foot.L', .02)]:
    action = bpy.data.actions[name]
    select_frame(action, 1)
    start = (rig.matrix_world @ rig.pose.bones[probe].head).copy()
    select_frame(action, 24)
    displacement = (rig.matrix_world @ rig.pose.bones[probe].head - start).length
    assert displacement > minimum, (name, displacement)
    results[name] = {'probe': probe, 'displacement': displacement}
    if name != 'Step Test':
        scene.render.filepath = str(root / ('rig-' + name.split()[0].lower() + '.png'))
        bpy.ops.render.render(write_still=True)
(root / 'rig-validation.json').write_text(json.dumps(results, indent=2))
print('RIG_VALIDATED', json.dumps(results))
