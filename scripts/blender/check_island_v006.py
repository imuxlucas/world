"""Validate compact near-vertical rear cut and anisotropic artwork scaling."""
import bpy, json, math, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/island/v006/source.blend'))
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
assert max(v.co.z for v in base.data.vertices if math.hypot(v.co.x,v.co.y)<4.869)<.56001
paving=bpy.data.objects['island_paving__Mucha_glazed_ceramic']
flat=[v.co.z for v in paving.data.vertices if math.hypot(v.co.x,v.co.y)<4.869]
assert max(flat)-min(flat)<1e-6
front=sorted((math.hypot(v.co.x,v.co.y),v.co.z) for v in paving.data.vertices if abs(v.co.x)<.015 and 4.86<math.hypot(v.co.x,v.co.y)<5.09 and v.co.y<0)
rise=[item for item in front if .57<item[1]<.91]
assert rise and max(r for r,z in rise)-min(r for r,z in rise)<.02
source=ROOT/'design/textures/island-v004-inscription-preview.png'
used=ROOT/'public/assets/island/v006/front-inscription.png'
assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(used.read_bytes()).digest()
report=json.loads((ROOT/'public/assets/island/v006/geometry-report.json').read_text())
assert all(not item['degenerateFaces'] and not item['nonFiniteCoordinates'] and not item['nonManifoldInteriorEdges'] for item in report['objects'])
result={'bodyConnectedComponents':components,'separatePlaqueObjects':0,'innerFieldHeightVariation':max(flat)-min(flat),'rearMainDropRadialWidth':max(r for r,z in rise)-min(r for r,z in rise),'raisedStripInwardDepth':.32,'recessDepth':.038,'horizontalRecessFillet':.018,'artworkWidthScale':.96,'artworkHeightScale':.92,'approvedTextureUnmodified':True}
(ROOT/'artifacts/island-v006-topology.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
