"""Export a private, static inspection GLB from blood-angel-prepared.blend.
UDIM tiles become ordinary materials; original meshes/images are not mutated.
"""
from pathlib import Path
import bpy, math, json, struct
ROOT = Path.home() / '.local/share/ignition-assets/blood-angel'
source = bpy.data.scenes['03 · BLOOD ANGEL — PURCHASED']
scene = bpy.data.scenes.new('Blood Angel Export')
bpy.context.window.scene = scene
materials, images = {}, {}

def tile_material(src, tile):
    key=(src.name,tile)
    if key in materials: return materials[key]
    mat=src.copy();mat.name=src.name+' tile '+str(tile)
    for node in mat.node_tree.nodes:
        if node.type!='TEX_IMAGE' or not node.image: continue
        original=node.image
        path=original.filepath.replace('<UDIM>',str(tile))
        k=(path,original.colorspace_settings.name)
        if k not in images:
            image=bpy.data.images.load(path,check_existing=False)
            image.colorspace_settings.name=original.colorspace_settings.name
            if max(image.size)>2048: image.scale(2048,2048)
            image.pack()
            images[k]=image
        node.image=images[k]
    materials[key]=mat
    return mat

for src in source.objects:
    if src.type!='MESH' or src.name=='BA Studio Floor': continue
    obj=src.copy();obj.data=src.data.copy();scene.collection.objects.link(obj)
    uv=obj.data.uv_layers.active.data
    original=src.data.materials[0]
    tiled=any(n.type=='TEX_IMAGE' and n.image and n.image.source=='TILED' for n in original.node_tree.nodes)
    tiles={}
    obj.data.materials.clear()
    for poly in obj.data.polygons:
        offset=math.floor(sum(uv[i].uv.x for i in poly.loop_indices)/len(poly.loop_indices)+1e-6) if tiled else 0
        if offset not in tiles:
            tiles[offset]=len(tiles)
            obj.data.materials.append(tile_material(original,1001+offset))
        poly.material_index=tiles[offset]
        if tiled:
            for i in poly.loop_indices: uv[i].uv.x-=offset
    obj.select_set(True)

out=ROOT/'blood-angel-inspection.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,use_active_scene=True,export_image_format='JPEG',export_jpeg_quality=90,export_animations=False,export_cameras=False,export_lights=False,export_extras=False)
blob=out.read_bytes()
size=struct.unpack_from('<I',blob,12)[0]
gltf=json.loads(blob[20:20+size])
assert len(gltf['scenes']) == 1, 'Export contains unrelated scenes'
assert not gltf.get('skins') and not gltf.get('animations'), 'Inspection export must stay static'
assert not any(n.get('name') == 'BA Studio Floor' for n in gltf['nodes']), 'Studio leaked into asset'
report={'mesh_objects':len(scene.objects),'vertices':sum(len(o.data.vertices) for o in scene.objects),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in scene.objects),'materials':len(materials),'images':len(images),'rigged':False,'purpose':'static inspection, not combat-ready','bytes':out.stat().st_size}
(ROOT/'inspection-report.json').write_text(json.dumps(report,indent=2))
print(report)
