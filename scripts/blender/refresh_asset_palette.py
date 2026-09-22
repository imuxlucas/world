"""One-time color-space correction for already built v001 assets.

Safe to repeat: materials carry a conversion marker. Future full builds already
apply this conversion in build_asset_parts.material(). No geometry is changed.
"""
import bpy
import json
import shutil
from pathlib import Path

root=Path(__file__).resolve().parents[2]
linear=lambda x:x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
for asset in ['craft','link','island']:
    source=root/'asset-sources'/asset/'v001'
    public=root/'public/assets'/asset/'v001'
    bpy.ops.wm.open_mainfile(filepath=str(source/'source.blend'))
    bpy.context.preferences.filepaths.save_version=0
    for material in bpy.data.materials:
        if not material.use_nodes or material.get('paletteColorSpace'):continue
        bsdf=material.node_tree.nodes.get('Principled BSDF')
        if not bsdf:continue
        for prop in ['Base Color','Emission Color']:
            value=bsdf.inputs[prop].default_value
            bsdf.inputs[prop].default_value=(*[linear(x) for x in value[:3]],value[3])
        material['paletteColorSpace']='linear-from-srgb-v1'
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if not obj.get('previewOnly',False):obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(public/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    for folder in [source,public]:
        record=json.loads((folder/'parts.json').read_text())
        record['stats']['bytes']=(public/'model.glb').stat().st_size
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    bpy.context.scene.render.filepath=str(public/'thumbnail.png')
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(source/'source.blend'))
    shutil.copy2(public/'thumbnail.png',source/'thumbnail.png')
    print('PALETTE_UPDATED',asset,flush=True)
