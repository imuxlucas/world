import bpy,sys,json
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
bpy.ops.wm.open_mainfile(filepath=str(b.ROOT/'asset-sources/link/v009/source.blend'))
bpy.context.view_layer.update();dep=bpy.context.evaluated_depsgraph_get()
report={}
for o in bpy.context.scene.objects:
 if o.type not in {'MESH','CURVE','FONT'}:continue
 e=o.evaluated_get(dep);pts=[e.matrix_world@Vector(p) for p in e.bound_box]
 report[o.name]={'parent':o.parent.name if o.parent else '', 'type':o.type,'pos':list(o.matrix_world.translation),'min':[min(p[k] for p in pts) for k in range(3)],'max':[max(p[k] for p in pts) for k in range(3)],'materials':[m.name for m in o.data.materials]}
(b.ROOT/'artifacts/link-v010-before.json').write_text(json.dumps(report,indent=2))
model=bpy.data.objects['User cupid with heart sunglasses']
for o in bpy.context.scene.objects:o.hide_render=o!=model
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.72,.72,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
scene.view_settings.view_transform='Standard'
bpy.ops.object.light_add(type='AREA',location=(-2,-3,5));bpy.context.object.data.energy=300;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=3
bpy.ops.object.camera_add(location=(0,-5,2.94));cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=1.08
for name,pos in [('front',(0,-5,2.94)),('side',(4,-.1,2.94)),('front-top',(0,-5,4.7))]:
 cam.location=pos;cam.rotation_euler=(Vector((0,-.06,2.94))-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(b.ROOT/f'artifacts/link-v010-cupid-{name}.png');bpy.ops.render.render(write_still=True)
print('PROBE_DONE',len(report),flush=True)
