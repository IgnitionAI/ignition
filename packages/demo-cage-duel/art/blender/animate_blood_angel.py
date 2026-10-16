"""Author an editable first combat animation pack on the private Blood Angel FK rig.
This is hand-authored blocking, not motion capture or completed combat gameplay.
Run in a fresh Blender process with blood-angel-rigged.blend.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Quaternion
ROOT = Path.home()/'.local/share/ignition-assets/blood-angel'
scene=bpy.data.scenes['Blood Angel Rigged'];bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE')
rig.animation_data_clear()
for action in list(bpy.data.actions): bpy.data.actions.remove(action)
scene.render.fps=30

def material(name,color,metal=.7,rough=.4):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    n=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    n.inputs['Base Color'].default_value=(*color,1);n.inputs['Metallic'].default_value=metal;n.inputs['Roughness'].default_value=rough
    return m
steel=material('Axe dark steel',(.065,.075,.085))
edge=material('Axe cutting teeth',(.42,.44,.43),.9,.27)
red=material('Axe red enamel',(.26,.018,.012),.65,.33)
grip=material('Joint rubber',(.017,.021,.025),.1,.7)
gold=material('Axe brass fittings',(.34,.19,.055))

def attach(obj,name,mat,bone):
    obj.name=name;obj.data.materials.append(mat)
    if not obj.data.uv_layers: obj.data.uv_layers.new()
    group=obj.vertex_groups.new(name=bone);group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Rigid attachment','ARMATURE');mod.object=rig
    world=obj.matrix_world.copy();obj.parent=rig;obj.matrix_world=world
    return obj

def box(name,loc,size,mat,bone='Hand.R',bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Machined edges','BEVEL');mod.width=bevel;mod.segments=2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return attach(o,name,mat,bone)

def cylinder(name,loc,radius,depth,mat,bone='Hand.R'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=radius,depth=depth,location=loc)
    return attach(bpy.context.object,name,mat,bone)

# Compact single-handed chain axe; handle passes through the right palm.
x,y=-.615,-.335
cylinder('Chainaxe haft',(x,y,1.43),.033,.77,steel)
cylinder('Chainaxe grip',(x,y,1.37),.043,.21,grip)
for i in range(7): cylinder('Grip ring %02d'%i,(x,y,1.28+i*.029),.046,.01,gold if i in(0,6) else steel)
cylinder('Chainaxe pommel',(x,y,1.065),.061,.08,gold)
box('Chainaxe engine',(x,y,1.73),(.16,.18,.24),steel)
box('Chainaxe red casing',(x,y-.105,1.77),(.13,.035,.18),red)
# Blade extends forward from the haft; layered steel and red body.
def blade(name, thickness, mat, inset=1):
    outline=[(.055,.10),(-.20,.19),(-.40,.14),(-.49,.025),(-.49,-.14),(-.35,-.21),(-.24,-.065),(.055,-.065)]
    verts=[(x+sx*thickness,y+oy*inset,1.88+oz*inset) for sx in [-1,1] for oy,oz in outline]
    n=len(outline);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj)
    attach(obj,name,mat,'Hand.R')
blade('Chainaxe crescent chassis',.06,steel)
blade('Chainaxe crescent enamel',.067,red,.86)
for i in range(11):
    t=i/10;z=1.73+t*.30
    tooth=box('Chainaxe tooth %02d'%i,(x,y-.505+.055*abs(t-.5)*2,z),(.15,.057,.021),edge,bevel=.003)
for i in range(3): box('Chainaxe vent %02d'%i,(x-.085,y-.075,1.70+i*.036),(.025,.1,.012),grip,bevel=.002)
# Conceal exposed mechanical joints with dark flexible sockets.
for side,sign in [('L',1),('R',-1)]:
    for label,loc,scale,bone in [
        ('shoulder',(sign*.43,.04,1.94),(.13,.13,.14),'Clavicle.'+side),
        ('elbow',(sign*.52,.06,1.61),(.09,.10,.11),'Forearm.'+side),
        ('knee',(sign*.29,.045,.84),(.10,.105,.11),'Shin.'+side)]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=loc)
        o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        attach(o,'Flexible '+label+'.'+side,grip,bone)

# Rotations are specified in character-space axes and converted into bone-local space.
def rotate(name,angles):
    p=rig.pose.bones[name];rest=p.bone.matrix_local.to_quaternion()
    q=Quaternion((1,0,0),math.radians(angles[0]))@Quaternion((0,1,0),math.radians(angles[1]))@Quaternion((0,0,1),math.radians(angles[2]))
    p.rotation_quaternion=rest.inverted()@q@rest

def stance(direction='top'):
    values={'Pelvis':(0,0,-4),'Chest':(3,0,8),'Head':(0,0,-4),
        'UpperArm.R':(-12,-8,-6),'Forearm.R':(-30,0,0),
        'UpperArm.L':(-15,8,8),'Forearm.L':(-55,0,0),
        'Pauldron.R':(0,10,0),'Pauldron.L':(0,-10,0),
        'Thigh.L':(-4,0,0),'Shin.L':(5,0,0),'Thigh.R':(3,0,0),'Shin.R':(3,0,0)}
    if direction=='left': values.update({'Chest':(0,0,18),'UpperArm.R':(-35,-15,25),'Forearm.R':(-45,0,0)})
    if direction=='right': values.update({'Chest':(0,0,-15),'UpperArm.R':(-25,-15,-20),'Forearm.R':(-35,0,0)})
    if direction=='bottom': values.update({'UpperArm.R':(5,-10,5),'Forearm.R':(-15,0,0),'Chest':(7,0,3)})
    return values

def apply(values,bob=0):
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION';p.rotation_quaternion=(1,0,0,0);p.location=(0,0,0);p.scale=(1,1,1)
    for n,v in values.items(): rotate(n,v)
    # Fingers curl around palm/haft using each finger's geometric bending plane.
    for side in ['L','R']:
        hand=rig.data.bones['Hand.'+side].tail_local
        for finger in ['Index','Middle','Ring','Pinky']:
            b=rig.data.bones[f'{finger}.01.{side}'];axis=(b.tail_local-b.head_local).cross(hand-b.head_local)
            if axis.length<.00001: continue
            axis.normalize()
            for i,deg in enumerate([35,65,45],1):
                p=rig.pose.bones[f'{finger}.{i:02d}.{side}'];r=p.bone.matrix_local.to_quaternion()
                p.rotation_quaternion=r.inverted()@Quaternion(axis,math.radians(deg))@r
        rotate('Thumb.01.'+side,(0,0,25 if side=='L' else -25))
    rig.pose.bones['Root'].location=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@Vector((0,0,bob))

catalog=[]
def clip(name,label,category,duration,frames,loop=False):
    action=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=action
    end=round(duration*30)+1
    for fraction,values,bob in frames:
        apply(values,bob)
        if name.startswith('dodge_'):
            distance=math.sin(fraction*math.pi)*.65
            direction=name.split('_')[1]
            offset=Vector((distance*(1 if direction=='left' else -1 if direction=='right' else 0),distance*(-1 if direction=='forward' else 1 if direction=='backward' else 0),0))
            rig.pose.bones['Root'].location+=rig.data.bones['Root'].matrix_local.to_3x3().inverted()@offset
        for p in rig.pose.bones:
            p.keyframe_insert('rotation_quaternion',frame=1+round(fraction*(end-1)),group=p.name)
            p.keyframe_insert('location',frame=1+round(fraction*(end-1)),group=p.name)
    action.use_fake_user=True
    catalog.append(dict(name=name,label=label,category=category,loop=loop,duration=duration))

def merged(base,**values): return base|values
base=stance()
for d,label in [('top','Haute'),('left','Gauche'),('right','Droite'),('bottom','Basse')]:
    s=stance(d);clip('guard_'+d,'Garde · '+label,'Garde',2,[(0,s,0),(.5,s,.007),(1,s,0)],True)
for d,label in [('forward','Avant'),('backward','Arrière'),('left','Gauche'),('right','Droite')]:
    frames=[]
    for i in range(9):
        t=i/8;v=base.copy();wave=math.sin(t*math.tau);sign=-1 if d=='backward' else 1
        if d in ['forward','backward']:
            v.update({'Thigh.L':(-wave*13*sign,0,0),'Thigh.R':(wave*13*sign,0,0),
                'Shin.L':(max(0,wave)*20,0,0),'Shin.R':(max(0,-wave)*20,0,0),
                'Foot.L':(-max(0,wave)*8,0,0),'Foot.R':(-max(0,-wave)*8,0,0)})
        else:
            sign=1 if d=='left' else -1
            v.update({'Thigh.L':(0,wave*9*sign,0),'Thigh.R':(0,-wave*9*sign,0),
                'Shin.L':(max(0,wave)*10,0,0),'Shin.R':(max(0,-wave)*10,0,0)})
        frames.append((t,v,-abs(wave)*.012))
    clip('move_'+d,'Déplacement · '+label,'Déplacements',1.3,frames,True)

# Named key poses for readable attack arcs. No game hit window is implied by these clips.
wind={'left':{'Chest':(-3,0,35),'UpperArm.R':(-30,-18,45),'Forearm.R':(-55,0,0)},
      'right':{'Chest':(-3,0,-32),'UpperArm.R':(-25,-35,-30),'Forearm.R':(-40,0,0)},
      'top':{'Chest':(-7,0,-8),'UpperArm.R':(-100,-20,-12),'Forearm.R':(-40,0,0)},
      'bottom':{'Chest':(12,0,15),'UpperArm.R':(25,-12,0),'Forearm.R':(-10,0,0)}}
strike={'left':{'Chest':(8,0,-28),'UpperArm.R':(-40,-25,-30),'Forearm.R':(-12,0,0)},
        'right':{'Chest':(8,0,30),'UpperArm.R':(-45,-10,38),'Forearm.R':(-12,0,0)},
        'top':{'Chest':(16,0,10),'UpperArm.R':(-25,-10,12),'Forearm.R':(-8,0,0)},
        'bottom':{'Chest':(-6,0,-15),'UpperArm.R':(-90,-18,0),'Forearm.R':(-25,0,0)}}
labels={'left':'Gauche','right':'Droite','top':'Descendante','bottom':'Montante'}
for d in wind:
    for kind,label,duration in [('light','Légère',1.05),('heavy','Lourde',1.8)]:
        w=base|wind[d];hit=base|strike[d]
        if kind=='heavy':
            w['Pelvis']=(0,0,-12);hit['Pelvis']=(5,0,12);w['Thigh.L']=(-10,0,0);hit['Thigh.R']=(-8,0,0)
        clip(kind+'_'+d,label+' · '+labels[d],'Attaques',duration,[(0,base,0),(.35,w,-.025),(.48,w,-.025),(.62,hit,-.045),(.78,hit,-.025),(1,base,0)])
    clip('feint_'+d,'Feinte · '+labels[d],'Feintes',1,[(0,base,0),(.4,base|wind[d],-.02),(.65,base|wind[d],-.02),(1,base,0)])
for d in labels:
    s=stance(d);recoil=s|{'Chest':(-9,0,0),'Forearm.L':(-70,0,0)}
    clip('block_'+d,'Blocage · '+labels[d],'Défense',.9,[(0,s,0),(.35,s,0),(.48,recoil,-.02),(1,s,0)])
    deflect=s|{'Chest':(0,0,-22),'UpperArm.R':(-55,-25,-20),'Forearm.R':(-25,0,0)}
    clip('parry_'+d,'Parade · '+labels[d],'Défense',1,[(0,s,0),(.3,s,0),(.48,deflect,-.02),(.7,deflect,0),(1,s,0)])
for d,label in [('forward','Avant'),('backward','Arrière'),('left','Gauche'),('right','Droite')]:
    v=base.copy();v['Chest']=(12 if d=='forward' else -10 if d=='backward' else 0,12 if d=='left' else -12 if d=='right' else 0,0)
    v['Thigh.L']=(-18,0,0);v['Shin.L']=(24,0,0);v['Thigh.R']=(14,0,0)
    clip('dodge_'+d,'Esquive · '+label,'Esquives',.85,[(0,base,0),(.25,v,-.09),(.6,v,-.09),(1,base,0)])
punch=base|{'Chest':(6,0,-25),'UpperArm.L':(-80,8,0),'Forearm.L':(-5,0,0)}
clip('punch','Coup de poing','Attaques',1,[(0,base,0),(.28,base|{'Chest':(0,0,18)},0),(.43,punch,-.02),(.58,punch,-.02),(1,base,0)])
for name,label,values in [
    ('hit_light','Impact léger',{'Chest':(-12,0,12),'Head':(-10,0,-10)}),
    ('hit_heavy','Impact lourd',{'Chest':(-22,0,18),'Head':(-15,0,0),'Thigh.R':(-15,0,0)}),
    ('stagger','Déséquilibre après parade',{'Chest':(20,0,12),'UpperArm.R':(15,-25,-25)}),
    ('guard_break','Garde ouverte par le poing',{'Chest':(-15,0,0),'UpperArm.L':(-15,30,15),'UpperArm.R':(-15,-30,-15)}),
    ('exhausted','Épuisement',{'Chest':(14,0,0),'Head':(14,0,0),'UpperArm.R':(10,0,0),'Forearm.R':(-10,0,0)})]:
    pose=base|values
    clip(name,label,'Réactions',1.6,[(0,base,0),(.3,pose,-.04),(.65,pose,-.04),(1,base,0)],name=='exhausted')
# Three authored chain previews; gameplay cancellation/defence is not simulated here.
for name,label,sequence in [
    ('combo_lights','Trois légères',[('left',False),('right',False),('top',False)]),
    ('combo_finisher','Deux légères → lourde',[('left',False),('right',False),('top',True)]),
    ('combo_mixed','Lourde → légère → lourde',[('bottom',True),('left',False),('top',True)])]:
    frames=[]
    for i,(d,heavy) in enumerate(sequence):
        w=base|wind[d];hit=base|strike[d]
        if heavy: w['Pelvis']=(0,0,-12);hit['Pelvis']=(5,0,12)
        frames.extend([((i+0)/3,base,0),((i+.35)/3,w,-.025),((i+.58)/3,hit,-.04),((i+.82)/3,hit,-.02),((i+1)/3,base,0)])
    clip(name,label,'Enchaînements',4.2,frames)
# Defeat is a kneeling collapse, keeping the first pack clear of sprawling cage collisions.
kneel=base|{'Thigh.L':(-55,0,0),'Thigh.R':(-55,0,0),'Shin.L':(105,0,0),'Shin.R':(105,0,0),'Chest':(30,0,0),'Head':(25,0,0)}
clip('defeat','Défaite · à genoux','Réactions',2.1,[(0,base,0),(.45,kneel,-.48),(1,kneel,-.48)])
rig.animation_data.action=None;apply(base);scene.frame_set(1)
scene.frame_start=1;scene.frame_end=64
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blood-angel-combat.blend'))
(ROOT/'combat-catalog.json').write_text(json.dumps(catalog,indent=2,ensure_ascii=False))
print('COMBAT_PACK',len(catalog),'clips',len([o for o in scene.objects if o.type=='MESH']),'meshes')
