"""Approved inscription mapped without distortion into a contour-matched rim recess."""
import sys, math, json, shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import refine_island_v002 as previous
import build_asset_parts as b
import bpy
from mathutils import Vector
ROOT=b.ROOT;OUT=ROOT/'public/assets/island/v004';SOURCE=ROOT/'asset-sources/island/v004'
R=5.2;TOP=.56;PIXEL=.00195;DEPTH=.036;MARGIN=.044;ZORIGIN=.115+586*PIXEL
CONTOUR=json.loads((SOURCE/'inscription-contour.json').read_text())
W=CONTOUR['width'];H=CONTOUR['height'];C=CONTOUR['columns']
FIRST=CONTOUR['first'];LAST=CONTOUR['last']
ANGLES=[-.46+.92*i/384 for i in range(384)]+[.46+(math.tau-.92)*i/384 for i in range(384)]
N=len(ANGLES)

def smooth(t):
    t=max(0,min(1,t));return t*t*(3-2*t)

def coord(a):
    a=(a+math.pi)%math.tau-math.pi
    return R*a/PIXEL+W/2

def bounds(px):
    x=max(FIRST,min(LAST,px));k=int(x);f=x-k
    a=C[k] or C[FIRST];d=C[min(k+1,LAST)] or a
    return ZORIGIN-((1-f)*a[1]+f*d[1])*PIXEL,ZORIGIN-((1-f)*a[0]+f*d[0])*PIXEL

def rim_top(a):
    px=coord(a)
    lo,hi=bounds(px)
    outside=max(FIRST-px,px-LAST,0)*PIXEL
    return TOP+max(0,hi+MARGIN-TOP)*(1-smooth(outside/.16))

def side_radius(a,z):
    px=coord(a)
    if not FIRST<px<LAST:return R
    lo,hi=bounds(px)
    # The shoulder is outside the pink contour; the complete outline lies on the recessed bed.
    distance=min(z-lo,hi-z,(px-FIRST)*PIXEL,(LAST-px)*PIXEL)
    return R-DEPTH*smooth((distance+.018)/.035)

def make_body(parent):
    vertices=[];rows=[]
    def ring(fn):
        row=[]
        for a in ANGLES:
            r,z=fn(a);row.append(len(vertices));vertices.append((r*math.sin(a),-r*math.cos(a),z))
        rows.append(row)
    ring(lambda a:(R-.035,0))
    ring(lambda a:(R-.006,.027))
    for j in range(81):
        t=j/80
        ring(lambda a,t=t:(side_radius(a,.055+(rim_top(a)-.012-.055)*t),.055+(rim_top(a)-.012-.055)*t))
    # Lift lives exclusively in the 0.12-wide rim. The floor inside r=5.08 is exactly flat.
    for r,f in [(5.195,.997),(5.18,1),(5.16,.96),(5.14,.77),(5.12,.32),(5.10,.05),(5.08,0),(4.95,0),(.02,0)]:
        ring(lambda a,r=r,f=f:(r,TOP+(rim_top(a)-TOP)*f))
    faces=[]
    for j in range(len(rows)-1):
        for i in range(N):
            k=(i+1)%N;faces.append((rows[j][i],rows[j][k],rows[j+1][k],rows[j+1][i]))
    faces.extend([tuple(reversed(rows[0])),tuple(rows[-1])])
    obj=previous.mesh('One-piece rim with recessed inscription',vertices,faces,'ivory',parent,0,True)
    mat=b.material('Approved Mucha inscription / recessed ceramic', (1,1,1),rough=.35)
    p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.18
    node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(OUT/'front-inscription.png'));node.image.pack();node.extension='EXTEND'
    mat.node_tree.links.new(node.outputs['Color'],p.inputs['Base Color']);obj.data.materials.append(mat)
    uv=obj.data.uv_layers.new(name='Isotropic artwork UV')
    for face in obj.data.polygons:
        ringindex=face.index//N;i=face.index%N
        # Entire front wall including recess shoulder shares the unaltered artwork.
        if 1<=ringindex<82 and abs((ANGLES[i]+math.pi)%math.tau-math.pi)<.439:
            face.material_index=1
        for li in face.loop_indices:
            pos=obj.data.vertices[obj.data.loops[li].vertex_index].co
            a=math.atan2(pos.x,-pos.y)
            uv.data[li].uv=(coord(a)/W,1-(ZORIGIN-pos.z)/(PIXEL*H))
    return obj

