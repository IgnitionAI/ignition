"""Prepare Kaiser-E's CC-BY-4.0 sword, in Hand.R local coordinates.
Run through Blender MCP after importing the source into 'Chainsword preparation'.
Source geometry and images remain untouched; the output has no Blood Angel meshes.
"""
import bpy, json, hashlib, struct, shutil
from pathlib import Path
from mathutils import Vector, Matrix
ROOT = Path.home()/'.local/share/ignition-assets/blood-angel'
OUT = Path(__file__).resolve().parents[2]/'public/models'
SOURCE = Path.home()/'Downloads/wh-40k-chainsword.glb'
credit = 'Wh-40k-chainsword by Kaiser-E, CC BY 4.0. https://sketchfab.com/3d-models/wh-40k-chainsword-2976e3debf33494a831253b160f7d2c9 . Changes: scale, orientation, hand attachment, 2K textures.'
source = next(o for o in bpy.data.scenes['Chainsword preparation'].objects if o.type == 'MESH')
rig = next(o for o in bpy.data.scenes['Blood Angel Rigged'].objects if o.type == 'ARMATURE')
hand = rig.data.bones['Hand.R'].matrix_local.copy()
scene = bpy.data.scenes.new('Chainsword game export')
bpy.context.window.scene = scene
mesh = source.data.copy(); obj = bpy.data.objects.new('Kaiser-E chainsword', mesh); scene.collection.objects.link(obj)
# Source blade points -X, thickness is Y; map blade to character +Z and teeth toward -Y.
rotation = Matrix(((0,1,0),(0,0,-1),(-1,0,0)))
palm = Vector((-.615,-.335,1.37)); grip = Vector((8.5,0,.25)); scale = .105
for v in mesh.vertices:
    v.co = hand.inverted() @ (palm + rotation @ ((source.matrix_world @ v.co - grip)*scale))
mesh.update()
images = {}
for slot in obj.material_slots:
    slot.material = slot.material.copy()
    for node in slot.material.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            original = node.image
            if original.name not in images:
                copied = original.copy(); copied.name = 'Chainsword ' + original.name
                copied.scale(2048,2048); copied.pack(); images[original.name] = copied
            node.image = images[original.name]
obj['author'] = 'Kaiser-E'; obj['license'] = 'CC-BY-4.0'; obj['source'] = 'https://sketchfab.com/3d-models/wh-40k-chainsword-2976e3debf33494a831253b160f7d2c9'
obj['modifications'] = 'Scale, orientation, Hand.R local attachment, textures resized to 2K'
bpy.context.view_layer.objects.active = obj; obj.select_set(True)
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'chainsword-export.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False,export_extras=True,export_copyright=credit,export_image_format='JPEG',export_jpeg_quality=90)
with (ROOT/'chainsword-export.glb').open('rb') as stream:
    stream.read(12); size, _ = struct.unpack('<II', stream.read(8)); exported = json.loads(stream.read(size))
assert len(exported.get('meshes', [])) == 1 and not exported.get('skins')
assert len(exported['nodes']) == 1 and exported['nodes'][0]['name'].startswith('Kaiser-E chainsword')
shutil.copy2(ROOT/'chainsword-export.glb', OUT/'chainsword.glb')
bpy.data.libraries.write(str(ROOT/'chainsword-prepared.blend'),{scene},fake_user=True)
report={'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'source':str(SOURCE),'output_bytes':(OUT/'chainsword.glb').stat().st_size,'vertices':len(mesh.vertices),'triangles':sum(len(p.vertices)-2 for p in mesh.polygons),'source_grip':list(grip),'scale':scale,'hand_rest_matrix':[list(row) for row in hand],'credit':credit}
(ROOT/'chainsword-preparation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
