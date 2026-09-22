"""Trim photo strings to the scalloped hem without moving photos or charms."""
import bpy, math, json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from mathutils import Vector
from polish_round_two import ROOT, preview
import build_asset_parts as b
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/carousel/v004/source.blend'))
out=ROOT/'public/assets/carousel/v005';src=ROOT/'asset-sources/carousel/v005'
out.mkdir(parents=True,exist_ok=True);src.mkdir(parents=True,exist_ok=True)
report=[]
for mobile in [o for o in bpy.context.scene.objects if o.type=='EMPTY' and o.name.startswith('photo-mobile-')]:
    pos=mobile.matrix_world.translation;a=math.atan2(pos.x,-pos.y)%math.tau
    t=(a/math.tau*16)%1;hem=4.83-.15*math.sin(t*math.pi)
    top=hem-.027
    strings=[o for o in mobile.children if o.type=='MESH' and o.dimensions.z>1 and max(o.dimensions.x,o.dimensions.y)<.025]
    assert len(strings)==1
    rope=strings[0];world=[rope.matrix_world@v.co for v in rope.data.vertices];bottom=min(v.z for v in world);oldtop=max(v.z for v in world)
    inv=rope.matrix_world.inverted()
    for v,w in zip(rope.data.vertices,world):
        w.z=bottom+(w.z-bottom)*(top-bottom)/(oldtop-bottom);v.co=inv@w
    rope.data.update()
    # First two colored beads must both clear the lower piping, not sit on the relief.
    beads=sorted([o for o in mobile.children if o.type=='MESH' and len(o.data.vertices)==240 and o.matrix_world.translation.z>4.5],key=lambda o:-o.matrix_world.translation.z)
    for i,o in enumerate(beads):
        mat=o.matrix_world.copy();mat.translation.z=top-.11-i*.16;o.matrix_world=mat
    bpy.context.view_layer.update()
    assert max((rope.matrix_world@v.co).z for v in rope.data.vertices)<hem-.025
    for o in beads:assert max((o.matrix_world@Vector(c)).z for c in o.bound_box)<hem-.04
    report.append({'mobile':mobile.name,'hem':hem,'stringTop':top,'bottomPreserved':bottom,'beadsRelocated':len(beads)})
assert len(report)==12
bpy.ops.object.select_all(action='SELECT');bpy.ops.file.pack_all()
bpy.context.scene['polishRevision']='v005'
bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
record=json.loads((ROOT/'public/assets/carousel/parts.json').read_text())
record.update(modelUrl='/assets/carousel/v005/model.glb',thumbnail='/assets/carousel/v005/thumbnail.png',subtitle='花檐下沿挂绳修复 · v005')
record['stats']['bytes']=(out/'model.glb').stat().st_size
record['source'].update(path='asset-sources/carousel/v005/source.blend',label='Blender 可编辑源文件 · v005')
record['notes'].append('12 根拍立得绳从波浪花檐下沿起挂，上部珠子移至檐板下方，照片与下端吊饰位置不变。')
for folder in [out,src,out.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'hanger-clearance.json').write_text(json.dumps(report,indent=2))
preview('carousel',out)
print('HANGERS_FIXED',len(report),flush=True)
