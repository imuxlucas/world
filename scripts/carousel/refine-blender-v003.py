"""Fuse sculpted horse body seams and preserve the seven-part editable asset."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/assets/carousel/v003'
SRC=ROOT/'asset-sources/carousel/v003'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT/'model.glb'))
horses=[]
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH' or not obj.data.materials:continue
    if not obj.data.materials[0].name.startswith('Porcelain horse body'):continue
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    # Union the intersecting sculpt pieces into a single continuous white surface.
    mod=obj.modifiers.new('Continuous porcelain anatomy','REMESH');mod.mode='VOXEL';mod.voxel_size=.010;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    smooth=obj.modifiers.new('Polished anatomy','SMOOTH');smooth.factor=.55;smooth.iterations=3
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    for face in obj.data.polygons:face.use_smooth=True
    horses.append(obj.name)
assert len(horses)==3, horses
parts=['base','column','canopy','horses','rods','frames','lights']
assert all(name in bpy.data.objects for name in parts)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
bad=sum(not all(math.isfinite(c) for c in v.co) for o in meshes for v in o.data.vertices)
assert bad==0
base=bpy.data.objects['base']
base_points=[o.matrix_world@v.co for o in base.children_recursive if o.type=='MESH' for v in o.data.vertices]
assert abs(min(p.z for p in base_points))<1e-5
bpy.ops.file.pack_all();SRC.mkdir(parents=True,exist_ok=True)
bpy.context.scene['revision']='carousel-v003: relief valance / pearl lights / sculpted head and separated legs'
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'source.blend'))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True)
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
materials={m.name for o in meshes for m in o.data.materials if m}
record=json.loads((OUT.parent/'parts.json').read_text())
record['description']='加高波浪花檐、独立蓝粉浮雕花饰、玫瑰金双轨、小珍珠和彩灯；木马重塑长鼻梁、额前鬃毛、大眼睛与成对抬腿姿态。'
record['notes']=['保留已确认圆盘和旋转木马底座、中心柱、拍立得等已有设计。','花檐花饰改为独立几何，避免环形贴图拉宽；上下金属轨道加深波浪并增加珍珠和彩灯。','木马头脸改为连续渐细鼻梁，补额前鬃毛、眼神高光和嘴线；前后腿分侧错位。','v002 模型和原贴图保留，v003 复用蓝粉贴图并更新几何。','照片窗口仍为蓝粉占位纸面。']
for part in record['parts']:
    if part['id']=='canopy':part['description']='加高波浪花檐、蓝粉浮雕花饰、玫瑰金双轨、珍珠节点和粉色旗帜。'
    if part['id']=='lights':part['description']='上下花檐共 128 颗粉蓝发光灯珠，另保留内部灯环。'
    if part['id']=='horses':part['description']='三匹白瓷木马：渐细鼻梁、大眼睛、额前鬃毛、嘴线和分侧错位抬腿。'
record['stats']={'meshes':len(meshes),'triangles':triangles,'materials':len(materials),'bytes':(OUT/'model.glb').stat().st_size}
for folder in [OUT,OUT.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
report={'fusedHorseBodies':horses,'semanticParts':parts,'nonFiniteVertices':bad,'minimumBaseZ':min(p.z for p in base_points),'stats':record['stats'],'limitations':['Decorative saddle and harness contact is intentional; this check is not an animation collision proof.']}
(SRC/'geometry-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
# Neutral studio views for inspection, separate from the exported asset.
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1000;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.82,.86,.94,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
for loc,power,size in [((4,-7,10),1300,6),((-5,-3,6),900,5),((3,4,8),1000,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,3))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO'
for name,loc,target,scale in [('thumbnail',(8,-12,8),(0,0,3.3),8.2),('horse-detail',(3,-5,2.5),(0,-.2,1.35),3.4),('canopy-detail',(5,-8,7.8),(0,0,5.8),5.0),('rear',(-8,12,7),(0,0,3.3),8.2)]:
    camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
print(json.dumps(report,ensure_ascii=False))
