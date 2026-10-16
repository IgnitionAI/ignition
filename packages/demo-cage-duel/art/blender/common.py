"""Shared modelling helpers. Execute in Blender, not system Python."""
import bpy, bmesh, math, random
from mathutils import Vector
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
random.seed(41)

def material(name, color, metallic=0., rough=.45, emission=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'); bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metallic; bs.inputs['Roughness'].default_value=rough
    if emission:
        bs.inputs['Emission Color'].default_value=(*color,1); bs.inputs['Emission Strength'].default_value=emission
    return m

steel=material('Forged graphite steel',(.042,.065,.078),.83,.38)
iron=material('Black iron',(.012,.021,.025),.7,.5)
edge=material('Machined silver',(.28,.36,.39),.88,.3)
brass=material('Worn brass',(.42,.235,.075),.8,.36)
red=material('Oxblood ceramite',(.16,.008,.012),.48,.40)
cream=material('Ivory heraldry',(.66,.60,.43),.28,.42)
rubber=material('Flexible joint seals',(.009,.014,.017),.08,.63)
amber=material('Amber lamps',(1,.21,.028),.2,.3,5)
cyan=material('Cold lumen',(.08,.55,.8),.1,.25,6)
# Procedural microtexture is editable in .blend. GLBs retain constant PBR material values.
for m in (steel,iron,brass,red):
    nodes=m.node_tree.nodes; links=m.node_tree.links; bs=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    tex=nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value=145; tex.inputs['Detail'].default_value=2
    bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.12; bump.inputs['Distance'].default_value=.003
    links.new(tex.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],bs.inputs['Normal'])

def new_scene(name):
    s=bpy.data.scenes.new(name); bpy.context.window.scene=s
    s.world=bpy.data.worlds.new(name+' World'); s.world.use_nodes=True
    next(n for n in s.world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.025,.038,.055,1)
    next(n for n in s.world.node_tree.nodes if n.type=='BACKGROUND').inputs[1].default_value=.35
    s.render.engine='CYCLES'; s.cycles.samples=32; s.cycles.use_denoising=True
    s.render.resolution_x=1600; s.render.resolution_y=1100; s.render.resolution_percentage=100
    s.view_settings.view_transform='AgX'
    return s

def collection(name):
    c=bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c); return c

def place(o,name,mat=None,parent=None):
    o.name=name
    for c in list(o.users_collection): c.objects.unlink(o)
    current.objects.link(o)
    if mat and o.type=='MESH': o.data.materials.append(mat)
    if parent:
        bpy.context.view_layer.update(); world=o.matrix_world.copy(); o.parent=parent; o.matrix_world=world
    return o

def finish(o,bevel=0):
    if bevel:
        m=o.modifiers.new('Machined bevel','BEVEL'); m.width=bevel; m.segments=3
        m=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL'); m.keep_sharp=True; m.weight=40
    return o

def box(name,loc,size,mat=steel,bevel=.03,parent=None,rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if rot:o.rotation_euler=rot
    return finish(place(o,name,mat,parent),bevel)

def sphere(name,loc,scale,mat=steel,parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc)
    o=bpy.context.object; o.scale=scale
    for f in o.data.polygons:f.use_smooth=True
    return place(o,name,mat,parent)

def cylinder(name,loc,radius,depth,mat=steel,vertices=24,parent=None,rot=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    o=bpy.context.object
    if rot:o.rotation_euler=rot
    return finish(place(o,name,mat,parent),min(.018,radius*.12) if radius>=.05 else 0)

def beam(name,a,b,r,mat=steel,parent=None,vertices=8):
    a,b=Vector(a),Vector(b); o=cylinder(name,(a+b)/2,r,(b-a).length,mat,vertices,parent)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return o

def ring(name,loc,major,minor,mat=steel,rot=None,parent=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,location=loc,major_radius=major,minor_radius=minor)
    o=bpy.context.object
    if rot:o.rotation_euler=rot
    for f in o.data.polygons:f.use_smooth=True
    return place(o,name,mat,parent)

def mesh(name,verts,faces,mat=steel,bevel=.015,parent=None):
    d=bpy.data.meshes.new(name); d.from_pydata(verts,[],faces);d.update()
    bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
    o=bpy.data.objects.new(name,d);current.objects.link(o)
    if mat:d.materials.append(mat)
    if parent:o.parent=parent
    return finish(o,bevel)

def plate(name,outline,y,depth,mat,parent=None,bevel=.03):
    n=len(outline); verts=[(x,yy,z) for yy in (y-depth/2,y+depth/2) for x,z in outline]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    o=mesh(name,verts,faces,mat,bevel)
    if parent:
        bpy.context.view_layer.update(); world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world
    return o

def empty(name,loc=(0,0,0),parent=None):
    o=bpy.data.objects.new(name,None);current.objects.link(o);o.location=loc
    if parent:
        bpy.context.view_layer.update(); world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world
    return o

def text_obj(name,body,loc,size,mat,rot=(math.pi/2,0,0)):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.align_x='CENTER';d.extrude=.001
    o=bpy.data.objects.new(name,d);current.objects.link(o);o.location=loc;o.rotation_euler=rot;d.materials.append(mat);return o

def area(name,loc,power,color,size,target):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o

def camera(name,loc,target,lens=50):
    d=bpy.data.cameras.new(name);d.lens=lens;o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o)
    o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();bpy.context.scene.camera=o;return o
