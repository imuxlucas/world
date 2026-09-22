"""Smooth rim-only pinch, deeper inward shoulder and inset approved artwork."""
import sys, math, json, shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import refine_island_v002 as previous
import build_asset_parts as b
import bpy
from mathutils import Vector

ROOT=b.ROOT
OUT=ROOT/'public/assets/island/v005'
SOURCE=ROOT/'asset-sources/island/v005'
R=5.2
TOP=.56
DEPTH=.038
ANGULAR=512
ANGLES=[-math.pi+math.tau*i/ANGULAR for i in range(ANGULAR)]

def smoother(t):
    t=max(0.0,min(1.0,t))
    return t*t*t*(t*(t*6-15)+10)

def angular_bump(a):
    """Wide top and only slightly wider base; both corner derivatives are zero."""
    x=abs(R*math.sin(a))
    if math.cos(a)<=0 or x>=2.46:return 0.0
    if x<=1.98:return 1.0
    return 1.0-smoother((x-1.98)/.48)

def radial_bump(r):
    """One deliberate plaster shoulder ending flat at r=4.48, not a ripple."""
    if r<=4.48:return 0.0
    if r>=5.08:return 1.0
    return smoother((r-4.48)/.60)

def top_z(r,a):
    return TOP+.35*angular_bump(a)*radial_bump(r)

def recess_radius(a,z):
    """A shallow deboss with a generous ceramic margin and eased inner arris."""
    x=abs(R*math.sin(a))
    top=TOP+.35*angular_bump(a)
    side=max(0.0,2.30-x)
    lower=z-.135
    upper=top-.070-z
    edge=min(side,lower,upper)
    if edge<=0:return R
    return R-DEPTH*smoother(edge/.050)

def make_mesh(name,verts,faces,mat,parent,smooth=True):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    return b.finish(obj,name,mat,parent,0,smooth)

def make_body(parent):
    verts=[];rows=[]
    def add_ring(fn):
        row=[]
        for a in ANGLES:
            r,z=fn(a);row.append(len(verts));verts.append((r*math.sin(a),-r*math.cos(a),z))
        rows.append(row)
    add_ring(lambda a:(5.15,0.0))
    add_ring(lambda a:(5.19,.025))
    add_ring(lambda a:(R,.065))
    # Regular vertical sampling makes the recessed face smooth and predictable.
    for j in range(97):
        t=j/96
        add_ring(lambda a,t=t:(recess_radius(a,.065+(top_z(R,a)-.010-.065)*t),.065+(top_z(R,a)-.010-.065)*t))
    # The top shoulder extends 0.72 m inward, with dense radial support near both seams.
    radii=[5.20,5.17,5.14,5.11,5.08,5.03,4.97,4.90,4.82,4.74,4.66,4.59,4.53,4.48,.02]
    for r in radii:add_ring(lambda a,r=r:(r,top_z(r,a)))
    faces=[]
    for j in range(len(rows)-1):
        for i in range(ANGULAR):
            k=(i+1)%ANGULAR
            faces.append((rows[j][i],rows[j][k],rows[j+1][k],rows[j+1][i]))
    faces.extend([tuple(reversed(rows[0])),tuple(rows[-1])])
    obj=make_mesh('Smooth one-piece pinched island',verts,faces,'ivory',parent,True)
    art=b.material('Approved inscription / inset ceramic print',(1,1,1),rough=.36)
    shader=art.node_tree.nodes.get('Principled BSDF');shader.inputs['Coat Weight'].default_value=.16
    tex=art.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'front-inscription.png'));tex.image.pack();tex.extension='EXTEND'
    art.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
    obj.data.materials.append(art)
    uv=obj.data.uv_layers.new(name='Inset artwork UV / preserved aspect')
    # The image sits at 93% of the recess width with the same X/Y scale.
    image_width=4.17
    image_height=image_width*(724/2172)
    center_z=.49
    for face in obj.data.polygons:
        ring=face.index//ANGULAR
        points=[obj.data.vertices[obj.data.loops[li].vertex_index].co for li in face.loop_indices]
        x=sum(p.x for p in points)/len(points);z=sum(p.z for p in points)/len(points)
        if 2<=ring<99 and abs(x)<image_width/2 and center_z-image_height/2<z<center_z+image_height/2:
            face.material_index=1
        for li in face.loop_indices:
            p=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(.5+p.x/image_width,.5+(p.z-center_z)/image_height)
    return obj

def make_paving(parent,mat):
    radii=[.02,1.0,2.0,3.0,4.0,4.48,4.53,4.59,4.66,4.74,4.82,4.90,4.97,5.03,5.075]
    verts=[]
    for r in radii:
        for a in ANGLES:verts.append((r*math.sin(a),-r*math.cos(a),top_z(r,a)+.006))
    faces=[]
    for j in range(len(radii)-1):
        for i in range(ANGULAR):
            k=(i+1)%ANGULAR;faces.append((j*ANGULAR+i,j*ANGULAR+k,(j+1)*ANGULAR+k,(j+1)*ANGULAR+i))
    obj=make_mesh('Mucha paving with one smooth local shoulder',verts,faces,mat,parent,True)
    uv=obj.data.uv_layers.new(name='Planar Mucha UV')
    for face in obj.data.polygons:
        for li in face.loop_indices:
            p=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(p.x/(5.08*2/.98)+.5,p.y/(5.08*2/.98)+.5)
    return obj

