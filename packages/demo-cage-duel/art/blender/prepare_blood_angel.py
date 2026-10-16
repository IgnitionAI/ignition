"""Prepare the privately purchased FBX in Blender; no vendor files enter Git.
Run with the imported purchase scene active (see art/blood-angel.md).
"""
from pathlib import Path
import bpy, contextlib
from mathutils import Vector

ROOT = Path.home() / '.local/share/ignition-assets/blood-angel'
TEXTURES = ROOT / 'textures'
scene = bpy.data.scenes.get('03 · BLOOD ANGEL — PURCHASED')
if scene is None:
    scene = bpy.data.scenes.new('03 · BLOOD ANGEL — PURCHASED')
    bpy.context.window.scene = scene
    with (ROOT / 'fbx-import.log').open('w') as log, contextlib.redirect_stdout(log):
        bpy.ops.import_scene.fbx(filepath=str(ROOT / 'source/Blood_Angel.fbx'))
if any(o.name.startswith('BA Camera') for o in scene.objects):
    raise RuntimeError('Prepared scene already exists; rebuild in a fresh Blender process.')
bpy.context.window.scene = scene

def texture(prefix, channel):
    candidates = sorted(TEXTURES.glob(f'{prefix}_{channel}*.png'))
    if not candidates:
        raise RuntimeError(f'Missing texture: {prefix} {channel}')
    path = candidates[0]
    img = bpy.data.images.load(str(path), check_existing=True)
    if '.1001.' in path.name:
        img.source = 'TILED'
        img.filepath = str(path).replace('.1001.', '.<UDIM>.')
        for p in candidates[1:]:
            number = int(p.stem.split('.')[-1])
            if number not in [t.number for t in img.tiles]:
                img.tiles.new(number)
    if channel in ('Normal', 'ORM'):
        img.colorspace_settings.name = 'Non-Color'
    return img

materials = {}
def material(prefix):
    if prefix in materials:
        return materials[prefix]
    m = bpy.data.materials.new('BA · ' + prefix)
    m.use_nodes = True
    n, links = m.node_tree.nodes, m.node_tree.links
    bsdf = next(x for x in n if x.type == 'BSDF_PRINCIPLED')
    def node(channel, actual=None):
        t = n.new('ShaderNodeTexImage')
        t.image = texture(actual or prefix, channel)
        return t
    base = node('BaseColor')
    links.new(base.outputs['Color'], bsdf.inputs['Base Color'])
    orm = node('ORM', 'Head' if prefix == 'Helmet_Red' else None)
    separate = n.new('ShaderNodeSeparateColor')
    links.new(orm.outputs['Color'], separate.inputs['Color'])
    links.new(separate.outputs['Green'], bsdf.inputs['Roughness'])
    links.new(separate.outputs['Blue'], bsdf.inputs['Metallic'])
    normal = node('Normal', 'Head' if prefix == 'Helmet_Red' else None)
    nm = n.new('ShaderNodeNormalMap')
    links.new(normal.outputs['Color'], nm.inputs['Color'])
    links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    if prefix == 'Helmet_Red':
        emission = node('Emissive', 'Head')
        links.new(emission.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 2
    materials[prefix] = m
    return m

def family(name):
    if name.startswith(('Boots','Lower_Leg','Hip_')): return 'Legs'
    if name.startswith(('Arms','Biceps','Elbow','Palm','OverPalm','Index','Middle','Ring','Pinky','Thumb')): return 'Arms'
    if name.startswith('Head_Armor'): return 'Helmet_Red'
    if name.startswith('Pouldron'): return 'Pouldron'
    if name.startswith(('PowerPack','BA_Halo')): return 'PowerPack'
    if name == 'Cuirass': return 'Cuirass'
    if name.startswith(('Plackart','Fauld','Cullet','Codpiece','Belt','Holster_Strap')): return 'Abdomen'
    if name.startswith(('Holster','Magazine')): return 'Holster_Magazine'
    if name in ('Bolt_Pistol','Mag_Release'): return 'Bolt_Pistol'
    if name in ('Tilting_Shield','Puirity_Seal_Wax'): return 'BA_Accesories'
    raise RuntimeError('Unmapped mesh: ' + name)

for o in scene.objects:
    if o.type == 'MESH':
        o.data.materials.clear()
        o.data.materials.append(material(family(o.name)))
        for polygon in o.data.polygons:
            polygon.use_smooth = True

world = bpy.data.worlds.new('Blood Angel Studio')
world.use_nodes = True
next(x for x in world.node_tree.nodes if x.type == 'BACKGROUND').inputs[0].default_value = (.12,.16,.22,1)
next(x for x in world.node_tree.nodes if x.type == 'BACKGROUND').inputs[1].default_value = .3
scene.world = world

def area(name, pos, power, color, size):
    data = bpy.data.lights.new(name,'AREA'); data.energy=power; data.color=color; data.shape='DISK'; data.size=size
    o=bpy.data.objects.new(name,data); scene.collection.objects.link(o);o.location=pos
    o.rotation_euler=(Vector((0,0,1.5))-o.location).to_track_quat('-Z','Y').to_euler()
area('BA Key',(3,-4,4.5),550,(1,.84,.68),3)
area('BA Fill',(-3,-2,2.7),350,(.57,.74,1),2.5)
area('BA Rim',(1,2.5,4),800,(1,.4,.2),2)
camdata=bpy.data.cameras.new('BA Camera');cam=bpy.data.objects.new('BA Camera',camdata);scene.collection.objects.link(cam)
cam.location=(3.3,-6,2.8);cam.rotation_euler=(Vector((0,0,1.4))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.lens=68
scene.camera=cam
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.009))
floor=bpy.context.object;floor.name='BA Studio Floor'
mat=bpy.data.materials.new('BA Studio Graphite');mat.diffuse_color=(.025,.03,.038,1);mat.use_nodes=True
next(x for x in mat.node_tree.nodes if x.type == 'BSDF_PRINCIPLED').inputs['Roughness'].default_value=.5
next(x for x in mat.node_tree.nodes if x.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value=(.025,.03,.038,1)
floor.data.materials.append(mat)
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'blood-angel-preview.png')
scene.view_settings.view_transform='AgX'
bpy.data.libraries.write(str(ROOT/'blood-angel-prepared.blend'),{scene},path_remap='ABSOLUTE',fake_user=True,compress=True)
print('PREPARED',len(materials),'material families',ROOT/'blood-angel-prepared.blend')
