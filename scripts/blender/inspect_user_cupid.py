import bpy,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'asset-sources/cupid/user-20260921/base_basic_pbr.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
report=[]
for o in objects:
    report.append({'name':o.name,'location':list(o.location),'rotation':list(o.rotation_euler),'dimensions':list(o.dimensions),'polygons':len(o.data.polygons),'materials':[m.name for m in o.data.materials]})
(ROOT/'asset-sources/cupid/user-20260921/inspection.json').write_text(json.dumps(report,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.use_nodes=True;bg=scene.world.node_tree.nodes.get('Background');bg.inputs[0].default_value=(.8,.85,.95,1);bg.inputs[1].default_value=.5
target=Vector((0,0,.8))
bpy.ops.object.camera_add(location=(0,-4,1.4));cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.25;scene.camera=cam
for pos,power,size in [((2,-3,4),400,3),((-3,-1,2),250,3),((1,3,3),500,2)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'artifacts/user-cupid-front.png');scene.view_settings.view_transform='AgX'
bpy.ops.render.render(write_still=True)
print(json.dumps(report))
