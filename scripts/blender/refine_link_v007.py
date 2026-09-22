"""Reference detail pass; retain user Cupid, approved beam, and hard-shell roofs."""
import bpy,sys,json,math,shutil
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT;src=ROOT/'asset-sources/link/v007';pub=ROOT/'public/assets/link/v007'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v006/source.blend'))
bpy.context.preferences.filepaths.save_version=0
def mat(prefix):return next(m for m in bpy.data.materials if m.name.startswith(prefix))
b.M={'white':mat('Porcelain / cold white'),'gold':b.material('V007 champagne polished trim',(.91,.68,.38),.72,.19),'rose':b.material('V007 rose metal trim',(.94,.46,.66),.42,.22),'blue':b.material('V007 sky metal trim',(.30,.61,.94),.42,.22),'pearl':b.material('V007 warm pearl enamel',(.99,.94,.90),.13,.21),'navy':mat('Deep blue cabin panels'),'pink':mat('Dream pink / enamel')}
for prefix,color in [('Pearl rose structural enamel',(.98,.39,.64)),('Pearl blue structural enamel',(.27,.60,.98))]:
    m=mat(prefix);p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in color),1)
    p.inputs['Roughness'].default_value=.21;p.inputs['Coat Weight'].default_value=.38
for prefix in ['Warm white lamp beads','Pink light strips','Cyan light strips']:
    mat(prefix).node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=3.5
pods=bpy.data.objects['link_gondolas'];base=bpy.data.objects['link_base'];orn=bpy.data.objects['link_ornament'];devices=bpy.data.objects['link_devices'];spokes=bpy.data.objects['link_spokes']
model=bpy.data.objects['User cupid with heart sunglasses'];cupid_before=model.matrix_world.copy()
beam=bpy.data.objects['Continuous hub-to-hub load beam'];beam_before=beam.matrix_world.copy()
for g in list(pods.children):
    x,_,z=g['routeAnchor'];y=-.56;trim='rose' if x<0 else 'blue'
    before=set(bpy.context.scene.objects)
    # Delicate solid metal ribs on the existing porcelain shell, no fabric texture.
    for j in range(8):
        a=math.tau*j/8
        b.beam('Canopy raised metal seam',(x+.026*math.cos(a),y+.026*math.sin(a),z-.129),(x+.201*math.cos(a),y+.201*math.sin(a),z-.264),.006,trim,pods,12)
        b.sphere('Canopy seam rivet',(x+.196*math.cos(a),y+.196*math.sin(a),z-.268),.006,'gold',pods)
    for rad,dz,thick,m in [(.197,-.268,.007,'gold'),(.195,-.287,.009,trim),(.195,-.638,.008,'gold'),(.195,-.671,.008,trim),(.184,-.492,.008,'gold'),(.184,-.610,.006,'gold')]:
        b.torus('Cabin layered moulding',rad,thick,(x,y,z+dz),m,pods)
    for j in range(24):
        a=math.tau*j/24
        b.beam('Cabin lower baluster',(x+.183*math.cos(a),y+.183*math.sin(a),z-.616),(x+.183*math.cos(a),y+.183*math.sin(a),z-.495),.0045,'gold',pods,8)
    for j in range(8):
        a=math.tau*j/8
        b.beam('Cabin upright metal cap',(x+.174*math.cos(a),y+.174*math.sin(a),z-.492),(x+.174*math.cos(a),y+.174*math.sin(a),z-.280),.004,'gold',pods,8)
    b.sphere('Pearl suspension medallion',(x,y,z+.008),.049,'pearl',pods)
    b.sphere('Suspension centre screw',(x,y-.048,z+.008),.011,'gold',pods)
    for dx in [-.029,.029]:
        ring=b.torus('Golden suspension bow',.022,.007,(x+dx,y,z-.075),'gold',pods);ring.rotation_euler[0]=math.pi/2
    b.sphere('Suspension bow clasp',(x,y-.004,z-.075),.014,'gold',pods)
    b.cyl('Canopy finial seat',.038,.019,(x,y,z-.125),trim,pods,.004,32)
    # Maintain the existing rail-anchor pivot and world transforms for animation.
    bpy.context.view_layer.update()
    for o in set(bpy.context.scene.objects)-before:
        world=o.matrix_world.copy();o.parent=g;o.matrix_world=world
for o in list(bpy.context.scene.objects):
    if o.name.startswith('Raised perimeter heart'):
        for modifier in o.modifiers:
            if modifier.type=='BEVEL':modifier.width=.012;modifier.segments=5
    if o.name.startswith('Anchor lower flange'):
        b.torus('Anchor socket pearl lip',.126,.007,(o.location.x,o.location.y,.380),'pearl',bpy.data.objects['link_supports'])
for r,z,m in [(1.964,.035,'pearl'),(1.964,.259,'rose'),(1.837,.339,'pearl')]:b.torus('Platform fine concentric moulding',r,.010,(0,0,z),m,base)
# A small ceramic centre rosette, planar and clear of existing feet.
for j in range(12):
    a=math.tau*j/12
    o=b.sphere('Deck central petal',(.19*math.cos(a),.19*math.sin(a),.338),1,'rose' if j%2 else 'blue',base)
    o.scale=(.16,.036,.004);o.rotation_euler.z=a
