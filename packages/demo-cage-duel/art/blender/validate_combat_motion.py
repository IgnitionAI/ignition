import bpy,json
from mathutils import Vector
s=bpy.data.scenes['Blood Angel Rigged'];bpy.context.window.scene=s
r=next(o for o in s.objects if o.type=='ARMATURE')
results={}
for name in ['dodge_forward','dodge_backward','dodge_left','dodge_right','defeat']:
    a=bpy.data.actions[name];r.animation_data.action=a;r.animation_data.action_slot=a.slots[0]
    s.frame_set(1);bpy.context.view_layer.update();start=r.pose.bones['Root'].matrix.translation.copy()
    s.frame_set(13 if name.startswith('dodge') else 64);bpy.context.view_layer.update();delta=r.pose.bones['Root'].matrix.translation-start
    results[name]=list(delta)
    if name=='dodge_forward': assert delta.y<-.3 and abs(delta.z)<.2
    if name=='dodge_backward': assert delta.y>.3 and abs(delta.z)<.2
    if name=='dodge_left': assert delta.x>.3 and abs(delta.z)<.2
    if name=='dodge_right': assert delta.x<-.3 and abs(delta.z)<.2
    if name=='defeat': assert delta.z<-.4 and abs(delta.y)<.01
print('ROOT_VALIDATED',json.dumps(results))
