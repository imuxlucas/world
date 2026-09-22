"""Recess Cupid and route its load beam behind the sculpture; verify swept clearance."""
import bpy, sys, json, shutil, math
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT
src=ROOT/'asset-sources/link/v004'; pub=ROOT/'public/assets/link/v004'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v003/source.blend'))
bpy.context.preferences.filepaths.save_version=0
model=bpy.data.objects['User cupid with heart sunglasses']
model.location.y+=.94
for o in list(bpy.context.scene.objects):
    if o.name.startswith(('User cupid rear','Continuous hub-to-hub load beam')):
        bpy.data.objects.remove(o,do_unlink=True)
white=next(m for m in bpy.data.materials if m.name.startswith('Porcelain / cold white'))
b.M={'white':white}; spokes=bpy.data.objects['link_spokes']
b.beam('Recessed hub-to-hub load beam',(-.91,.80,2.75),(.91,.80,2.75),.052,'white',spokes,32)
for x in [-.91,.91]:
    b.beam('Hub rear beam return',(x,-.05,2.75),(x,.80,2.75),.052,'white',spokes,32)
bpy.context.view_layer.update()
inverse=model.matrix_world.inverted()
hit,point,normal,index=model.ray_cast(inverse@Vector((0,1.2,2.64)),inverse.to_3x3()@Vector((0,-1,0)))
assert hit
contact=model.matrix_world@point
b.beam('Cupid back-only mounting stem',(0,.80,2.75),tuple(contact+Vector((0,-.01,0))),.028,'white',spokes,24)
b.box('Cupid rear contact pad',tuple(contact),(.12,.024,.08),'white',spokes,.008)
bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
def bounds(o):
    e=o.evaluated_get(deps)
    pts=[e.matrix_world@Vector(p) for p in e.bound_box]
    return ([min(p[k] for p in pts) for k in range(3)],[max(p[k] for p in pts) for k in range(3)])
lo,hi=bounds(model)
assert .80-.052-hi[1]>.07,'Crossbeam must be behind entire sculpture'
route=json.loads((ROOT/'asset-sources/link/v003/route.json').read_text())
samples=route['samples'];minimum=float('inf');checks=0
# Whole evaluated component AABBs are swept over each linear route segment.
# World-up translation preserves depth, so positive depth separation also
# certifies intermediate positions, not just the sampled endpoints.
for g in bpy.data.objects['link_gondolas'].children:
    anchor=g['routeAnchor']
    for child in g.children_recursive:
        if child.type not in {'MESH','CURVE','FONT'}:continue
        clo,chi=bounds(child)
        for i,p in enumerate(samples):
            q=samples[(i+1)%len(samples)]
            delta0=[p[0]-anchor[0],0,p[2]-anchor[2]]
            delta1=[q[0]-anchor[0],0,q[2]-anchor[2]]
            slo=[clo[k]+min(delta0[k],delta1[k]) for k in range(3)]
            shi=[chi[k]+max(delta0[k],delta1[k]) for k in range(3)]
            gap=[max(lo[k]-shi[k],slo[k]-hi[k],0) for k in range(3)]
            clearance=math.sqrt(sum(v*v for v in gap))
            minimum=min(minimum,clearance);checks+=1
assert minimum>.07,minimum
report={'method':'Conservative evaluated component AABBs swept over all closed polyline segments; upright translation without cabin swing','segments':len(samples),'componentSegmentChecks':checks,'cupidCabinClearanceLowerBound':minimum,'cupidBounds':{'min':lo,'max':hi},'crossbeamBackClearance':.80-.052-hi[1],'rearContact':list(contact),'limitation':'Checks Cupid versus complete cabins only, not full-machine physical safety or swinging cabins.'}
(src/'clearance-check.json').write_text(json.dumps(report,indent=2))
record=json.loads((ROOT/'public/assets/link/v003/parts.json').read_text())
record.update(subtitle='双心连接摩天轮 · 后置丘比特 v004',modelUrl='/assets/link/v004/model.glb',thumbnailUrl='/assets/link/v004/thumbnail.png',source={'label':'可编辑 Blender · v004','path':'asset-sources/link/v004/source.blend'})
description='丘比特后移，横梁绕至雕像背后；直立吊舱沿完整轨迹的扫掠包围盒净空已检查。'
bpy.data.objects['link_cupid']['description']=description
for p in record['parts']:
    if p['id']=='link_cupid':p['description']=description
record['notes']=['保留用户丘比特造型与原始 PBR 贴图。','丘比特后移 0.94 场景单位，承重横梁后置，通过背部短支撑连接。',f'直立吊舱全路径保守净空下界 {minimum:.3f} 场景单位；不含吊舱摆动或整机运动校核。']
route['status']='Cupid clearance validated for upright cabin translation along all polyline segments; other full-machine collisions and cabin swinging not validated'
for folder in [src,pub]:(folder/'route.json').write_text(json.dumps(route,indent=2))
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
b.ASSET_OBJECTS=[o for o in bpy.context.scene.objects if o!=model];b.consolidate()
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link');stats['bytes']=(pub/'model.glb').stat().st_size
assert all(o['nonFiniteCoordinates']==0 for o in geometry['objects'])
record['stats']=stats
for folder in [src,pub,pub.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'geometry-report.json').write_text(json.dumps(geometry,indent=2))
b.render_preview('link',pub/'thumbnail.png');shutil.copy2(pub/'thumbnail.png',pub.parent/'thumbnail.png')
print('CLEARANCE_VERIFIED',json.dumps(report),flush=True)
