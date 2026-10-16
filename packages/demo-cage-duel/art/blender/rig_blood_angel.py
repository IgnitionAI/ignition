"""Add a rigid armour skeleton to a copy of the privately purchased scene.
Run Blender with blood-angel-prepared.blend, then -P this script.
"""
from pathlib import Path
import bpy, math, json
from mathutils import Vector, Quaternion
ROOT = Path.home() / '.local/share/ignition-assets/blood-angel'
source = bpy.data.scenes['03 · BLOOD ANGEL — PURCHASED']
if bpy.data.scenes.get('Blood Angel Rigged'):
    raise RuntimeError('Rigged scene already exists; run in a fresh Blender process.')
scene = bpy.data.scenes.new('Blood Angel Rigged')
scene.world = source.world
bpy.context.window.scene = scene
objects = {}
for original in source.objects:
    obj = original.copy()
    if original.data: obj.data = original.data.copy()
    scene.collection.objects.link(obj)
    objects[original.name.split('.')[0]] = obj
    if original == source.camera: scene.camera = obj
meshes = {n:o for n,o in objects.items() if o.type == 'MESH' and n != 'BA Studio Floor'}
def center(name):
    o=meshes[name]
    return sum((o.matrix_world@Vector(c) for c in o.bound_box), Vector()) / 8

arm = bpy.data.armatures.new('Blood Angel Skeleton')
rig = bpy.data.objects.new('Blood Angel Rig', arm)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True)
rig.show_in_front=True;arm.display_type='OCTAHEDRAL'
bpy.ops.object.mode_set(mode='EDIT')
def bone(name, head, tail, parent=None):
    b=arm.edit_bones.new(name);b.head=head;b.tail=tail
    if parent: b.parent=arm.edit_bones[parent]
    return b
bone('Root',(0,0,0),(0,0,.25))
bone('Pelvis',(0,0,1.26),(0,0,1.49),'Root')
bone('Spine',(0,0,1.49),(0,0,1.72),'Pelvis')
bone('Chest',(0,0,1.72),(0,0,2.06),'Spine')
bone('Head',(0,0,2.06),(0,0,2.39),'Chest')
for side,sign in [('L',1),('R',-1)]:
    shoulder=(sign*.43,.04,1.94);elbow=(sign*.52,.06,1.61);wrist=(sign*.58,-.2,1.43)
    bone('Clavicle.'+side,(sign*.17,.04,1.96),shoulder,'Chest')
    bone('UpperArm.'+side,shoulder,elbow,'Clavicle.'+side)
    bone('Forearm.'+side,elbow,wrist,'UpperArm.'+side)
    bone('Hand.'+side,wrist,center('Palm_'+side),'Forearm.'+side)
    bone('Pauldron.'+side,shoulder,(sign*.7,.04,1.98),'Clavicle.'+side)
    bone('Thigh.'+side,(sign*.21,.04,1.27),(sign*.29,.045,.84),'Pelvis')
    bone('Shin.'+side,(sign*.29,.045,.84),(sign*.37,.08,.2),'Thigh.'+side)
    bone('Foot.'+side,(sign*.37,.08,.2),(sign*.37,-.13,.11),'Shin.'+side)
    bone('Toe.'+side,(sign*.37,-.13,.11),(sign*.37,-.28,.08),'Foot.'+side)
    bone('Fauld.'+side,(sign*.33,0,1.42),(sign*.33,0,1.18),'Pelvis')
    for finger in ['Thumb','Index','Middle','Ring','Pinky']:
        names=[finger+'_'+part+'_'+side for part in ['Top','Mid','Tip']]
        cs=[center(n) for n in names]
        joints=[cs[0]+(cs[0]-cs[1])*.5,(cs[0]+cs[1])*.5,(cs[1]+cs[2])*.5,cs[2]+(cs[2]-cs[1])*.5]
        parent='Hand.'+side
        for i in range(3):
            name=f'{finger}.{i+1:02d}.{side}'
            bone(name,joints[i],joints[i+1],parent);parent=name
bpy.ops.object.mode_set(mode='OBJECT')

