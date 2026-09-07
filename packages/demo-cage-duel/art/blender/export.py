"""Bake modifiers into temporary geometry; keep authored source editable."""
import json, bmesh

def export_collection(source_scene, source_collection, filename):
    bpy.context.window.scene=source_scene;bpy.context.view_layer.update()
    deps=bpy.context.evaluated_depsgraph_get()
    temp=bpy.data.scenes.new('Temporary GLB export')
    copies={}
    for original in source_collection.objects:
        if original.type not in ('MESH','FONT','EMPTY'):continue
        if original.type=='EMPTY':
            copy=bpy.data.objects.new(original.name,None)
        else:
            data=bpy.data.meshes.new_from_object(original.evaluated_get(deps),depsgraph=deps)
            bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
            copy=bpy.data.objects.new(original.name,data)
        temp.collection.objects.link(copy);copy.matrix_world=original.matrix_world.copy();copies[original]=copy
    bpy.context.window.scene=temp;bpy.context.view_layer.update()
    for original,copy in copies.items():
        if original.parent in copies:
            world=copy.matrix_world.copy();copy.parent=copies[original.parent];copy.matrix_world=world
    bpy.context.view_layer.update()
    # Merge static geometry per rigid pivot, preserving material slots.
    groups={}
    for o in list(temp.objects):
        if o.type=='MESH':groups.setdefault(o.parent,[]).append(o)
    for parent,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join();objects[0].name=(parent.name+' · surfaces') if parent else 'Cage · surfaces'
    path=ROOT/'public/models'/filename;path.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=False,use_active_scene=True,export_apply=False,export_animations=False,export_cameras=False,export_lights=False,export_yup=True)
    meshes=[o for o in temp.objects if o.type=='MESH']
    for o in meshes:o.data.calc_loop_triangles()
    report={'file':filename,'triangles':sum(len(o.data.loop_triangles) for o in meshes),'meshObjects':len(meshes),'bytes':path.stat().st_size}
    bpy.context.window.scene=source_scene
    # Remove only the temporary export scene and its owned copies.
    for o in list(temp.objects):
        data=o.data;bpy.data.objects.remove(o,do_unlink=True)
        if data and data.users==0:bpy.data.meshes.remove(data)
    bpy.data.scenes.remove(temp)
    return report

reports=[export_collection(cage_scene,cage_collection,'cage-blender.glb'),export_collection(marine_scene,marine_collection,'marine-base-blender.glb')]
(ROOT/'art/asset-report.json').write_text(json.dumps(reports,indent=2)+'\n')
bpy.context.window.scene=marine_scene
bpy.data.libraries.write(str(ROOT/'art/crucible-assets.blend'),{cage_scene,marine_scene},fake_user=True,compress=True)
print(json.dumps(reports,indent=2))
