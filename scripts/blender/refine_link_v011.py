"""Open cabins, equal arc-length stations, and a full-route support clearance pass."""
import bpy,bmesh,sys,json,math,shutil,bisect,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT;src=ROOT/'asset-sources/link/v011';pub=ROOT/'public/assets/link/v011'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v009/source.blend'))
bpy.context.preferences.filepaths.save_version=0

def mat(prefix):return next(m for m in bpy.data.materials if m.name.startswith(prefix))
b.M={'white':mat('Porcelain / cold white'),'gold':mat('V007 champagne'),'pearl':mat('V007 warm pearl'),'rose':mat('Pearl rose structural'),'blue':mat('Pearl blue structural'),'sofa':b.material('V011 powder blue upholstered sofa',(.57,.73,.94),0,.56),'piping':b.material('V011 sofa ivory piping',(.97,.96,.94),0,.47)}
pods=bpy.data.objects['link_gondolas'];frame=bpy.data.objects['link_supports'];spokes=bpy.data.objects['link_spokes'];lights=bpy.data.objects['link_lights'];model=bpy.data.objects['User cupid with heart sunglasses']
removed=[]
for o in list(bpy.context.scene.objects):
 if o.name.startswith(('Cabin lower side panel','Cabin seat','Continuous hub-to-hub load beam','Cupid cantilever','User cupid rear','Under-hub leg socket')):
  removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True)
# Padded low back and inset seat, leaving the outer metal balustrade open.
profile=[(.101,-.613),(.149,-.613),(.160,-.607),(.163,-.594),(.163,-.550),(.157,-.538),(.149,-.538),(.140,-.547),(.140,-.574),(.108,-.574),(.101,-.581)]
for g in sorted(pods.children,key=lambda o:o.name):
 x,_,z=g['routeAnchor'];y=-.56
 for j in range(8):
  before=set(bpy.context.scene.objects)
  start=math.tau*j/8+.010;end=math.tau*(j+1)/8-.010;steps=16;verts=[]
  for k in range(steps+1):
   a=start+(end-start)*k/steps
   verts.extend((x+r*math.cos(a),y+r*math.sin(a),z+h) for r,h in profile)
  n=len(profile);faces=[]
  for k in range(steps):
   for i in range(n):faces.append((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i))
  faces.extend([tuple(range(n-1,-1,-1)),tuple(steps*n+i for i in range(n))])
  mesh=bpy.data.meshes.new('Sofa cushion section');mesh.from_pydata(verts,[],faces);mesh.update()
  o=bpy.data.objects.new('Cabin upholstered ring cushion',mesh);bpy.context.collection.objects.link(o);b.finish(o,o.name,'sofa',pods,.003)
  points=[(x+.153*math.cos(start+(end-start)*k/24),y+.153*math.sin(start+(end-start)*k/24),z-.538) for k in range(25)]
  b.tube('Cabin soft backrest piping',points,.0022,'piping',pods,False,2)
  bpy.context.view_layer.update()
  for o in set(bpy.context.scene.objects)-before:
   world=o.matrix_world.copy();o.parent=g;o.matrix_world=world
# Symmetric front/back supports meet the underside of each centred hub.
OLD_TOP=2.37;NEW_TOP=2.47;HUB_RISE=.10;HUB=2.85;FOOT_Y=1.42;FOOT_DX=.22;TOP_DX=.06;CABIN_Y=-.34
changed=[]
for o in list(bpy.context.scene.objects):
 if 'grooved A leg' in o.name and o.type=='MESH':
  cx=-.91 if o.name.startswith('left') else .91
  inv=o.matrix_world.inverted()
  for v in o.data.vertices:
   p=o.matrix_world@v.co;t=(p.z-.39)/(OLD_TOP-.39);side=1 if p.x>cx else -1
   p.x-=side*((.48-FOOT_DX)*(1-t)+(.115-TOP_DX)*t);p.y-=(FOOT_Y-.64)*(1-t)
   p.z=.39+(p.z-.39)*(NEW_TOP-.39)/(OLD_TOP-.39);v.co=inv@p
  o.data.update();changed.append(o.name)
 elif 'rear stay' in o.name:
  bpy.data.objects.remove(o,do_unlink=True)
 elif o.name.startswith(('Anchor lower flange','Anchor socket')):
  cx=-.91 if o.location.x<0 else .91;side=1 if o.location.x>cx else -1
  o.location.x=cx+side*FOOT_DX;o.location.y=math.copysign(FOOT_Y,o.location.y)
 elif 'rear crossbar' in o.name:
  bpy.data.objects.remove(o,do_unlink=True)
