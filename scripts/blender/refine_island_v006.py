"""Compact rim pinch with a near-vertical rear face and anisotropic inset."""
import sys, math, json, shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
import refine_island_v002 as previous
import build_asset_parts as b
import bpy
from mathutils import Vector

ROOT=b.ROOT
OUT=ROOT/'public/assets/island/v006'
SOURCE=ROOT/'asset-sources/island/v006'
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
    """0.32m strip with a near-vertical rear wall and tiny upper/lower fillets."""
    if r<=4.870:return 0.0
    if r<4.878:return .04*smoother((r-4.870)/.008)
    if r<4.884:return .04+.92*smoother((r-4.878)/.006)
    if r<4.892:return .96+.04*smoother((r-4.884)/.008)
    return 1.0

def top_z(r,a):
    return TOP+.35*angular_bump(a)*radial_bump(r)

def recess_radius(a,z):
    """Keep top/bottom ease; make the left/right recess walls visibly crisper."""
    x=abs(R*math.sin(a))
    top=TOP+.35*angular_bump(a)
    side=max(0.0,2.30-x)
    lower=z-.135
    upper=top-.070-z
    if min(side,lower,upper)<=0:return R
    side_factor=smoother(side/.018)
    vertical_factor=smoother(min(lower,upper)/.050)
    return R-DEPTH*min(side_factor,vertical_factor)

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
    # A 0.32m-deep raised strip; most of the height drops across only 6mm.
    radii=[5.20,5.17,5.14,5.11,5.08,5.02,4.96,4.92,4.892,4.884,4.878,4.870,4.84,.02]
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
    # User-directed independent scaling from the original physical placement.
    image_width=(2172*.00195)*.96
    image_height=(724*.00195)*.92
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
    radii=[.02,1.0,2.0,3.0,4.0,4.70,4.84,4.870,4.878,4.884,4.892,4.92,4.96,5.02,5.075]
    verts=[]
    for r in radii:
        for a in ANGLES:verts.append((r*math.sin(a),-r*math.cos(a),top_z(r,a)+.006))
    faces=[]
    for j in range(len(radii)-1):
        for i in range(ANGULAR):
            k=(i+1)%ANGULAR
            a=(ANGLES[i]+ANGLES[k])/2
            # Reveal the foundation's clean plaster on the near-vertical rear cut.
            if abs(top_z(radii[j+1],a)-top_z(radii[j],a))>.08:continue
            faces.append((j*ANGULAR+i,j*ANGULAR+k,(j+1)*ANGULAR+k,(j+1)*ANGULAR+i))
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
    base=b.part('island_base','紧凑直背凸起底盘','凸起进深 0.32m；靠圆心的背面近乎垂直落下，只在上下交线保留很小圆角。')
    border=b.part('island_border','四边清晰浅凹陶瓷边缘','左右凹面转折收紧；贴图相对原位置宽 96%、高 92%。')
    make_body(base)
    make_paving(bpy.data.objects['island_paving'],paving_mat)
    b.torus('Lower porcelain foot',5.16,.016,(0,0,.032),'ivory',border)
    mathpart=bpy.data.objects['island_math']
    b.tube('Standard pointed heart',[(x,y-2.05+.145,TOP+.018) for x,y in b.heart_points(1.03/16,1.03/16,256)],.008,'ink',mathpart,True,3)
    order=['island_base','island_border','island_paving','island_math'];b.PARTS.sort(key=lambda p:order.index(p['id']))
    record.update(subtitle='0.32m 紧凑凸起 · 直背浅凹铭牌 v006',description='缩短前缘凸起，后缘近乎垂直落至铺装；加强左右凹槽边界，并按宽 96%、高 92% 调整贴图。',
        notes=['凸起从外缘向圆心仅延伸 0.32m，避免占用放射铺装。','后缘主体为近垂直块面，上下仅保留约 8mm 圆角过渡。','贴图相对原位置独立缩放：宽 96%，高 92%。'],
        modelUrl='/assets/island/v006/model.glb',thumbnail='/assets/island/v006/thumbnail.png',source={'label':'原创 Blender 紧凑直背底盘 · v006','path':'asset-sources/island/v006/source.blend'})
    b.consolidate();stats,report=b.geometry_report('island')
    report['construction']={'analyticRoundedTrapezoid':True,'pixelDrivenGeometry':False,'rimInwardDepth':.32,'flatPlaneStartsAtRadius':4.87,'rearFace':'near-vertical with 8mm upper/lower fillets','recessDepth':DEPTH,'horizontalRecessFillet':.018,'verticalRecessFillet':.050,'artworkWidthScale':.96,'artworkHeightScale':.92}
    bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    stats['bytes']=(OUT/'model.glb').stat().st_size;record.update(parts=b.PARTS,stats=stats)
    for folder in [OUT,SOURCE]:
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2));(folder/'geometry-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (OUT.parent/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'))
    scene,camera=setup_render()
    for name,loc,target,scale in [('thumbnail',(0,-12,10),(0,0,.35),11.8),('front-detail',(0,-10,2.4),(0,-4.65,.53),5.2),('rim-side',(6,-9,4.2),(0,-4.45,.57),6.0),('top-seam',(0,-8,8),(0,-4.25,.57),5.4),('rear-cut',(-4,-1.7,2.7),(-1.8,-4.65,.67),3.7)]:
        camera.location=loc;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=scale
        scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
    camera.location=(0,-12,10);camera.rotation_euler=(Vector((0,0,.35))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=11.8
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'));shutil.copy2(OUT/'thumbnail.png',OUT.parent/'thumbnail.png')
    print('ISLAND_V006_READY',json.dumps(stats),flush=True)

if __name__=='__main__':main()
