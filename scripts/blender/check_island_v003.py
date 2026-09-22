"""Verify that the raised face actually belongs to one connected closed foundation."""
import bpy, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/island/v003/source.blend'))
base=bpy.data.objects['island_base__Pearl_porcelain']
adj=[[] for _ in base.data.vertices]
for e in base.data.edges:
    a,c=e.vertices;adj[a].append(c);adj[c].append(a)
unseen=set(range(len(adj)));components=0
while unseen:
    components+=1;stack=[unseen.pop()]
    while stack:
        for nxt in adj[stack.pop()]:
            if nxt in unseen:unseen.remove(nxt);stack.append(nxt)
assert components==1,components
assert not any('plaque' in o.name.lower() for o in bpy.context.scene.objects)
assert any(p.material_index==1 for p in base.data.polygons)
assert base.data.materials[1].node_tree.nodes.get('Image Texture').image.packed_file
zmax=max(v.co.z for v in base.data.vertices)
assert .875<zmax<.89,zmax
result={'bodyConnectedComponents':components,'separatePlaqueObjects':0,'formulaIsBodyMaterial':True,'packedFormulaTexture':True,'raisedHeight':zmax}
(ROOT/'artifacts/island-v003-topology.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
