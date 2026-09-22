"""Widen the deck around all eight feet and replace the centre flower with a mat."""
import bpy,bmesh,json,math,sys,shutil
from pathlib import Path
from mathutils import Matrix
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b

ROOT=b.ROOT;src=ROOT/'asset-sources/link/v012';pub=ROOT/'public/assets/link/v012'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v011/source.blend'))
bpy.context.preferences.filepaths.save_version=0
base=bpy.data.objects['link_base'];ornament=bpy.data.objects['link_ornament']
model=bpy.data.objects['User cupid with heart sunglasses']
OLD_RADIUS=1.97;RADIUS=2.22;RATIO=RADIUS/OLD_RADIUS;DECK_RADIUS=1.875*RATIO
MAT_RADIUS=.70;CHECK_RADIUS=.691;CELL=.175
fixed={o.name:tuple(v for row in o.matrix_world for v in row) for o in bpy.context.scene.objects if o.parent not in [base,ornament] and not o.name.startswith('Outer foot seating pad')}
removed=[]
for o in list(bpy.context.scene.objects):
 if o.name.startswith(('Deck central petal','Deck rosette centre','Outer foot seating pad')):
  removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
scale=Matrix.Diagonal((RATIO,RATIO,1,1))
for o in base.children:o.matrix_world=scale@o.matrix_world
for o in ornament.children:
 o.location.x*=RATIO;o.location.y*=RATIO
bpy.context.view_layer.update()

# The checker colours are real glTF materials, so source and web previews agree.
b.M={'mat_blue':b.material('V012 cornflower blue cotton',(.46,.66,.89),0,.84),'mat_white':b.material('V012 soft white cotton',(.97,.97,.985),0,.84)}
for m in b.M.values():
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=0;p.inputs['Sheen Weight'].default_value=.16
b.cyl('Circular checker mat binding',MAT_RADIUS,.012,(0,0,.341),'mat_blue',base,.004,192)

def clip(poly,axis,bound,greater):
 out=[]
 for a,c in zip(poly,poly[1:]+poly[:1]):
  inside_a=(a[axis]>=bound) if greater else (a[axis]<=bound)
  inside_c=(c[axis]>=bound) if greater else (c[axis]<=bound)
  if inside_a:out.append(a)
  if inside_a!=inside_c:
   t=(bound-a[axis])/(c[axis]-a[axis]);out.append(tuple(a[k]+t*(c[k]-a[k]) for k in range(2)))
 return out

circle=[(CHECK_RADIUS*math.cos(i*math.tau/256),CHECK_RADIUS*math.sin(i*math.tau/256)) for i in range(256)]
verts=[];faces=[];colors=[];angle=math.pi/4
for ix in range(-4,4):
 for iy in range(-4,4):
  poly=circle
  for axis,bound,greater in [(0,ix*CELL,True),(0,(ix+1)*CELL,False),(1,iy*CELL,True),(1,(iy+1)*CELL,False)]:
   if poly:poly=clip(poly,axis,bound,greater)
  if len(poly)<3:continue
  start=len(verts)
  verts.extend((x*math.cos(angle)-y*math.sin(angle),x*math.sin(angle)+y*math.cos(angle),.3472) for x,y in poly)
  faces.append(tuple(range(start,len(verts))));colors.append((ix+iy)%2)
mesh=bpy.data.meshes.new('Clipped circular checker grid');mesh.from_pydata(verts,[],faces);mesh.update()
o=bpy.data.objects.new('Circular blue white checker mat',mesh);bpy.context.collection.objects.link(o);o.parent=base
for m in b.M.values():mesh.materials.append(m)
for p,c in zip(mesh.polygons,colors):p.material_index=c
o['pattern']='Blue and soft-white square checks, clipped to a round mat';o['radius']=MAT_RADIUS;o['squareSize']=CELL

bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
def world_vertices(obj):
 e=obj.evaluated_get(deps);m=e.to_mesh();v=[e.matrix_world@p.co for p in m.vertices];e.to_mesh_clear();return v
feet=[]
for o in bpy.context.scene.objects:
 if o.name.startswith('Anchor lower flange'):
  radius=max(math.hypot(p.x,p.y) for p in world_vertices(o));margin=DECK_RADIUS-.016-radius
  feet.append({'name':o.name,'radialExtent':radius,'clearDeckMargin':margin})
assert len(feet)==8 and min(f['clearDeckMargin'] for f in feet)>.12
assert all(tuple(v for row in bpy.data.objects[name].matrix_world for v in row)==matrix for name,matrix in fixed.items())
route=json.loads((ROOT/'asset-sources/link/v011/route.json').read_text())
lowest_cabin=min(min(p.z for o in g.children_recursive if o.type in {'MESH','CURVE','FONT'} for p in world_vertices(o))-g['routeAnchor'][2] for g in bpy.data.objects['link_gondolas'].children)+min(p[2] for p in route['samples'])
base_top=max(p.z for o in base.children for p in world_vertices(o))
assert lowest_cabin-base_top>.4
report={'version':'v012','oldBaseRadius':OLD_RADIUS,'baseRadius':RADIUS,'deckRadius':DECK_RADIUS,'diameterIncreasePercent':(RATIO-1)*100,'feet':feet,'matRadius':MAT_RADIUS,'checkCell':CELL,'removed':removed,'wheelAndSupportTransformsUnchanged':True,'lowestMovingCabinZ':lowest_cabin,'baseTopZ':base_top,'verticalCabinClearance':lowest_cabin-base_top}
(src/'base-check.json').write_text(json.dumps(report,indent=2));print('BASE_CHECK',json.dumps(report),flush=True)
for folder in [src,pub]:shutil.copy2(ROOT/'asset-sources/link/v011/route.json',folder/'route.json')
record=json.loads((ROOT/'public/assets/link/v011/parts.json').read_text())
record.update(subtitle='双心连接摩天轮 · 加宽底座与蓝格地垫 v012',modelUrl='/assets/link/v012/model.glb',thumbnailUrl='/assets/link/v012/thumbnail.png',source={'label':'可编辑 Blender · v012','path':'asset-sources/link/v012/source.blend'})
record['notes']=['底座直径扩大约12.7%，八个柱脚全部落在平整盘面内，保留边缘余量。','中心花饰替换为圆形蓝白棋盘格地垫，外圈放射铺装和侧边心形装饰保留。']+record['notes']
for p in record['parts']:
 if p['id']=='link_base':p['description']='加宽瓷白底座完整包住八个柱脚，中央蓝白棋盘格圆垫，外圈保留粉蓝放射铺装。';base['description']=p['description']
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))

# Preserve the same semantic parts and independent animated gondola groups.
bpy.ops.object.select_all(action='DESELECT');objects=[o for o in bpy.context.scene.objects if o!=model and o.type in {'MESH','CURVE','FONT'}]
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH')
groups={}
for o in bpy.context.selected_objects:
 if o.type=='MESH':groups.setdefault((o.parent.name if o.parent else '',tuple(m.name for m in o.data.materials)),[]).append(o)
for key,group in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for o in group:o.select_set(True)
 bpy.context.view_layer.objects.active=group[0]
 if len(group)>1:bpy.ops.object.join()
 o=group[0];o.name=key[0]+'__'+key[1][0].split(' / ')[0].replace(' ','_')
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link');stats['bytes']=(pub/'model.glb').stat().st_size;record['stats']=stats
for folder in [src,pub]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'geometry-report.json').write_text(json.dumps(geometry,indent=2));print('EXPORTED_V012',stats,flush=True)
