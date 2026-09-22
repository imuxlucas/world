"""Preserve the authorized procedural carousel as an editable Blender asset."""
import bpy
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'public/assets/carousel/v001/model.glb'
OUTPUT = ROOT / 'asset-sources/carousel/v001'
OUTPUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
names = ['base', 'column', 'canopy', 'horses', 'rods', 'frames', 'lights']
missing = [name for name in names if name not in bpy.data.objects]
if missing:
    raise RuntimeError('Missing semantic groups: ' + ', '.join(missing))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bad_vertices = sum(1 for obj in meshes for v in obj.data.vertices if not all(math.isfinite(c) for c in v.co))
degenerate = sum(1 for obj in meshes for p in obj.data.polygons if p.area < 1e-12)
for name in names:
    bpy.data.objects[name]['asset_part'] = name
bpy.context.scene['asset_id'] = 'carousel'
bpy.context.scene['source'] = 'Carousel Lamp by 咕噜蛋Daria; project authorization confirmed by user'
bpy.context.scene['revision'] = 'v001: extracted semantic parts, original painted materials'
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / 'source.blend'))
report = {
    'source': str(SOURCE), 'blend': str(OUTPUT / 'source.blend'),
    'semanticGroups': names, 'meshObjects': len(meshes),
    'vertices': sum(len(o.data.vertices) for o in meshes),
    'faces': sum(len(o.data.polygons) for o in meshes),
    'nonFiniteVertices': bad_vertices, 'nearZeroAreaFaces': degenerate,
    'packedImages': len([i for i in bpy.data.images if i.packed_file]),
    'limitations': ['Imported geometry inspection; not a proof of physical or motion collision clearance.', 'Original source contains decorative curve tips and deliberate overlapping components.']
}
(OUTPUT / 'import-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print(json.dumps(report, ensure_ascii=False))
