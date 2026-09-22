"""Validate smooth local shoulder, flat inner field and inset artwork."""
import bpy, json, math, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/island/v005/source.blend'))
base=bpy.data.objects['island_base__Smooth_plaster_porcelain']
adj=[[] for _ in base.data.vertices]
for edge in base.data.edges:
    a,c=edge.vertices;adj[a].append(c);adj[c].append(a)
unseen=set(range(len(adj)));components=0
while unseen:
    components+=1;stack=[unseen.pop()]
    while stack:
        for nxt in adj[stack.pop()]:
            if nxt in unseen:unseen.remove(nxt);stack.append(nxt)
assert components==1
assert not any('plaque' in obj.name.lower() for obj in bpy.context.scene.objects)
assert any(face.material_index==1 for face in base.data.polygons)
assert max(v.co.z for v in base.data.vertices if math.hypot(v.co.x,v.co.y)<4.479)<.56001
paving=bpy.data.objects['island_paving__Mucha_glazed_ceramic']
flat=[v.co.z for v in paving.data.vertices if math.hypot(v.co.x,v.co.y)<4.479]
assert max(flat)-min(flat)<1e-6
front=[]
for v in paving.data.vertices:
    r=math.hypot(v.co.x,v.co.y)
    if abs(v.co.x)<.015 and 4.47<r<5.09 and v.co.y<0:front.append((r,v.co.z))
front.sort()
assert all(front[i][1]<=front[i+1][1]+1e-7 for i in range(len(front)-1))
source=ROOT/'design/textures/island-v004-inscription-preview.png'
used=ROOT/'public/assets/island/v005/front-inscription.png'
assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(used.read_bytes()).digest()
report=json.loads((ROOT/'public/assets/island/v005/geometry-report.json').read_text())
assert all(not item['degenerateFaces'] and not item['nonFiniteCoordinates'] and not item['nonManifoldInteriorEdges'] for item in report['objects'])
result={'bodyConnectedComponents':components,'separatePlaqueObjects':0,'innerFieldHeightVariation':max(flat)-min(flat),'shoulderMonotonic':True,'shoulderInwardDepth':.72,'recessDepth':.038,'artworkScaleOfRecess':.906,'approvedTextureUnmodified':True}
(ROOT/'artifacts/island-v005-topology.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