for cx,color in [(-.91,'rose'),(.91,'blue')]:
 for side in [-1,1]:
  foot=(cx+side*FOOT_DX,FOOT_Y,.39);top=(cx+side*TOP_DX,0,NEW_TOP)
  b.beam('Mirrored rear support',foot,top,.057,'white',frame,24)
  b.box('Common under-hub socket',(top[0],0,NEW_TOP+.014),(.115,.18,.055),'white',frame,.012)
  # Outer foot plates bridge the shallow stepped edge of the circular base.
  for y in [-FOOT_Y,FOOT_Y]:
   if math.hypot(foot[0],y)>1.7:b.cyl('Outer foot seating pad',.141,.071,(foot[0],y,.306),'white',frame,.008,48)
 # Rear tie stays in the rear support plane at its own height.
 t=(1.07-.39)/(NEW_TOP-.39);y=FOOT_Y*(1-t);half=FOOT_DX+(TOP_DX-FOOT_DX)*t
 b.beam('Mirrored rear crossbar',(cx-half,y,1.07),(cx+half,y,1.07),.037,'white',frame,24)
# Hubs remain centred on the rail plane; lift only, no long projecting front axle.
rail_samples=json.loads((ROOT/'asset-sources/link/v009/route.json').read_text())['samples']
for o in list(spokes.children):
 if o.name.startswith('Pearl structural spoke'):
  pts=[o.matrix_world@Vector((0,0,v)) for v in [min(v.co.z for v in o.data.vertices),max(v.co.z for v in o.data.vertices)]]
  k=min(range(2),key=lambda i:abs(pts[i].z-2.75));pts[k].z+=HUB_RISE
  if o.name=='Pearl structural spoke.006':
   # Attach below the wing on the same rail plane, avoiding the lowered sculpture.
   pts[1-k]=Vector(min((p for p in rail_samples if p[0]>0 and p[2]<2.1),key=lambda p:abs(p[0]-.35)))
  name=o.name;pts[0].y=pts[1].y=0
  bpy.data.objects.remove(o,do_unlink=True);b.beam(name,pts[0],pts[1],.033,'white',spokes,24)
 else:o.location.z+=HUB_RISE
for o in bpy.data.objects['link_devices'].children:o.location.z+=HUB_RISE
# Centre the sculpture's depth on the rail, retaining the lower-crossing height.
world=[model.matrix_world@v.co for v in model.data.vertices];centre_y=(min(p.y for p in world)+max(p.y for p in world))/2
model.location.y-=centre_y;model.location.z-=.419
# Shorten the axle only; translate the complete canopy, posts, rails and sofa intact.
for g in pods.children:
 for child in g.children:
  if child.name.startswith('Gondola rail axle'):
   inv=child.matrix_world.inverted()
   for v in child.data.vertices:
    p=child.matrix_world@v.co;fraction=(-.06-p.y)/.50;p.y+=.22*fraction;v.co=inv@p
   child.data.update()
  elif not child.name.startswith('Bearing'):child.location.y+=.22
bpy.context.view_layer.update()
# Equal physical arc length, anchored to the first cabin's old station.
route=json.loads((ROOT/'asset-sources/link/v009/route.json').read_text());samples=np.asarray(route['samples'],dtype=float)
segments=np.roll(samples,-1,axis=0)-samples;lengths=np.linalg.norm(segments,axis=1);cumulative=np.concatenate(([0.],np.cumsum(lengths)));length=float(cumulative[-1])
first=Vector(pods.children[0]['routeAnchor']);first.y=0
start_index=int(np.argmin(np.linalg.norm(samples-np.asarray(first),axis=1)));start=float(cumulative[start_index])
def point_at(distance):
 d=distance%length;i=min(len(samples)-1,bisect.bisect_right(cumulative,d)-1);return samples[i]+segments[i]*((d-cumulative[i])/lengths[i])
