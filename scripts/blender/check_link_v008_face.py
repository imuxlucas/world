import bpy,sys,json
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
root=b.ROOT;bpy.ops.wm.open_mainfile(filepath=str(root/'asset-sources/link/v008/source.blend'))
visible={'link_cupid','link_cupid_lenses','link_cupid_eyes'}
old=json.loads((root/'asset-sources/link/v007/clearance-check.json').read_text())
allpts=[]
for o in bpy.context.scene.objects:
    if o.type not in {'MESH','CURVE','FONT'}:continue
    o.hide_render=not(o.parent and o.parent.name in visible)
    if not o.hide_render:allpts.extend(o.matrix_world@Vector(p) for p in o.bound_box)
lo=[min(p[k] for p in allpts) for k in range(3)];hi=[max(p[k] for p in allpts) for k in range(3)]
original=old['cupidBounds'];contained=all(lo[k]>=original['min'][k]-1e-5 and hi[k]<=original['max'][k]+1e-5 for k in range(3))
print('EYE_ENVELOPE_CONTAINED',contained,lo,hi,flush=True)
old.update(v008EyeEnvelopeContained=contained,v008CombinedBounds={'min':lo,'max':hi},validation='V007 cabin sweep reused only when new face geometry stays within previous Cupid envelope; canopy geometry unchanged')
(root/'asset-sources/link/v008/clearance-check.json').write_text(json.dumps(old,indent=2))
assert contained,'New eye geometry must remain inside the validated sculpture envelope'
if '--no-render' in sys.argv:sys.exit(0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=700;scene.render.resolution_y=700;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.9,.93,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
target=Vector((0,-.1,3.04))
bpy.ops.object.camera_add(location=(0,-5,3.04));cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=.52;scene.camera=cam
for pos,power in [((1,-3,5),350),((-2,-1,3),200)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=3;o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/'artifacts/link-v008-face-inspection.png');bpy.ops.render.render(write_still=True)
