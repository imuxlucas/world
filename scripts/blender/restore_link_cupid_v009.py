"""Restore only the pre-eye-edit Cupid, retaining all v008 structure and textures."""
import bpy,bmesh,sys,json,shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT;src=ROOT/'asset-sources/link/v009';pub=ROOT/'public/assets/link/v009'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v008/source.blend'))
bpy.context.preferences.filepaths.save_version=0
old=bpy.data.objects['User cupid with heart sunglasses'];transform=old.matrix_world.copy()
parent=bpy.data.objects['link_cupid']
removed=[]
for name in ['link_cupid_eyes','link_cupid_lenses']:
    group=bpy.data.objects.get(name)
    if group:
        for o in list(group.children_recursive):removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
        bpy.data.objects.remove(group,do_unlink=True)
bpy.data.objects.remove(old,do_unlink=True)
unchanged={o.name:(o.matrix_world.copy(),o.data if hasattr(o,'data') else None) for o in bpy.context.scene.objects}
with bpy.data.libraries.load(str(ROOT/'asset-sources/link/v007/source.blend'),link=False) as (source,dest):
    dest.objects=['User cupid with heart sunglasses']
model=dest.objects[0];bpy.context.collection.objects.link(model);model.parent=parent;model.matrix_world=transform
assert len(model.data.polygons)==120000
for name,(matrix,data) in unchanged.items():
    o=bpy.data.objects[name];assert o.matrix_world==matrix and o.data==data
assert not any(o.name in ['link_cupid_eyes','link_cupid_lenses'] for o in bpy.context.scene.objects)
record=json.loads((ROOT/'public/assets/link/v008/parts.json').read_text())
record['parts']=[p for p in record['parts'] if p['id'] not in ['link_cupid_eyes','link_cupid_lenses']]
record.update(subtitle='双心连接摩天轮 · 丘比特还原 v009',modelUrl='/assets/link/v009/model.glb',thumbnailUrl='/assets/link/v009/thumbnail.png',source={'label':'可编辑 Blender · v009','path':'asset-sources/link/v009/source.blend'})
record['notes']=['仅还原丘比特为 v007 原始粉色心形眼镜造型，撤销透明镜片和补建眼部。','保持丘比特当前位置、大小和细直横梁。','保留 v008 分片顶棚贴图、支架下接和前后落地连接杆删除。','v008 源文件和用户原始模型继续保留。']
(src/'restoration-check.json').write_text(json.dumps({'restoredFrom':'v007','restoredTriangles':len(model.data.polygons),'removedEyeObjects':removed,'otherObjectsUnchanged':len(unchanged),'transformPreserved':model.matrix_world==transform,'parts':len(record['parts'])},ensure_ascii=False,indent=2))
for folder in [src,pub]:shutil.copy2(ROOT/'asset-sources/link/v008/route.json',folder/'route.json')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
bpy.ops.object.select_all(action='DESELECT')
objects=[o for o in bpy.context.scene.objects if o!=model and o.type in {'MESH','CURVE','FONT'}]
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH')
groups={}
for o in bpy.context.selected_objects:
    if o.type=='MESH':groups.setdefault((o.parent.name if o.parent else '',o.data.materials[0].name if o.data.materials else ''),[]).append(o)
for key,group in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:o.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    if len(group)>1:bpy.ops.object.join()
    o=group[0];bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link');stats['bytes']=(pub/'model.glb').stat().st_size;record['stats']=stats
for folder in [src,pub,pub.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
b.M={'white':next(m for m in bpy.data.materials if m.name.startswith('Porcelain / cold white'))}
print('CUPID_RESTORED',stats,flush=True)
b.render_preview('link',pub/'thumbnail.png');shutil.copy2(pub/'thumbnail.png',pub.parent/'thumbnail.png')
