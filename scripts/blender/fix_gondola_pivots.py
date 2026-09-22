"""Migrate the first v001 export to independent bearing pivots, with no visual change."""
import bpy
import json
from pathlib import Path
from mathutils import Vector

root=Path(__file__).resolve().parents[2]
source=root/'asset-sources/link/v001'
public=root/'public/assets/link/v001'
bpy.ops.wm.open_mainfile(filepath=str(source/'source.blend'))
bpy.context.preferences.filepaths.save_version=0
route=json.loads((source/'route.json').read_text())
maximum_world_change=0
for i in range(8):
    group=bpy.data.objects['link_gondola_%02d'%(i+1)]
    anchor=route['samples'][(41+i*60)%len(route['samples'])]
    bpy.context.view_layer.update()
    before=[(child,child.matrix_world.copy()) for child in group.children]
    group.location=anchor
    bpy.context.view_layer.update()
    for child,world in before:child.matrix_world=world
    group['routeAnchor']=anchor
    group['completePostCount']=8
    bpy.context.view_layer.update()
    for child,world in before:
        maximum_world_change=max(maximum_world_change,max(abs(child.matrix_world[a][b]-world[a][b]) for a in range(4) for b in range(4)))
assert maximum_world_change<1e-5,maximum_world_change
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if not obj.get('previewOnly',False):obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(public/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(source/'source.blend'))
for folder in [source,public]:
    record=json.loads((folder/'parts.json').read_text())
    record['stats']['bytes']=(public/'model.glb').stat().st_size
    (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(source/'pivot-check.json').write_text(json.dumps({'gondolas':8,'pivot':'individual rail bearing','maximumPreservedWorldMatrixDifference':maximum_world_change,'tolerance':1e-5},indent=2))
print('PIVOTS_CHECKED',maximum_world_change)
