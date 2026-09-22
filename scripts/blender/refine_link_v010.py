"""Open cabins, equal arc-length stations, and a full-route support clearance pass."""
import bpy,bmesh,sys,json,math,shutil,bisect,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT;src=ROOT/'asset-sources/link/v010';pub=ROOT/'public/assets/link/v010'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v009/source.blend'))
bpy.context.preferences.filepaths.save_version=0

def mat(prefix):return next(m for m in bpy.data.materials if m.name.startswith(prefix))
b.M={'white':mat('Porcelain / cold white'),'gold':mat('V007 champagne'),'pearl':mat('V007 warm pearl'),'rose':mat('Pearl rose structural'),'blue':mat('Pearl blue structural'),'sofa':b.material('V010 powder blue upholstered sofa',(.57,.73,.94),0,.56),'piping':b.material('V010 sofa ivory piping',(.97,.96,.94),0,.47)}
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
# Keep profile thickness while changing the front/back centre lines.
OLD_TOP=2.37;NEW_TOP=2.90;HUB_RISE=.28;HUB=3.03

def deform_mesh(o,front):
 inv=o.matrix_world.inverted()
 for v in o.data.vertices:
  p=o.matrix_world@v.co;t=(p.z-.39)/(OLD_TOP-.39)
  p.y+=(-.36-.57*t) if front else (.36+.06*t)
  p.z=.39+(p.z-.39)*(NEW_TOP-.39)/(OLD_TOP-.39)
  v.co=inv@p
 o.data.update()
changed=[]
for o in list(bpy.context.scene.objects):
 if 'grooved A leg' in o.name and o.type=='MESH':deform_mesh(o,True);changed.append(o.name)
 elif 'rear stay' in o.name and o.type=='MESH':deform_mesh(o,False);changed.append(o.name)
 elif o.name.startswith(('Anchor lower flange','Anchor socket')):o.location.y+=math.copysign(.36,o.location.y)
 elif 'rear crossbar' in o.name:o.location.y+=.36
# Lift both bearings and their device faces. Re-aim spokes while preserving rail ends.
for o in list(spokes.children):
 if o.name.startswith('Pearl structural spoke'):
  pts=[o.matrix_world@Vector((0,0,v)) for v in [min(v.co.z for v in o.data.vertices),max(v.co.z for v in o.data.vertices)]]
  k=min(range(2),key=lambda i:abs(pts[i].z-2.75));pts[k].z+=HUB_RISE
  name=o.name;rail_end=pts[1-k].copy();pts[0].y=pts[1].y=.74
  bpy.data.objects.remove(o,do_unlink=True);b.beam(name,pts[0],pts[1],.033,'white',spokes,24)
  b.beam('Rear rail standoff',(rail_end.x,.083,rail_end.z),(rail_end.x,.74,rail_end.z),.015,'white',spokes,16)
 else:o.location.z+=HUB_RISE;o.location.y-=.97
for o in bpy.data.objects['link_devices'].children:o.location.z+=HUB_RISE;o.location.y-=.94
for cx,color in [(-.91,'rose'),(.91,'blue')]:
 for y in [-.93,.42]:
  b.box('Separated A frame crosshead',(cx,y,2.95),(.38,.17,.10),color,frame,.016)
  b.box('Separated under-hub leg sockets',(cx-.115,y,2.916),(.115,.15,.055),'white',frame,.012)
  b.box('Separated under-hub leg sockets',(cx+.115,y,2.916),(.115,.15,.055),'white',frame,.012)
  o=b.cyl('Raised spindle bearing',.105,.15,(cx,y,HUB),color,frame,.012,48);o.rotation_euler.x=math.pi/2
  o=b.torus('Raised spindle bearing rim',.086,.010,(cx,y-.079,HUB),'pearl',frame);o.rotation_euler.x=math.pi/2
 b.beam('Depth-separated hub spindle',(cx,-1.025,HUB),(cx,.835,HUB),.050,'white',spokes,32)
 o=b.cyl('Rear spoke centre bearing',.13,.12,(cx,.74,HUB),'pearl',spokes,.012,48);o.rotation_euler.x=math.pi/2
# Keep the original textured chin-in-hands sculpture; rest both elbows at the lower crossing.
# The front of the sculpture is behind the moving trolley plane.
model.location.y+=.39;model.location.z-=.419
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
# Evaluated geometry bounds, including curves, rather than unbaked curve bounding boxes.
deps=bpy.context.evaluated_depsgraph_get();bounds={}
for o in bpy.context.scene.objects:
 if o.type not in {'MESH','CURVE','FONT'}:continue
 e=o.evaluated_get(deps);mesh=e.to_mesh();coords=np.empty(len(mesh.vertices)*3);mesh.vertices.foreach_get('co',coords)
 coords=coords.reshape(-1,3);world=coords@np.asarray(e.matrix_world.to_3x3()).T+np.asarray(e.matrix_world.translation)
 bounds[o.name]=(world.min(axis=0),world.max(axis=0));e.to_mesh_clear()
static=[]
for o in bpy.context.scene.objects:
 if o.name not in bounds:continue
 parent=o.parent.name if o.parent else ''
 if parent in ['link_supports','link_spokes','link_devices','link_cupid','link_base','link_ornament'] or 'grooved A leg' in o.name:
  static.append(o)
