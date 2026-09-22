"""Check flat paving, a connected rim, and actual colored-outline clearance."""
import bpy, json, math, hashlib, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(Path(__file__).parent))
import refine_island_v007 as model
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/island/v007/source.blend'))
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
paving=bpy.data.objects['island_paving__Mucha_glazed_ceramic']
heights=[v.co.z for v in paving.data.vertices]
assert max(heights)-min(heights)<1e-6
paving_radius=max(math.hypot(v.co.x,v.co.y) for v in paving.data.vertices)
assert 4.959-paving_radius>.028
assert model.radial_bump(4.96)==0 and model.radial_bump(4.982)==1
assert model.recess_radius(math.pi,.35)==model.R
# Check the actual approved colored border, not the white PNG canvas.
contour=json.loads((ROOT/'asset-sources/island/v004/inscription-contour.json').read_text())
clearances=[]
for px,column in enumerate(contour['columns']):
    if column is None:continue
    x=(px-1085.5)*4.34/2145
    a=math.asin(x/model.R)
    for py in column:
        z=.475+(357-py)*.53/458
        clearances.append(min(2.30-abs(x),z-.135,model.TOP+.35*model.angular_bump(a)-.070-z))
assert min(clearances)>.045, min(clearances)
source=ROOT/'design/textures/island-v004-inscription-preview.png'
used=ROOT/'public/assets/island/v007/front-inscription.png'
assert hashlib.sha256(source.read_bytes()).digest()==hashlib.sha256(used.read_bytes()).digest()
report=json.loads((ROOT/'public/assets/island/v007/geometry-report.json').read_text())
assert all(not o['degenerateFaces'] and not o['nonFiniteCoordinates'] and not o['nonManifoldInteriorEdges'] for o in report['objects'])
result={'bodyConnectedComponents':components,'pavingHeightVariation':max(heights)-min(heights),'pavingToRimGap':4.96-paving_radius,'minimumOutlineToCavityBoundary':min(clearances),'rimDepth':.24,'approvedTextureUnmodified':True}
(ROOT/'artifacts/island-v007-topology.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
