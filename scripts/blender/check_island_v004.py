"""Check connected foundation, strictly planar floor, rim-only rise and real recess."""
import bpy, json, math, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/island/v004/source.blend'))
base=bpy.data.objects['island_base'].children[0]
adj=[[] for _ in base.data.vertices]
for e in base.data.edges:
    a,c=e.vertices;adj[a].append(c);adj[c].append(a)
unseen=set(range(len(adj)));components=0
while unseen:
    components+=1;stack=[unseen.pop()]
    while stack:
        for nxt in adj[stack.pop()]:
            if nxt in unseen:unseen.remove(nxt);stack.append(nxt)
assert components==1
assert not any('plaque' in o.name.lower() for o in bpy.context.scene.objects)
assert any(p.material_index==1 for p in base.data.polygons)
floor=bpy.data.objects['island_paving'].children[0]
heights=[v.co.z for v in floor.data.vertices]
assert max(heights)-min(heights)<1e-6
inner=[v.co.z for v in base.data.vertices if math.hypot(v.co.x,v.co.y)<5.079]
assert max(inner)<.56001,max(inner)
front=[math.hypot(v.co.x,v.co.y) for v in base.data.vertices if abs(v.co.x)<.02 and v.co.y<-5.15 and .4<v.co.z<.65]
assert abs(min(front)-(5.2-.036))<.001,min(front)
original=ROOT/'design/textures/island-v004-inscription-preview.png';used=ROOT/'public/assets/island/v004/front-inscription.png'
assert hashlib.sha256(original.read_bytes()).digest()==hashlib.sha256(used.read_bytes()).digest()
result={'bodyConnectedComponents':components,'separatePlaqueObjects':0,'formulaIsBodyMaterial':True,'floorHeightVariation':max(heights)-min(heights),'innerBodyMaxHeight':max(inner),'measuredRecessDepth':5.2-min(front),'approvedTextureUnmodified':True}
(ROOT/'artifacts/island-v004-topology.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