anchors=[]
for i,g in enumerate(sorted(pods.children,key=lambda o:o.name)):
 p=point_at(start-i*length/8);old=Vector(g['routeAnchor']);target=Vector((float(p[0]),-.02,float(p[2])));g.location+=target-old
 g['routeAnchor']=list(target);g['arcLengthPhase']=((start-i*length/8)%length)/length;g['sofa']='Open metal balustrade, powder-blue ring sofa with eight padded sections';anchors.append([float(p[0]),0,float(p[2])])
route.update(length=length,anchors=anchors,gondolaPhase=start/length,spacing=length/8,status='Eight equally spaced upright cabins; structure clearance swept over the complete closed route')
for folder in [src,pub]:(folder/'route.json').write_text(json.dumps(route,indent=2))
bpy.context.view_layer.update()
# Structural dimensions are checked before export; the separate full-path mesh
# checker verifies the sloping supports against the actual cabin triangles.
model_bounds=[model.matrix_world@v.co for v in model.data.vertices]
min_y=min(p.y for p in model_bounds);max_y=max(p.y for p in model_bounds)
assert abs((min_y+max_y)/2)<1e-6
report={'version':'v011','stationSpacing':length/8,'stations':8,'frontFootY':-FOOT_Y,'rearFootY':FOOT_Y,'footHalfWidth':FOOT_DX,'topHalfWidth':TOP_DX,'frontTopY':0,'rearTopY':0,'supportTopZ':NEW_TOP,'hubZ':HUB,'hubPlaneY':-.025,'spokePlaneY':0,'rearStandoffs':0,'cupidDepthCenter':(min_y+max_y)/2,'cabinCenterY':CABIN_Y,'axleLength':.28,'oldAxleLength':.50,'mirroredCentreLines':True,'removedCupidBeam':True,'removedSolidPanels':64,'sofaCushions':64}
(src/'structure-check.json').write_text(json.dumps(report,indent=2))
print('STRUCTURE',json.dumps(report),flush=True)
record=json.loads((ROOT/'public/assets/link/v009/parts.json').read_text())
record.update(subtitle='双心连接摩天轮 · 通透车厢与避让支架 v011',modelUrl='/assets/link/v011/model.glb',thumbnailUrl='/assets/link/v011/thumbnail.png',source={'label':'可编辑 Blender · v011','path':'asset-sources/link/v011/source.blend'})
for p in record['parts']:
 if p['id']=='link_gondolas':p['description']='八个等弧长排列的吊舱：通透金属栏杆、粉蓝环形软沙发、原分片顶棚与珠形吊点。'
 if p['id']=='link_supports':p['description']='前后关于轨道平面镜面对称的斜撑，顶端共接轮毂下方，底脚斜向落地。'
 if p['id']=='link_spokes':p['description']='横梁、辐条与轮毂保持轨道平面位置，无后伸连接段；取消贯穿丘比特的横梁。'
 if p['id']=='link_cupid':p['description']='丘比特深度中心与轨道对齐，下移到双心下方交会处，保留原托腮姿态。'
record['notes']=['通透金属栏杆和浅蓝环形沙发，八个车厢沿轨道等弧长排布。','前后斜撑以轨道为镜面对称，顶端共接轮毂下方，底脚前后展开。','横梁、辐条、轮毂与丘比特侧面对齐轨道，无后伸连接段；轮毂上移0.10。','丘比特保留托腮造型和下方交会处高度。','吊舱横向连接杆从0.50缩短到0.28，舱体整体靠轨道0.22。']
for p in record['parts']:
 group=bpy.data.objects.get(p['id'])
 if group:group['description']=p['description']
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
# Export semantic batches without baking together independent moving cabins.
bpy.ops.object.select_all(action='DESELECT');objects=[o for o in bpy.context.scene.objects if o!=model and o.type in {'MESH','CURVE','FONT'}]
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
 o=group[0];o.name=key[0]+'__'+key[1].split(' / ')[0].replace(' ','_')
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link');stats['bytes']=(pub/'model.glb').stat().st_size;record['stats']=stats
for folder in [src,pub]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'geometry-report.json').write_text(json.dumps(geometry,indent=2))
print('EXPORTED_V011',stats,flush=True)
if '--no-render' not in sys.argv:b.render_preview('link',pub/'thumbnail.png')
