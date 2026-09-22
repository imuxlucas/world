import bpy,json,math,sys,time,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path('/Users/lucas/Desktop/Lucas/lucas-okr-world');src=ROOT/'asset-sources/link/v011'
dimensions=json.loads((src/'structure-check.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(src/'source.blend'))
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()

def geometry(objects):
 vertices=[];faces=[];ranges=[];offset=0
 for o in objects:
  if o.type not in {'MESH','CURVE','FONT'}:continue
  e=o.evaluated_get(deps);m=e.to_mesh();m.calc_loop_triangles()
  p=np.empty(len(m.vertices)*3,dtype=np.float64);m.vertices.foreach_get('co',p);p=p.reshape(-1,3)@np.asarray(e.matrix_world.to_3x3()).T+np.asarray(e.matrix_world.translation)
  tris=np.empty(len(m.loop_triangles)*3,dtype=np.int32);m.loop_triangles.foreach_get('vertices',tris);tris=tris.reshape(-1,3)+offset
  vertices.append(p);faces.extend(map(tuple,tris));ranges.append((len(faces),o.name));offset+=len(p);e.to_mesh_clear()
 return np.concatenate(vertices),faces,ranges

def name_at(ranges,index):return next(name for end,name in ranges if index<end)
pods=bpy.data.objects['link_gondolas'];cabin=sorted(pods.children,key=lambda x:x.name)[0];anchor=np.asarray(cabin['routeAnchor'])
fixed=[]
for o in bpy.context.scene.objects:
 if o.type not in {'MESH','CURVE','FONT'} or not o.parent:continue
 if o.parent.name in ['link_supports','link_spokes','link_devices','link_cupid','link_base','link_ornament'] or 'grooved A leg' in o.name:fixed.append(o)
sv,sf,sn=geometry(fixed);cv,cf,cn=geometry(cabin.children_recursive)
static_tree=BVHTree.FromPolygons(sv.tolist(),sf,all_triangles=True)
route=json.loads((src/'route.json').read_text());points=np.asarray(route['samples'],dtype=float)
collisions=[];started=time.time();poses=[]
# Every source point and each segment midpoint, including the closing segment.
for i,p in enumerate(points):poses.extend([p,(p+points[(i+1)%len(points)])/2])
for i,p in enumerate(poses):
 delta=p-anchor;delta[1]=0
 moving_tree=BVHTree.FromPolygons((cv+delta).tolist(),cf,all_triangles=True)
 overlaps=moving_tree.overlap(static_tree)
 if overlaps:
  pairs=sorted(set((name_at(cn,a),name_at(sn,b)) for a,b in overlaps))
  collisions.append({'pose':i,'position':p.tolist(),'pairs':pairs,'trianglePairs':len(overlaps)})
  if len(collisions)>=12:break
 if i%160==0:print('CHECK_PROGRESS',i,len(poses),round(time.time()-started,1),flush=True)
# Existing source keeps all cabins identical except canopy colour.
report={'version':'v011','hubZ':dimensions['hubZ'],'frontFootY':dimensions['frontFootY'],'footHalfWidth':dimensions['footHalfWidth'],'topHalfWidth':dimensions['topHalfWidth'],'method':'Actual evaluated triangle meshes; 640 rail samples plus all 640 midpoints','posesChecked':i+1,'plannedPoses':len(poses),'pathSamples':640,'maximumStep':max(np.linalg.norm(poses[(j+1)%len(poses)]-p) for j,p in enumerate(poses)),'movingTriangles':len(cf),'staticTriangles':len(sf),'collisions':collisions,'railInterfaceExcluded':True,'seconds':time.time()-started}
(src/'motion-check.json').write_text(json.dumps(report,indent=2));print('MOTION_CHECK',json.dumps(report),flush=True)
if collisions:raise RuntimeError('Cabin mesh intersects structure; inspect named pairs')