b.cyl('Deck rosette centre',.046,.008,(0,0,.341),'pearl',base,.003,32)
def rounded_frame(name,cx,y,cz,w,h,r,material):
    points=[]
    for dx,dz,a in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for j in range(9):
            t=math.radians(a+j*90/8);points.append((cx+dx+r*math.cos(t),y,cz+dz+r*math.sin(t)))
    b.tube(name,points,.006,material,devices,True,2)
rounded_frame('Monitor inset bezel',-.91,-.307,2.75,.430,.315,.032,'rose')
rounded_frame('Phone inset bezel',.91,-.307,2.758,.239,.400,.029,'blue')
for cx,w,h,m in [(-.91,.44,.335,'rose'),(.91,.251,.451,'blue')]:
    for dx in [-w/2,w/2]:
        for dz in [-h/2,h/2]:b.sphere('Device bezel fastener',(cx+dx,-.287,2.75+dz),.008,'gold',devices)
for cx in [-.91,.91]:
    for dx in [-.304,.304]:
        o=b.torus('Hub bearing washer',.027,.006,(cx+dx,-.181,2.75),'pearl',spokes);o.rotation_euler.x=math.pi/2
bpy.context.view_layer.update()
assert model.matrix_world==cupid_before and beam.matrix_world==beam_before
# Rerun full-route bounds with new cabin fittings, rather than reuse old clearance.
deps=bpy.context.evaluated_depsgraph_get()
def bounds(o):
    e=o.evaluated_get(deps);pts=[e.matrix_world@Vector(p) for p in e.bound_box]
    return ([min(p[k] for p in pts) for k in range(3)],[max(p[k] for p in pts) for k in range(3)])
lo,hi=bounds(model);route=json.loads((ROOT/'asset-sources/link/v006/route.json').read_text());samples=route['samples'];minimum=999;checks=0
for g in pods.children:
    anchor=g['routeAnchor']
    for child in g.children_recursive:
        if child.type not in {'MESH','CURVE','FONT'}:continue
        cl,ch=bounds(child)
        for i,p in enumerate(samples):
            q=samples[(i+1)%len(samples)];d0=[p[0]-anchor[0],0,p[2]-anchor[2]];d1=[q[0]-anchor[0],0,q[2]-anchor[2]]
            sl=[cl[k]+min(d0[k],d1[k]) for k in range(3)];sh=[ch[k]+max(d0[k],d1[k]) for k in range(3)]
            minimum=min(minimum,math.sqrt(sum(max(lo[k]-sh[k],sl[k]-hi[k],0)**2 for k in range(3))));checks+=1
assert minimum>.015,minimum
evidence=json.loads((ROOT/'asset-sources/link/v006/clearance-check.json').read_text())
evidence.update(componentSegmentChecks=checks,cupidCabinClearanceLowerBound=minimum,cupidAndBeamTransformsUnchanged=True)
(src/'clearance-check.json').write_text(json.dumps(evidence,indent=2))
record=json.loads((ROOT/'public/assets/link/v006/parts.json').read_text())
record.update(subtitle='双心连接摩天轮 · 参考细节精修 v007',modelUrl='/assets/link/v007/model.glb',thumbnailUrl='/assets/link/v007/thumbnail.png',source={'label':'可编辑 Blender · v007','path':'asset-sources/link/v007/source.blend'})
record['notes']=['保留用户丘比特和 v006 直梁位置、粗细、正面遮挡。','八个吊舱增加金属顶棚分缝、珠形吊点、金色连接环、双层栏杆与分层底圈；顶棚仍为无布纹瓷白硬壳。','加强粉蓝珐琅、轮毂设备边框、底座圆润心形与中心花纹。',f'新吊舱细节全轨迹净空下界 {minimum:.4f}；仅直立平移，不含摆动或整机安全校核。']
for p in record['parts']:
    if p['id']=='link_gondolas':p['description']='瓷白硬壳顶棚与实体金属分缝，珠形吊点、金色连接环、双层栏杆和分层底圈。'
for folder in [src,pub]:(folder/'route.json').write_text(json.dumps(route,indent=2))
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
b.ASSET_OBJECTS=[o for o in bpy.context.scene.objects if o!=model];b.consolidate()
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link');stats['bytes']=(pub/'model.glb').stat().st_size
assert all(o['nonFiniteCoordinates']==0 for o in geometry['objects'])
record['stats']=stats
for folder in [src,pub,pub.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'geometry-report.json').write_text(json.dumps(geometry,indent=2))
print('V007_DETAIL_CHECK',json.dumps({'clearance':minimum,'checks':checks,'stats':stats}),flush=True)
b.render_preview('link',pub/'thumbnail.png');shutil.copy2(pub/'thumbnail.png',pub.parent/'thumbnail.png')
