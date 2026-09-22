"""Straight hub beam deliberately traverses Cupid's shoulder centre."""
import bpy, sys, json, shutil, math
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT
version='v006' if '--v006' in sys.argv else 'v005'
src=ROOT/f'asset-sources/link/{version}';pub=ROOT/f'public/assets/link/{version}'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v003/source.blend'))
bpy.context.preferences.filepaths.save_version=0
model=bpy.data.objects['User cupid with heart sunglasses']
for o in list(bpy.context.scene.objects):
    if o.name.startswith('User cupid rear'):bpy.data.objects.remove(o,do_unlink=True)
# Retain the original, single straight hub-to-hub beam without rear returns.
beam=bpy.data.objects['Continuous hub-to-hub load beam']
shoulder=Vector((0,-.585712730884552,2.45))
target=Vector((0,-.05,2.75));scale=.90
if version=='v006':
    target+=Vector((0,-.02,.06))
    # Cylinder-local X/Y are the cross section; retain original axial length.
    beam.scale.x*=.038/.052
    beam.scale.y*=.038/.052
model.location=target+(model.location-shoulder)*scale
model.scale*=scale
bpy.context.view_layer.update()
# Check that a horizontal ray crosses the actual shoulder region on both sides.
inv=model.matrix_world.inverted();contacts=[]
for side in [-1,1]:
    start=Vector((side*.8,-.05,2.75));direction=Vector((-side,0,0))
    hit,p,n,i=model.ray_cast(inv@start,inv.to_3x3()@direction)
    assert hit,'Straight beam must intersect sculpture at shoulder level'
    contacts.append(list(model.matrix_world@p))
deps=bpy.context.evaluated_depsgraph_get()
def bounds(o):
    e=o.evaluated_get(deps);pts=[e.matrix_world@Vector(p) for p in e.bound_box]
    return ([min(p[k] for p in pts) for k in range(3)],[max(p[k] for p in pts) for k in range(3)])
lo,hi=bounds(model)
route=json.loads((ROOT/'asset-sources/link/v003/route.json').read_text())
samples=route['samples'];minimum=float('inf');checks=0
for g in bpy.data.objects['link_gondolas'].children:
    anchor=g['routeAnchor']
    for child in g.children_recursive:
        if child.type not in {'MESH','CURVE','FONT'}:continue
        clo,chi=bounds(child)
        for i,p in enumerate(samples):
            q=samples[(i+1)%len(samples)]
            d0=[p[0]-anchor[0],0,p[2]-anchor[2]];d1=[q[0]-anchor[0],0,q[2]-anchor[2]]
            slo=[clo[k]+min(d0[k],d1[k]) for k in range(3)]
            shi=[chi[k]+max(d0[k],d1[k]) for k in range(3)]
            gap=[max(lo[k]-shi[k],slo[k]-hi[k],0) for k in range(3)]
            minimum=min(minimum,math.sqrt(sum(v*v for v in gap)));checks+=1
assert minimum>.015,minimum
report={'method':'Evaluated component AABBs swept over full closed polyline; upright cabins without swing','segments':len(samples),'componentSegmentChecks':checks,'cupidCabinClearanceLowerBound':minimum,'cupidBounds':{'min':lo,'max':hi},'beamEndpoints':[[-.91,-.05,2.75],[.91,-.05,2.75]],'shoulderAxisTarget':list(target),'sideRayContacts':contacts,'uniformScaleRelativeToV003':scale,'intentionalShoulderIntersection':True,'limitation':'Cupid versus cabins only; no cabin swinging or full-machine safety validation.'}
if version=='v006':
    occlusion=[]
    for x in [-.10,-.05,0,.05,.10]:
        for z in [2.725,2.75,2.775]:
            hit,p,n,i=model.ray_cast(inv@Vector((x,-2,z)),inv.to_3x3()@Vector((0,1,0)))
            front=(model.matrix_world@p).y if hit else None
            occlusion.append({'x':x,'z':z,'frontY':front,'covered':hit and front<-.088})
    assert all(p['covered'] for p in occlusion),occlusion
    report.update(frontOcclusionSamples=occlusion,beamRadius=.038,deltaFromV005=[0,-.02,.06])
(src/'clearance-check.json').write_text(json.dumps(report,indent=2))
record=json.loads((ROOT/'public/assets/link/v003/parts.json').read_text())
record.update(subtitle=f'双心连接摩天轮 · 直梁贯肩 {version}',modelUrl=f'/assets/link/{version}/model.glb',thumbnailUrl=f'/assets/link/{version}/thumbnail.png',source={'label':f'可编辑 Blender · {version}','path':f'asset-sources/link/{version}/source.blend'})
description='轮毂之间保持单根直横梁，从丘比特侧面肩部中心贯穿承重，无回折梁或背部支架。'
bpy.data.objects['link_cupid']['description']=description
for p in record['parts']:
    if p['id']=='link_cupid':p['description']=description
record['notes']=[description,'雕像等比缩小 10% 以保留吊舱净空，原造型和 PBR 材质保留。',f'直立吊舱全路径保守净空下界 {minimum:.4f}；不包括吊舱摆动或整机校核。']
if version=='v006':record['notes'].append('相对 v005 前移 0.02、上移 0.06；仅横梁半径由 0.052 改为 0.038，身体中央正面射线遮挡检查通过。')
route['status']='Cupid versus upright translating cabins: conservative swept clearance verified; shoulder/beam intersection intentional'
for folder in [src,pub]:(folder/'route.json').write_text(json.dumps(route,indent=2))
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
b.M={'white':next(m for m in bpy.data.materials if m.name.startswith('Porcelain / cold white'))}
b.ASSET_OBJECTS=[o for o in bpy.context.scene.objects if o!=model];b.consolidate()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link');stats['bytes']=(pub/'model.glb').stat().st_size
assert all(o['nonFiniteCoordinates']==0 for o in geometry['objects'])
record['stats']=stats
for folder in [src,pub,pub.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'geometry-report.json').write_text(json.dumps(geometry,indent=2))
print('STRAIGHT_SHOULDER_BEAM_VERIFIED',json.dumps(report),flush=True)
b.render_preview('link',pub/'thumbnail.png');shutil.copy2(pub/'thumbnail.png',pub.parent/'thumbnail.png')
if version=='v006':
    camera=bpy.context.scene.camera
    camera.location=(0,-6,2.9)
    camera.rotation_euler=(Vector((0,0,2.9))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale=1.4
    for o in bpy.context.scene.objects:
        if o.parent and (o.parent.name.startswith('link_gondola') or o.parent.parent and o.parent.parent.name=='link_gondolas'):o.hide_render=True
    bpy.context.scene.render.filepath=str(ROOT/'artifacts/link-v006-front-detail.png')
    bpy.ops.render.render(write_still=True)
