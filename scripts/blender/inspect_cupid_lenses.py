import bpy,json,numpy as np
from pathlib import Path
from mathutils import Vector
root=Path('/Users/lucas/Desktop/Lucas/lucas-okr-world')
bpy.ops.wm.open_mainfile(filepath=str(root/'asset-sources/link/v007/source.blend'))
o=bpy.data.objects['User cupid with heart sunglasses'];uv=o.data.uv_layers.active.data
im=bpy.data.images['texture_diffuse'];w,h=im.size
pix=np.empty(w*h*4,dtype=np.float32);im.pixels.foreach_get(pix);pix=pix.reshape(h,w,4)
points=[]
for p in o.data.polygons:
 c=o.matrix_world@p.center
 if not (-.24<c.x<.24 and 2.93<c.z<3.19 and c.y<-.04):continue
 u=sum((uv[i].uv for i in p.loop_indices),Vector((0,0)))/len(p.loop_indices)
 r,g,b=pix[min(h-1,int(u.y*h)),min(w-1,int(u.x*w)),:3]
 if r>g*1.7 and r>b*1.12:points.append([p.index,*c,float(r),float(g),float(b)])
(root/'artifacts/cupid-red-faces.json').write_text(json.dumps(points))
for side in [-1,1]:
 a=np.array([p[1:4] for p in points if p[1]*side>0]);print('RED_LENS',side,'count',len(a),'min',a.min(0).tolist(),'max',a.max(0).tolist(),'mean',a.mean(0).tolist(),flush=True)
print('MATERIALS',[(m.name,[n.name for n in m.node_tree.nodes if n.type=='TEX_IMAGE']) for m in o.data.materials],flush=True)
seeds={p[0] for p in points};edges={}
for i in seeds:
 for edge in o.data.polygons[i].edge_keys:edges.setdefault(edge,[]).append(i)
adj={i:set() for i in seeds}
for ids in edges.values():
 for i in ids:adj[i].update(ids)
groups=[]
while seeds:
 group=set();stack=[seeds.pop()]
 while stack:
  i=stack.pop();group.add(i)
  for j in adj[i]&seeds:seeds.remove(j);stack.append(j)
 groups.append(group)
for group in sorted(groups,key=len,reverse=True)[:15]:
 a=np.array([tuple(o.matrix_world@o.data.polygons[i].center) for i in group]);print('COMPONENT',len(group),a.min(0).tolist(),a.max(0).tolist(),a.mean(0).tolist(),flush=True)
(root/'artifacts/cupid-lens-components.json').write_text(json.dumps([list(g) for g in sorted(groups,key=len,reverse=True)]))