lo=np.asarray([bounds[o.name][0] for o in static]);hi=np.asarray([bounds[o.name][1] for o in static]);minimum=999.;worst=None;checks=0;near=[]
by_group={}
for g in sorted(pods.children,key=lambda o:o.name):
 anchor=np.asarray(g['routeAnchor']);delta=samples-anchor;delta[:,1]=0;delta_end=np.roll(delta,-1,axis=0)
 for child in g.children_recursive:
  if child.name not in bounds:continue
  cl,ch=bounds[child.name];sl=cl+np.minimum(delta,delta_end);sh=ch+np.maximum(delta,delta_end)
  gap=np.maximum(np.maximum(lo[None,:,:]-sh[:,None,:],sl[:,None,:]-hi[None,:,:]),0)
  dist=np.linalg.norm(gap,axis=2);idx=np.unravel_index(np.argmin(dist),dist.shape);d=float(dist[idx]);checks+=dist.size
  if d<minimum:minimum=d;worst={'moving':child.name,'fixed':static[idx[1]].name,'segment':int(idx[0])}
  if d<.015:near.append({'moving':child.name,'fixed':static[idx[1]].name,'gap':d,'segment':int(idx[0])})
  for group in ['link_supports','link_spokes','link_devices','link_cupid']:
   mask=[i for i,o in enumerate(static) if o.parent and o.parent.name==group]
   if mask:by_group[group]=min(by_group.get(group,999),float(dist[:,mask].min()))
cupid_lo,cupid_hi=bounds[model.name];cupid_fixed_min=999.;cupid_fixed_worst=None
for o in static:
 if o==model or not o.parent or o.parent.name not in ['link_spokes','link_supports','link_devices']:continue
 a,z=bounds[o.name];d=float(np.linalg.norm(np.maximum(np.maximum(cupid_lo-z,a-cupid_hi),0)))
 if d<cupid_fixed_min:cupid_fixed_min=d;cupid_fixed_worst=o.name
def world_bvh(obj):
 e=obj.evaluated_get(deps);mesh=e.to_mesh();mesh.calc_loop_triangles()
 vertices=[e.matrix_world@v.co for v in mesh.vertices];faces=[tuple(t.vertices) for t in mesh.loop_triangles]
 tree=BVHTree.FromPolygons(vertices,faces,all_triangles=True);e.to_mesh_clear();return tree
cupid_tree=world_bvh(model);cupid_intersections=[];cupid_narrow_checks=0
for o in static:
 if o==model or not o.parent or o.parent.name not in ['link_spokes','link_supports','link_devices']:continue
 a,z=bounds[o.name]
 if np.all(cupid_hi>=a) and np.all(z>=cupid_lo):
  cupid_narrow_checks+=1
  hits=cupid_tree.overlap(world_bvh(o))
  if hits:cupid_intersections.append({'name':o.name,'trianglePairs':len(hits)})
assert not cupid_intersections,cupid_intersections
report={'version':'v010','method':'Component evaluated-geometry AABBs swept continuously over all 640 route segments; rail/trolley mating interface excluded','stationSpacing':length/8,'stations':8,'componentObstacleSegmentChecks':checks,'minimumClearanceLowerBound':minimum,'worstPair':worst,'byGroup':by_group,'nearPairs':near,'removedSolidPanels':sum(n.startswith('Cabin lower side panel') for n in removed),'removedCentreSeats':sum(n.startswith('Cabin seat') for n in removed),'removedCupidBeam':any('hub-to-hub' in n for n in removed),'frontFootY':-1.,'rearFootY':1.,'frontTopY':-.93,'rearTopY':.42,'hubZ':HUB,'cupidDelta':[0,.39,-.419],'cupidBounds':[v.tolist() for v in bounds[model.name]],'editedSupportObjects':len(changed),'cupidStructuralClearance':cupid_fixed_min,'cupidNearestStructure':cupid_fixed_worst,'cupidTriangleIntersectionChecks':cupid_narrow_checks,'cupidStructuralIntersections':cupid_intersections,'spokePlaneY':.74,'hubPlaneY':-.995}
(src/'clearance-check.json').write_text(json.dumps(report,indent=2));print('SWEEP_REPORT',json.dumps(report),flush=True)
# A zero box gap can be a conservative false positive; inspect before final publication.
if near and '--allow-near' not in sys.argv:raise RuntimeError('Resolve reported support clearance pairs before exporting')
record=json.loads((ROOT/'public/assets/link/v009/parts.json').read_text())
record.update(subtitle='双心连接摩天轮 · 通透车厢与避让支架 v010',modelUrl='/assets/link/v010/model.glb',thumbnailUrl='/assets/link/v010/thumbnail.png',source={'label':'可编辑 Blender · v010','path':'asset-sources/link/v010/source.blend'})
for p in record['parts']:
 if p['id']=='link_gondolas':p['description']='八个等弧长排列的吊舱：通透金属栏杆、粉蓝环形软沙发、原分片顶棚与珠形吊点。'
 if p['id']=='link_supports':p['description']='前后展开的双 A 架、独立抬高轴承和底脚，避开完整车厢运行空间。'
 if p['id']=='link_spokes':p['description']='上移的双轮毂与重新对准的辐条；移除贯穿丘比特的横梁。'
 if p['id']=='link_cupid':p['description']='保留原托腮雕塑，下移至双心下方交会处，以双肘搭在轨道上。'
record['notes']=['移除64片深色实心侧板和8个中央座板，改为通透栏杆内的浅蓝环形软沙发。','八个车厢按同一闭合轨道长度八等分，静态模型与网页动画起点一致。','A架前后分离，轮毂上移0.28，辐条与轴承连接同步调整。','删除贯肩横梁，丘比特保留托腮造型并下移至下方交会处。',f'全轨迹结构净空保守下界 {minimum:.4f} 模型米；不包含真实载荷、摆动或工程安全认证。']
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
print('EXPORTED_V010',stats,flush=True)
if '--no-render' not in sys.argv:b.render_preview('link',pub/'thumbnail.png')
