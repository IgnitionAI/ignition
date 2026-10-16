"""Check provenance and actual evaluated boot contact in the saved retarget scene."""
from pathlib import Path
import bpy,json,hashlib
ROOT=Path.home()/'.local/share/ignition-assets/blood-angel'
s=bpy.data.scenes['Blood Angel Rigged'];bpy.context.window.scene=s
rig=next(o for o in s.objects if o.type=='ARMATURE')
records=json.loads((ROOT/'mixamo-retarget-report.json').read_text())
assert len(records)==48
assert {a.name for a in bpy.data.actions}=={r['name'] for r in records}
for r in records:
    source=ROOT/'mixamo'/r['pack']/r['source']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==r['sha256']
    assert 'jump' not in r['source']
    assert len(rig.data.bones)==r['target_bones']==55 and r['source_bones']==65
    a=bpy.data.actions[r['name']]
    assert round(a.frame_range[1]-a.frame_range[0]+1)==r['frames']
feet=[o for o in s.objects if o.type=='MESH' and o.parent==rig and o.name.startswith('Boots_')]
checks=[]
for name in ['mx_standing_idle','mx_standing_walk_forward','mx_standing_melee_attack_downward','mx_standing_dodge_forward','mx_standing_dodge_left','mx_standing_melee_punch']:
    a=bpy.data.actions[name];rig.animation_data.action=a;rig.animation_data.action_slot=a.slots[0]
    for fraction in [.0,.25,.5,.75,1.0]:
        s.frame_set(round(a.frame_range[0]+fraction*(a.frame_range[1]-a.frame_range[0])))
        bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
        low=min((o.matrix_world@v.co).z for original in feet for o in [original.evaluated_get(deps)] for v in o.data.vertices)
        assert abs(low)<.002,(name,fraction,low)
        checks.append(dict(clip=name,fraction=fraction,lowest_boot=low))
(ROOT/'mixamo-validation.json').write_text(json.dumps(dict(clips=len(records),samples=checks),indent=2))
print('MIXAMO_VALIDATED',len(records),'sources',len(checks),'ground checks')