def binding(name):
    side=name[-1] if name.endswith(('_L','_R')) else None
    if name.startswith('Boots_Lower_Front'): return 'Toe.'+side
    if name.startswith('Boots_'): return 'Foot.'+side
    if name.startswith('Lower_Leg'): return 'Shin.'+side
    if name.startswith('Hip_'): return 'Thigh.'+side
    if name.startswith('Arms_'): return 'Forearm.'+side
    if name.startswith('Biceps'): return 'UpperArm.'+side
    if name.startswith('Elbow'): return 'Forearm.'+side
    if name.startswith(('Palm','OverPalm')): return 'Hand.'+side
    for finger in ['Thumb','Index','Middle','Ring','Pinky']:
        if name.startswith(finger+'_'):
            segment={'Top':'01','Mid':'02','Tip':'03'}[name.split('_')[1]]
            return f'{finger}.{segment}.{side}'
    # Vendor pauldron names are opposite to the limb names; use observed positions.
    if name.startswith('Pouldron'): return 'Pauldron.L' if center(name).x>0 else 'Pauldron.R'
    if name=='Tilting_Shield': return 'Pauldron.L'
    if name=='Head_Armor': return 'Head'
    if name in ['PowerPack','BA_Halo','Cuirass','Plackart_Top']: return 'Chest'
    if name=='Plackart__Mid': return 'Spine'
    if name.startswith('Fauld_'): return 'Fauld.'+side
    if name in ['Holster_Strap','Holster','Bolt_Pistol','Magazine','Mag_Release','Puirity_Seal_Wax']: return 'Fauld.R'
    if name in ['Cullet','Codpiece','Belt_Buckles','Belt']: return 'Pelvis'
    raise RuntimeError('Unbound mesh: '+name)

bindings={}
for name,obj in meshes.items():
    group_name=binding(name);bindings[name]=group_name
    # One influence per rigid armour part prevents rubber-like plate deformation.
    group=obj.vertex_groups.new(name=group_name)
    group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    modifier=obj.modifiers.new('Blood Angel Skin','ARMATURE');modifier.object=rig
    world=obj.matrix_world.copy();obj.parent=rig;obj.matrix_world=world

# FK diagnostic poses: the production combat clips are a separate task.
def reset_pose():
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0)
def rotate(name, axis, degrees):
    p=rig.pose.bones[name];rest=p.bone.matrix_local.to_quaternion()
    p.rotation_quaternion=rest.inverted() @ Quaternion(Vector(axis),math.radians(degrees)) @ rest

def pose(kind):
    reset_pose()
    if kind in ('Guard','Strike'):
        for side,sign in [('L',1),('R',-1)]:
            rotate('UpperArm.'+side,(1,0,0),-28 if kind=='Guard' else (-65 if side=='R' else -20))
            rotate('Forearm.'+side,(1,0,0),-55 if kind=='Guard' else (-30 if side=='R' else -50))
            rotate('Pauldron.'+side,(0,1,0),sign*-12)
            for finger in ['Index','Middle','Ring','Pinky']:
                for i in range(1,4): rotate(f'{finger}.{i:02d}.{side}',(0,0,1),sign*18)
        if kind=='Strike': rotate('Chest',(0,0,1),-12)
    if kind=='Step':
        rotate('Thigh.L',(1,0,0),-18);rotate('Shin.L',(1,0,0),28)
        rotate('Thigh.R',(1,0,0),10);rotate('Foot.L',(1,0,0),-10)
        rotate('Fauld.L',(1,0,0),-18)
    bpy.context.view_layer.update()

# Verify binding at rest before authoring diagnostic keyframes.
reset_pose();bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
max_error=0
for name,obj in meshes.items():
    assert len(obj.vertex_groups)==1 and obj.vertex_groups[0].name==bindings[name]
    evaluated=obj.evaluated_get(deps)
    for i in range(0,len(obj.data.vertices),max(1,len(obj.data.vertices)//20)):
        max_error=max(max_error,(obj.matrix_world@obj.data.vertices[i].co-evaluated.matrix_world@evaluated.data.vertices[i].co).length)
assert max_error<1e-4, f'Rest pose changes geometry: {max_error}'

rig.animation_data_create()
for kind in ['Guard','Strike','Step']:
    action=bpy.data.actions.new(kind+' Test');rig.animation_data.action=action
    for frame,state in [(1,'Rest'),(16,kind),(32,kind),(48,'Rest')]:
        pose(state)
        for p in rig.pose.bones: p.keyframe_insert('rotation_quaternion',frame=frame,group=p.name)
    action.use_fake_user=True
rig.animation_data.action=None;reset_pose()
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=1300;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'rig-guard.png')
scene.frame_start=1;scene.frame_end=48;scene.render.fps=24
scene.view_settings.view_transform='AgX'
# Select the skeleton for immediate pose editing when opening the file.
for o in scene.objects: o.select_set(False)
rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blood-angel-rigged.blend'))
report={'bones':len(arm.bones),'meshes':len(meshes),'bindings':bindings,'rest_pose_max_error':max_error,'actions':['Guard Test','Strike Test','Step Test'],'rig_type':'FK rigid armour, no automatic IK or soft undersuit'}
(ROOT/'rig-report.json').write_text(json.dumps(report,indent=2))
print('RIG_READY',len(arm.bones),'bones',len(meshes),'meshes','rest error',max_error)
