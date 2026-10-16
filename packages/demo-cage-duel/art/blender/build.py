"""Reproduce assets in a fresh Blender process: blender -b --factory-startup -P build.py.
Interactive reruns fail early rather than overwrite an existing authored scene.
"""
import bpy
from pathlib import Path
folder=Path(__file__).resolve().parent
for name in ('01 · THE CAGE','02 · MARINE BASE'):
    if name in bpy.data.scenes:raise RuntimeError('Asset scene already exists: '+name+'. Rebuild in a fresh Blender process.')
namespace={'__file__':str(folder/'common.py')}
for filename in ('common.py','cage.py','marine.py','export.py'):
    path=folder/filename
    exec(compile(path.read_text(),str(path),'exec'),namespace)
# Convert the scene-only library to a normal project with an opening scene/UI.
# This runs only in the explicitly fresh build process, never the user's session.
project=namespace['ROOT']/'art/crucible-assets.blend'
bpy.ops.wm.open_mainfile(filepath=str(project))
bpy.context.window.scene=bpy.data.scenes['02 · MARINE BASE']
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=str(project))
