"""Transfer genuine Mixamo FBX rotations to the purchased armour rig.
Read blood-angel-combat.blend in a fresh process. --trial limits the first check.
Sources and previous authored pack are never saved over.
"""
from pathlib import Path
import bpy, json, math, sys, hashlib
from mathutils import Vector, Quaternion, Matrix
ROOT=Path.home()/'.local/share/ignition-assets/blood-angel'
FILES=ROOT/'mixamo/axe-pack'
scene=bpy.data.scenes['Blood Angel Rigged'];bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
rig.animation_data_clear()
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
for p in rig.pose.bones: p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
meshes=[o for o in scene.objects if o.type=='MESH' and o.parent==rig]
for o in meshes:o.hide_viewport=True
mapping={'Pelvis':'Hips','Spine':'Spine','Chest':'Spine2','Head':'Head'}
for side,full in [('L','Left'),('R','Right')]:
    for t,s in [('Clavicle','Shoulder'),('UpperArm','Arm'),('Forearm','ForeArm'),('Hand','Hand'),('Thigh','UpLeg'),('Shin','Leg'),('Foot','Foot'),('Toe','ToeBase')]:mapping[t+'.'+side]=full+s
    for finger in ['Thumb','Index','Middle','Ring','Pinky']:
        for i in range(1,4):mapping[f'{finger}.{i:02d}.{side}']=full+'Hand'+finger+str(i)
rest={b.name:b.matrix_local.to_quaternion() for b in rig.data.bones}
# Parent-first evaluation order is independent of the Blender collection ordering.
ordered=[]
def visit(b):
    ordered.append(b)
    for c in b.children:visit(c)
for b in rig.data.bones:
    if not b.parent:visit(b)
labels={'standing idle':'Garde armée','standing walk forward':'Marche avant','standing walk back':'Marche arrière','standing walk left':'Pas latéral gauche','standing walk right':'Pas latéral droit','standing melee attack downward':'Frappe descendante','standing melee attack horizontal':'Frappe horizontale','standing melee attack backhand':'Frappe en revers','standing block idle':'Garde de blocage','standing block react large':'Réaction au blocage','standing dodge forward':'Esquive avant','standing dodge backward':'Esquive arrière','standing dodge left':'Esquive gauche','standing dodge right':'Esquive droite','standing melee punch':'Coup de poing'}
files=[p for p in sorted(FILES.glob('*.fbx')) if p.name!='X Bot.fbx' and 'jump' not in p.stem]
files += [ROOT/'mixamo/longbow-pack'/(n+'.fbx') for n in ['standing dodge forward','standing dodge backward','standing dodge left','standing dodge right','standing melee punch']]
if '--trial' in sys.argv:files=[FILES/(n+'.fbx') for n in ['standing idle','standing walk forward','standing melee attack downward']]
foot_points=[]
for o in meshes:
    if o.name.startswith('Boots_'):
        bone=o.vertex_groups[0].name
        foot_points.append((bone,[o.matrix_world@v.co for v in o.data.vertices]))
