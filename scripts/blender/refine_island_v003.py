"""Continuous pinched island rim; printed formula, no separate plaque solid."""
import sys, math, json, shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import refine_island_v002 as previous
import build_asset_parts as b
import bpy
from mathutils import Vector
ROOT=b.ROOT
OUT=ROOT/'public/assets/island/v003'
SOURCE=ROOT/'asset-sources/island/v003'
N=384
R=5.2
TOP=.56

def height(r,a):
    x=abs(R*math.sin(a))
    shoulder=max(0,min(1,(2.62-x)/.66)) if math.cos(a)>0 else 0
    # A crisp trapezoid in front elevation, with the uplift fading into the ground behind.
    ramp=max(0,min(1,(r-4.35)/.73))
    return TOP+.32*shoulder*ramp

def surface(name,rings,parent,mat,closed=False):
    vs=[]
    for r,mode in rings:
        for i in range(N):
            a=math.tau*i/N
            z=height(r,a) if mode=='top' else mode
            vs.append((r*math.sin(a),-r*math.cos(a),z))
    fs=[]
    for j in range(len(rings)-1):
        for i in range(N):
            k=(i+1)%N
            fs.append((j*N+i,j*N+k,(j+1)*N+k,(j+1)*N+i))
    fs.append(tuple(range((len(rings)-1)*N,len(rings)*N)))
    if closed:fs.append(tuple(reversed(range(N))))
    return previous.mesh(name,vs,fs,mat,parent,0,True)

def print_material():
    mat=b.material('Formula printed directly on plaster',(.965,.95,.955),rough=.42)
    p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Coat Weight'].default_value=.12
    node=mat.node_tree.nodes.new('ShaderNodeTexImage')
    node.image=bpy.data.images.load(str(OUT/'front-formula.png'));node.image.pack()
    mat.node_tree.links.new(node.outputs['Color'],p.inputs['Base Color'])
    node.extension='EXTEND'
    return mat