def main():
    OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
    record=previous.build()
    doomed=set()
    for name in ['island_base','island_border','island_plaque']:
        root=bpy.data.objects[name];doomed.add(root);doomed.update(root.children_recursive)
    doomed.add(bpy.data.objects['Heart cardioid'])
    b.ASSET_OBJECTS[:]=[o for o in b.ASSET_OBJECTS if o not in doomed]
    for o in doomed:bpy.data.objects.remove(o,do_unlink=True)
    b.PARTS[:]=[p for p in b.PARTS if p['id'] not in ['island_base','island_border','island_plaque']]
    b.M['ivory']=b.material('Soft white plaster ceramic',(.99,.985,.99),rough=.37)
    base=b.part('island_base','浅凹印花一体底盘','凸起限定在最外缘 0.12m；上沿追随已选贴图，浅凹 0.036m，窄留边 0.044m。')
    border=b.part('island_border','圆盘细包边','底部圆边，前缘凹槽与上沿均属于底盘本体。')
    body=make_body(base)
    b.torus('Lower ceramic foot',5.16,.016,(0,0,.031),'ivory',border)
    # Keep the approved planar floor untouched; no lifted triangles behind the rim.
    floor=bpy.data.objects['Continuous ceramic inlay']
    assert max(v.co.z for v in floor.data.vertices)-min(v.co.z for v in floor.data.vertices)<1e-6
    mathpart=bpy.data.objects['island_math']
    b.tube('Standard pointed heart',[(x,y-2.05+.145,TOP+.018) for x,y in b.heart_points(1.03/16,1.03/16,256)],.008,'ink',mathpart,True,3)
    order=['island_base','island_border','island_paving','island_math'];b.PARTS.sort(key=lambda p:order.index(p['id']))
    record.update(subtitle='贴图随形上沿 · 边缘浅凹印花 v004',description='采用已选穆夏铭牌贴图，保留原始字形比例；外缘上沿贴合图案，窄留边与浅凹槽一体成型，圆盘铺装保持平整。',
      notes=['已选贴图原图嵌入 GLB，未拉伸字形、未修改花纹。','外缘浅凹槽为底盘真实几何；没有附加实体铭牌。','抬升仅发生于半径 5.08–5.20 的边缘，后方铺装保持平面。'],
      modelUrl='/assets/island/v004/model.glb',thumbnail='/assets/island/v004/thumbnail.png',source={'label':'原创 Blender 随形浅凹底盘 · v004','path':'asset-sources/island/v004/source.blend'})
    b.consolidate();stats,report=b.geometry_report('island')
    report['construction']={'rimRadialRange':[5.08,5.2],'floorPlanar':True,'recessDepth':DEPTH,'outlineMargin':MARGIN,'isotropicPixelScale':PIXEL,'imageUnmodified':True,'upperRim':'measured from approved pink outer contour'}
    bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    stats['bytes']=(OUT/'model.glb').stat().st_size;record.update(parts=b.PARTS,stats=stats)
    for folder in [OUT,SOURCE]:
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2));(folder/'geometry-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (OUT.parent/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'))
    b.render_preview('island',OUT/'thumbnail.png')
    scene=bpy.context.scene;cam=scene.camera
    for name,loc,target,scale in [('thumbnail',(0,-12,10),(0,0,.3),11.8),('front-detail',(0,-10,2.4),(0,-4.8,.55),5.0),('rim-side',(6,-9,3.9),(0,-4.7,.55),5.7)]:
        cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
        scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    cam.location=(0,-12,10);cam.rotation_euler=(Vector((0,0,.3))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=11.8
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'));shutil.copy2(OUT/'thumbnail.png',OUT.parent/'thumbnail.png')
    print('ISLAND_V004_READY',json.dumps(stats),flush=True)

if __name__=='__main__':main()
