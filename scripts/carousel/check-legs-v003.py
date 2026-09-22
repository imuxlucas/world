"""Check four disjoint lower limbs on each fused porcelain body."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/carousel/v003/source.blend'))
result=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH' or not obj.data.materials or not obj.data.materials[0].name.startswith('Porcelain horse body'):continue
    # Cut immediately below the belly: all four legs must remain separate.
    selected={v.index for v in obj.data.vertices if (obj.matrix_world@v.co).z<1.16}
    adjacency={i:[] for i in selected}
    for edge in obj.data.edges:
        a,b=edge.vertices
        if a in selected and b in selected:adjacency[a].append(b);adjacency[b].append(a)
    components=[]
    while selected:
        stack=[selected.pop()];size=0
        while stack:
            i=stack.pop();size+=1
            for j in adjacency[i]:
                if j in selected:selected.remove(j);stack.append(j)
        components.append(size)
    assert len(components)==4,(obj.name,components)
    result.append({'horseBody':obj.name,'separateLowerLegs':len(components),'cutHeight':1.16})
assert len(result)==3
(ROOT/'artifacts/carousel-v003-leg-check.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
