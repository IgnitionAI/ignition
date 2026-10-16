"""Create a private faction variant; run in a fresh process on blood-angel-mixamo.blend.
Keep original files intact. Paint is applied by the game's PBR material adapter.
"""
import bpy, bmesh, json
from pathlib import Path
ROOT=Path.home()/'.local/share/ignition-assets/blood-angel'
scene=bpy.data.scenes['Blood Angel Rigged'];bpy.context.window.scene=scene
removed=[]
for obj in list(scene.objects):
    if obj.type=='MESH' and obj.name.startswith(('Chainaxe','Grip ring','BA_Halo','Tilting_Shield','Belt_Buckles')):
        removed.append(obj.name);bpy.data.objects.remove(obj,do_unlink=True)
cuirass=next(o for o in scene.objects if o.name.startswith('Cuirass'))
cuirass.data=cuirass.data.copy()
bm=bmesh.new();bm.from_mesh(cuirass.data)
seen=set();ornaments=[];components=0
for v in bm.verts:
    if v in seen:continue
    stack=[v];seen.add(v);group=[]
    while stack:
        current=stack.pop();group.append(current)
        for edge in current.link_edges:
            other=edge.other_vert(current)
            if other not in seen:seen.add(other);stack.append(other)
    # Source mesh coordinates are in cm. These disconnected front pieces are
    # the central tear, its rim and the feathered wings; the breastplate spans behind them.
    if max(v.co.y for v in group)<-17 and min(v.co.z for v in group)>176 and max(v.co.z for v in group)<198:
        ornaments.extend(group);components+=1
assert components==42, f'Unexpected source topology: {components} ornament components'
bmesh.ops.delete(bm,geom=ornaments,context='VERTS');bm.to_mesh(cuirass.data);bm.free()
cuirass.data.update()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'world-eater-mixamo.blend'))
(ROOT/'world-eater-preparation.json').write_text(json.dumps({'removed_objects':removed,'removed_chest_components':components,'removed_vertices':len(ornaments)},indent=2))
print('WORLD_EATER',components,len(ornaments),removed)