catalog=[];reports=[]
for file in files:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(file))
    imported=set(bpy.data.objects)-before
    source=next(o for o in imported if o.type=='ARMATURE')
    source_action=source.animation_data.action
    start,end=map(round,source_action.frame_range)
    source_bones={name:source.data.bones['mixamorig:'+s] for name,s in mapping.items()}
    world_rotation=source.matrix_world.to_quaternion()
    correction={}
    for name,b in source_bones.items():
        sr=world_rotation@b.matrix_local.to_quaternion()
        tb=rig.data.bones[name]
        target_direction=(tb.tail_local-tb.head_local).normalized()
        source_direction=sr@Vector((0,1,0))
        aligned=source_direction.rotation_difference(target_direction)@sr
        # Align reference bone directions first, preserving only roll correction.
        # Copying rest-pose deltas directly would double the armour's bent elbows.
        correction[name]=aligned.inverted()@rest[name]
        assert (correction[name]@Vector((0,1,0))-Vector((0,1,0))).length<1e-4, 'Retarget correction changes bone direction: '+name
    hips=source.data.bones['mixamorig:Hips']
    source_height=(source.matrix_world@hips.head_local).z
    scale=rig.data.bones['Pelvis'].head_local.z/source_height
    name='mx_'+file.stem.replace(' ','_').replace('.','')
    action=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=action
    source_positions=[]
    for frame in range(start,end+1):
        scene.frame_set(frame)
        poses={n:world_rotation@source.pose.bones['mixamorig:'+s].matrix.to_quaternion()@correction[n] for n,s in mapping.items()}
        computed={}
        for bone in ordered:
            n=bone.name
            base=rest[n] if not bone.parent else computed[bone.parent.name]@rest[bone.parent.name].inverted()@rest[n]
            desired=poses.get(n,base)
            # Shoulder plates keep their independent attachment and follow half the upper-arm swing.
            if n.startswith('Pauldron.'):
                side=n[-1];upper=poses['UpperArm.'+side]
                delta=upper@rest['UpperArm.'+side].inverted()
                desired=Quaternion().slerp(delta,.35)@base
            computed[n]=desired
            p=rig.pose.bones[n];p.rotation_quaternion=base.inverted()@desired;p.location=(0,0,0)
        hip_position=source.matrix_world@source.pose.bones['mixamorig:Hips'].matrix.translation
        source_positions.append(list(hip_position))
        # Preview loops stay in place; only pelvis height follows captured motion.
        dz=(hip_position.z-source_height)*scale
        travel=(hip_position-Vector(source_positions[0]))*scale
        if any(word in file.stem for word in ['walk','run','idle']):travel.x=0;travel.y=0
        rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((travel.x,travel.y,dz))
        transforms={}
        for b in ordered:
            p=rig.pose.bones[b.name]
            parent=Matrix.Identity(4) if not b.parent else transforms[b.parent.name]@b.parent.matrix_local.inverted()
            transforms[b.name]=parent@b.matrix_local@Matrix.Translation(p.location)@p.rotation_quaternion.to_matrix().to_4x4()
        lowest=min((transforms[n]@rig.data.bones[n].matrix_local.inverted()@v).z for n,points in foot_points for v in points)
        # Keep the lowest boot on the floor after adapting leg proportions.
        rig.pose.bones['Root'].location+=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,0,-lowest))
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_quaternion',frame=frame-start+1,group=p.name)
            p.keyframe_insert('location',frame=frame-start+1,group=p.name)
    action.use_fake_user=True
    loop=' to ' not in file.stem and any(word in file.stem for word in ['idle','walk','run'])
    category='Esquives' if 'dodge' in file.stem else 'Attaques' if 'punch' in file.stem else 'Déplacements' if any(word in file.stem for word in ['walk','run','turn']) else 'Attaques' if 'attack' in file.stem or 'kick' in file.stem else 'Défense' if 'block' in file.stem else 'Gardes' if 'idle' in file.stem else 'Réactions et gestes'
    catalog.append(dict(name=name,label=labels.get(file.stem,file.stem.capitalize()),category=category,loop=loop,duration=(end-start)/scene.render.fps,source=file.name,pack=file.parent.name,speed=(Vector(source_positions[-1])-Vector(source_positions[0])).xy.length*scale/max((end-start)/scene.render.fps,.01)))
    reports.append(dict(name=name,source=file.name,pack=file.parent.name,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),source_bones=len(source.data.bones),target_bones=len(rig.data.bones),frames=end-start+1,source_hip_start=source_positions[0],source_hip_end=source_positions[-1]))
    for o in imported:bpy.data.objects.remove(o,do_unlink=True)
    bpy.data.actions.remove(source_action)
    print('RETARGETED',name,end-start+1,flush=True)
rig.animation_data.action=None
for o in meshes:o.hide_viewport=False
for p in rig.pose.bones:p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
scene.render.fps=30;scene.frame_start=1;scene.frame_end=120
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blood-angel-mixamo.blend'))
(ROOT/'mixamo-catalog.json').write_text(json.dumps(catalog,indent=2,ensure_ascii=False))
(ROOT/'mixamo-retarget-report.json').write_text(json.dumps(reports,indent=2))
print('MIXAMO_RETARGET_COMPLETE',len(catalog),flush=True)
