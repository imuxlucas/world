"""Replace only Link's candidate cupid with the user-supplied textured GLB."""
import bpy, sys, json, hashlib, shutil
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT
src=ROOT/'asset-sources/link/v003';pub=ROOT/'public/assets/link/v003'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
original=ROOT/'asset-sources/cupid/user-20260921/base_basic_pbr.glb'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v002/source.blend'))
bpy.context.preferences.filepaths.save_version=0
record=json.loads((ROOT/'public/assets/link/v002/parts.json').read_text())
cupid=bpy.data.objects['link_cupid']
for o in list(cupid.children_recursive):bpy.data.objects.remove(o,do_unlink=True)
for o in list(bpy.context.scene.objects):
    if o.name.startswith('Cupid cantilever'):bpy.data.objects.remove(o,do_unlink=True)
before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=str(original))
imported=[o for o in bpy.context.scene.objects if o not in before]
meshes=[o for o in imported if o.type=='MESH']
assert len(meshes)==1
model=meshes[0];model.name='User cupid with heart sunglasses'
model.parent=cupid
original_triangles=len(model.data.polygons)
# Weld UV-seam vertex duplicates without touching UV-loop coordinates, then simplify geometry.
bpy.ops.object.select_all(action='DESELECT');model.select_set(True);bpy.context.view_layer.objects.active=model
import bmesh
bm=bmesh.new();bm.from_mesh(model.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
bm.to_mesh(model.data);bm.free();model.data.update()
dec=model.modifiers.new('Web sculpture detail preservation','DECIMATE');dec.ratio=.12
dec.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.context.view_layer.update()
scale=.98/model.dimensions.x
model.scale=(scale,scale,scale)
bpy.context.view_layer.update()
box=[model.matrix_world@Vector(p) for p in model.bound_box]
lo=Vector(tuple(min(p[k] for p in box) for k in range(3)))
hi=Vector(tuple(max(p[k] for p in box) for k in range(3)))
center=(lo+hi)/2
target=Vector((0,-.58,2.585))
model.location+=target-center
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
for poly in model.data.polygons:poly.use_smooth=True
bpy.context.view_layer.update()
# Reuse the scene's existing white material for the new rear attachment only.
white=next(m for m in bpy.data.materials if m.name.startswith('Porcelain / cold white'))
b.M={'white':white}
spokes=bpy.data.objects['link_spokes']
ray_start=Vector((0,.20,2.64));direction=Vector((0,-1,0))
inverse=model.matrix_world.inverted()
hit,point,normal,index=model.ray_cast(inverse@ray_start,inverse.to_3x3()@direction)
assert hit,'A support ray must intersect the back of the imported sculpture'
contact=model.matrix_world@point
b.beam('User cupid rear load bracket',(0,-.05,2.75),tuple(contact+Vector((0,-.015,0))),.033,'white',spokes,24)
b.box('User cupid rear mounting pad',tuple(contact),(.16,.045,.11),'white',spokes,.015)
cupid['description']='用户提供的粉色心形眼镜丘比特；PBR 材质与羽翼保留，背部连接双轮毂横梁。'
for p in record['parts']:
    if p['id']=='link_cupid':p.update(name='双心丘比特',description=cupid['description'])
record.update(subtitle='双心连接摩天轮 · 用户丘比特 v003',modelUrl='/assets/link/v003/model.glb',thumbnailUrl='/assets/link/v003/thumbnail.png',source={'label':'可编辑 Blender · v003','path':'asset-sources/link/v003/source.blend'})
record['notes']=['丘比特由用户 ZIP 内的 base_basic_pbr.glb 导入；保留粉色眼镜、羽翼和原始 PBR 贴图。','原始百万面模型完整保留；网页模型为减面副本。','保留摩天轮 v002 结构和旧版源文件；静态装配已检查，完整轨迹运动净空尚未验证。']
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
# Preserve original source and all material slots; batch the manufactured structure separately.
b.ASSET_OBJECTS=[o for o in bpy.context.scene.objects if o!=model]
b.consolidate()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link')
assert all(o['nonFiniteCoordinates']==0 for o in geometry['objects'])
stats['bytes']=(pub/'model.glb').stat().st_size
record['stats']=stats
for folder in [src,pub,pub.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'geometry-report.json').write_text(json.dumps(geometry,indent=2))
box=[model.matrix_world@Vector(p) for p in model.bound_box]
lo=[min(p[k] for p in box) for k in range(3)];hi=[max(p[k] for p in box) for k in range(3)]
assert lo[0]>-.555 and hi[0]<.555,'Wings must stay within the gap between hubs'
evidence={'input':str(original.relative_to(ROOT)),'sha256':hashlib.sha256(original.read_bytes()).hexdigest(),'originalTriangles':original_triangles,'webTriangles':len(model.data.polygons),'position':list(model.location),'bounds':{'min':lo,'max':hi},'supportContact':list(contact),'supportRayHit':hit,'sourceMaterialsPreserved':True,'images':[{'name':im.name,'size':list(im.size),'packed':bool(im.packed_file)} for im in bpy.data.images if im.source=='FILE']}
(src/'cupid-integration.json').write_text(json.dumps(evidence,indent=2))
shutil.copy2(ROOT/'asset-sources/link/v002/route.json',src/'route.json')
shutil.copy2(src/'route.json',pub/'route.json')
b.render_preview('link',pub/'thumbnail.png')
shutil.copy2(pub/'thumbnail.png',pub.parent/'thumbnail.png')
print('USER_CUPID_INTEGRATED',json.dumps(evidence),flush=True)