def setup_render():
    scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE'
    scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.world.color=(.9,.92,.97)
    bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';scene.camera=camera
    target=Vector((0,0,.35))
    for name,loc,energy,size,color in [('Key',(3,-6,9),1050,5,(1,.92,.97)),('Fill',(-5,-2,5),700,4,(.72,.84,1)),('Rim',(2,5,6),900,4,(.82,.89,1))]:
        bpy.ops.object.light_add(type='AREA',location=loc);lamp=bpy.context.object;lamp.name=name;lamp.data.energy=energy;lamp.data.shape='DISK';lamp.data.size=size;lamp.data.color=color;lamp.rotation_euler=(target-lamp.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));ground=bpy.context.object;ground.name='PREVIEW_FLOOR';ground.data.materials.append(b.M['white'])
    return scene,camera

def main():
    OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
    record=previous.build()
    doomed=set()
    for name in ['island_base','island_border','island_plaque']:
        root=bpy.data.objects[name];doomed.add(root);doomed.update(root.children_recursive)
    doomed.add(bpy.data.objects['Heart cardioid'])
    old_paving=bpy.data.objects['Continuous ceramic inlay'];paving_mat=old_paving.data.materials[0];doomed.add(old_paving)
    b.ASSET_OBJECTS[:]=[o for o in b.ASSET_OBJECTS if o not in doomed]
    for obj in doomed:bpy.data.objects.remove(obj,do_unlink=True)
    b.PARTS[:]=[p for p in b.PARTS if p['id'] not in ['island_base','island_border','island_plaque']]
    b.M['ivory']=b.material('Smooth plaster porcelain',(.985,.98,.99),rough=.36)
    base=b.part('island_base','加厚平滑凸起底盘','圆角梯形由连续函数生成；凸起向圆心延伸 0.72m，内接缝以五次平滑曲线回到平面。')
    border=b.part('island_border','浅凹陶瓷边缘','真实凹槽深 0.038m；已选贴图缩至凹面宽度约 93%，四周保留瓷白边。')
    make_body(base)
    make_paving(bpy.data.objects['island_paving'],paving_mat)
    b.torus('Lower porcelain foot',5.16,.016,(0,0,.032),'ivory',border)
    mathpart=bpy.data.objects['island_math']
    b.tube('Standard pointed heart',[(x,y-2.05+.145,TOP+.018) for x,y in b.heart_points(1.03/16,1.03/16,256)],.008,'ink',mathpart,True,3)
    order=['island_base','island_border','island_paving','island_math'];b.PARTS.sort(key=lambda p:order.index(p['id']))
    record.update(subtitle='圆角平滑凸起 · 内缩浅凹铭牌 v005',description='消除像素轮廓导致的折面；局部石膏凸起向内加厚，贴图等比例内缩并留出清晰凹槽边距。',
        notes=['上沿和转角改为解析圆角梯形，不再逐像素塑形。','贴图按原始宽高比使用，缩至凹槽宽度约 93%。','凸起从外缘向圆心延伸 0.72m，单次平滑过渡后恢复完全平整。'],
        modelUrl='/assets/island/v005/model.glb',thumbnail='/assets/island/v005/thumbnail.png',source={'label':'原创 Blender 平滑加厚底盘 · v005','path':'asset-sources/island/v005/source.blend'})
    b.consolidate();stats,report=b.geometry_report('island')
    report['construction']={'analyticRoundedTrapezoid':True,'pixelDrivenGeometry':False,'rimInwardDepth':.72,'flatPlaneStartsAtRadius':4.48,'recessDepth':DEPTH,'artworkWidth':4.17,'recessApproxWidth':4.60,'artworkScaleOfRecess':.906,'preservedArtworkAspect':True}
    bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    stats['bytes']=(OUT/'model.glb').stat().st_size;record.update(parts=b.PARTS,stats=stats)
    for folder in [OUT,SOURCE]:
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2));(folder/'geometry-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (OUT.parent/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'))
    scene,camera=setup_render()
    for name,loc,target,scale in [('thumbnail',(0,-12,10),(0,0,.35),11.8),('front-detail',(0,-10,2.4),(0,-4.65,.53),5.2),('rim-side',(6,-9,4.2),(0,-4.45,.57),6.0),('top-seam',(0,-8,8),(0,-4.25,.57),5.4)]:
        camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
        scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    camera.location=(0,-12,10);camera.rotation_euler=(Vector((0,0,.35))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=11.8
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'));shutil.copy2(OUT/'thumbnail.png',OUT.parent/'thumbnail.png')
    print('ISLAND_V005_READY',json.dumps(stats),flush=True)

if __name__=='__main__':main()
