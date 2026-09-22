"""Verify the centred wheel structure and sculpture with the evaluated meshes."""
import bpy,json
from pathlib import Path
from mathutils.bvhtree import BVHTree

src=Path(__file__).resolve().parents[2]/'asset-sources/link/v011'
bpy.ops.wm.open_mainfile(filepath=str(src/'source.blend'))
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()

def world_geometry(o):
 e=o.evaluated_get(deps);mesh=e.to_mesh();mesh.calc_loop_triangles()
 vertices=[e.matrix_world@v.co for v in mesh.vertices]
 faces=[tuple(t.vertices) for t in mesh.loop_triangles];e.to_mesh_clear()
 return vertices,faces

model=bpy.data.objects['User cupid with heart sunglasses']
cv,cf=world_geometry(model);ct=BVHTree.FromPolygons(cv,cf,all_triangles=True)
overlaps=[];spoke_centres=[]
for o in bpy.data.objects['link_spokes'].children:
 if o.type!='MESH':continue
 v,f=world_geometry(o)
 if o.name.startswith('Pearl structural spoke'):
  center=(min(p.y for p in v)+max(p.y for p in v))/2
  spoke_centres.append(center)
  assert abs(center)<1e-5, o.name+' is outside the rail plane'
 pairs=ct.overlap(BVHTree.FromPolygons(v,f,all_triangles=True))
 if pairs:overlaps.append({'object':o.name,'intersections':len(pairs)})
assert not any(o.name.startswith(('Short rear rail standoff','Compact rear hub boss','Continuous hub-to-hub load beam')) for o in bpy.context.scene.objects)
center=(min(p.y for p in cv)+max(p.y for p in cv))/2
assert abs(center)<1e-5
report={'cupidDepthCenter':center,'spokeDepthCentres':spoke_centres,'rearExtensions':0,'cupidStructureIntersections':overlaps}
(src/'alignment-check.json').write_text(json.dumps(report,indent=2))
print('ALIGNMENT_CHECK',json.dumps(report),flush=True)
assert not overlaps,'Spoke or hub intersects the sculpture'