def main():
    OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
    record=previous.build()
    # Keep approved floor art and the coordinate system. Remove all former plaque geometry.
    doomed=set()
    for rootname in ['island_base','island_border','island_plaque']:
        root=bpy.data.objects[rootname];doomed.add(root);doomed.update(root.children_recursive)
    doomed.add(bpy.data.objects['Heart cardioid'])
    b.ASSET_OBJECTS[:]=[o for o in b.ASSET_OBJECTS if o not in doomed]
    for o in doomed:bpy.data.objects.remove(o,do_unlink=True)
    b.PARTS[:]=[p for p in b.PARTS if p['id'] not in ['island_base','island_border','island_plaque']]
    base=b.part('island_base','一体抬升圆盘','单一闭合底盘网格；正前缘抬升为梯形块面，与盘面连成一体。公式与花纹直接使用该表面的 UV 贴图。')
    border=b.part('island_border','随形陶瓷包边','圆边随前缘抬升，连续经过梯形肩部，无额外铭牌边框。')
    b.M['ivory'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.4
    b.M['ivory'].node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.12
    # One connected manifold mesh: bottom, rounded foot, vertical side, shoulder and top.
    body=surface('Continuous island with raised front edge',[(5.15,.0),(5.19,.025),(5.2,.07),(5.2,'top'),(5.08,'top'),(4.95,'top'),(4.75,'top'),(4.55,'top'),(4.35,'top'),(.02,'top')],base,'ivory',True)
    body.data.materials.append(print_material())
    uv=body.data.uv_layers.new(name='Direct front surface print')
    for face in body.data.polygons:
        # Only the outer vertical wall uses the formula texture; no overlay geometry.
        ring=face.index//N
        points=[body.data.vertices[body.data.loops[li].vertex_index].co for li in face.loop_indices]
        angle=math.atan2(sum(p.x for p in points),-sum(p.y for p in points))
        if ring==2 and abs(angle)<.56:
            face.material_index=1
        for li in face.loop_indices:
            p=body.data.vertices[body.data.loops[li].vertex_index].co
            a=math.atan2(p.x,-p.y)
            uv.data[li].uv=(.5+a/1.12,p.z/.94)
    # Only meaningful silhouette edges are lightly bevelled; shoulders keep plaster planes.
    bevel=body.modifiers.new('Small plaster arris','BEVEL');bevel.width=.015;bevel.segments=2;bevel.angle_limit=.35
    # Replace the old flat fan with a radial grid conforming exactly to the lifted ground.
    old=bpy.data.objects['Continuous ceramic inlay'];mat=old.data.materials[0];paving=old.parent
    b.ASSET_OBJECTS.remove(old);bpy.data.objects.remove(old,do_unlink=True)
    top=surface('Mucha surface following raised edge',[(5.075,'top'),(4.95,'top'),(4.75,'top'),(4.55,'top'),(4.35,'top'),(.02,'top')],paving,mat)
    for v in top.data.vertices:v.co.z+=.006
    uv=top.data.uv_layers.new(name='Planar Mucha artwork')
    for f in top.data.polygons:
        for li in f.loop_indices:
            p=top.data.vertices[top.data.loops[li].vertex_index].co
            uv.data[li].uv=(p.x/(5.08*2/.98)+.5,p.y/(5.08*2/.98)+.5)
    for radius,offset,width,matname in [(5.145,.011,.014,'ivory'),(5.10,.014,.007,'hairline')]:
        b.tube('Continuous rising rim',[(radius*math.sin(i*math.tau/N),-radius*math.cos(i*math.tau/N),height(radius,i*math.tau/N)+offset) for i in range(N)],width,matname,border,True,2)
    b.torus('Lower porcelain bead',5.17,.016,(0,0,.04),'ivory',border)
    # Familiar pointed-heart parametric curve, symmetric in x with a true bottom tip.
    mathpart=bpy.data.objects['island_math']
    points=b.heart_points(1.03/16,1.03/16,256)
    b.tube('Standard pointed heart',[(x,y-2.05+.145,TOP+.018) for x,y in points],.008,'ink',mathpart,True,3)
    order=['island_base','island_border','island_paving','island_math']
    b.PARTS.sort(key=lambda p:order.index(p['id']))
    for part in b.PARTS:
        if part['id']=='island_math':part['description']='标准尖底爱心：x=16sin³(t)，y=13cos(t)−5cos(2t)−2cos(3t)−cos(4t)，保留独立坐标轴。'
    record.update(subtitle='一体抬升前缘 · 公式印花 v003',description='圆盘本体前缘捏起形成梯形块面；公式和粉蓝花纹直接印在底盘表面，保留穆夏铺装与标准尖底爱心。',
        notes=['已移除独立实体铭牌与立体公式字。','公式为可编辑 SVG 排版生成的 4096 × 768 贴图，直接映射底盘侧面。','前缘最高 0.88，普通盘面 0.56；梯形肩部连续过渡到盘面。'],
        modelUrl='/assets/island/v003/model.glb',thumbnail='/assets/island/v003/thumbnail.png',
        source={'label':'原创 Blender 一体底盘 · v003','path':'asset-sources/island/v003/source.blend'})
    b.consolidate();stats,report=b.geometry_report('island')
    report['construction']={'singleConnectedBody':True,'separatePlaque':False,'formula':'base material UV texture','bodyHeight':.56,'raisedFrontHeight':.88,'heartCurve':'classic trigonometric pointed heart'}
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    stats['bytes']=(OUT/'model.glb').stat().st_size;record.update(parts=b.PARTS,stats=stats)
    for folder in [OUT,SOURCE]:
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
        (folder/'geometry-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (OUT.parent/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'))
    b.render_preview('island',OUT/'thumbnail.png')
    scene=bpy.context.scene;camera=scene.camera
    for name,loc,target,scale in [('thumbnail',(0,-12,10),(0,0,.3),11.8),('front-elevation',(0,-15,.45),(0,0,.45),11.2),('front-detail',(0,-10,3),(0,-4.5,.48),6.4)]:
        camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
        scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    camera.location=(0,-12,10);camera.rotation_euler=(Vector((0,0,.3))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=11.8
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'))
    shutil.copy2(OUT/'thumbnail.png',OUT.parent/'thumbnail.png')
    print('ISLAND_V003_READY',json.dumps(stats),flush=True)

if __name__=='__main__':main()
