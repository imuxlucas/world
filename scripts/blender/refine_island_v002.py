"""Versioned porcelain island refinement; run in a separate background Blender."""
import sys, math, json, shutil
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import build_asset_parts as b
import bpy
from mathutils import Vector

ROOT=b.ROOT
OUT=ROOT/'public/assets/island/v002'
SOURCE=ROOT/'asset-sources/island/v002'
TEXTURE=OUT/'mucha-ceramic-basecolor.png'
R=5.2
TOP=.56

def mesh(name, vertices, faces, mat, parent, bevel=0, smooth=True):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    return b.finish(obj,name,mat,parent,bevel,smooth)

def bend(x,z,r=5.28):
    a=x/R
    return (r*math.sin(a),-r*math.cos(a),z)

def outline(x):
    # Soft Art Nouveau shoulders and round terminal lobes, rather than a flat board.
    h=.282+.045*math.exp(-((abs(x)-1.91)/.22)**2)
    if abs(x)>2.04:
        h*=math.sqrt(max(0,1-((abs(x)-2.04)/.34)**2))
    return .385-h,.385+h

def plaque_body(name, parent, radius, thick, mat):
    steps=240;v=[]
    for r in [radius-thick,radius]:
        for upper in [False,True]:
            for i in range(steps+1):
                x=-2.38+4.76*i/steps
                lo,hi=outline(x)
                v.append(bend(x,hi if upper else lo,r))
    n=steps+1;f=[]
    for i in range(steps):
        j=i+1
        f.extend([(i,j,n+j,n+i),(2*n+j,2*n+i,3*n+i,3*n+j),
                  (n+i,n+j,3*n+j,3*n+i),(j,i,2*n+i,2*n+j)])
    f.extend([(0,n,3*n,2*n),(steps,2*n+steps,3*n+steps,n+steps)])
    return mesh(name,v,f,mat,parent,.016)

def bezier(points,n=32):
    a,c,d,e=points
    return [tuple((1-t)**3*a[k]+3*(1-t)**2*t*c[k]+3*(1-t)*t*t*d[k]+t**3*e[k] for k in range(2)) for t in [i/n for i in range(n+1)]]

def build():
    b.reset()
    b.M['ivory']=b.material('Pearl porcelain',(.965,.95,.955),rough=.27)
    b.M['rose']=b.material('Rose enamel ornament',(.75,.36,.51),rough=.3)
    b.M['hairline']=b.material('Blush porcelain seam',(.87,.69,.78),rough=.31)
    b.M['ink']=b.material('Cobalt serif enamel',(.20,.36,.58),rough=.34)
    base=b.part('island_base','圆形岛屿底盘','加厚至 0.56m 的圆形瓷座，圆润倒角；前缘承托异形铭牌。')
    border=b.part('island_border','陶瓷包边','细腻粉色嵌线与上下双层陶瓷圆边。')
    paving=b.part('island_paving','穆夏陶瓷铺装','根据选定参考图生成的粉蓝穆夏贴图；平面 UV、清漆陶瓷材质。')
    mathpart=b.part('island_math','心形函数图','独立的蓝色心形曲线、极坐标虚线与坐标轴。')
    plaque=b.part('island_plaque','弧形公式铭牌','沿圆周贴合的异形陶瓷浮雕，弯曲的 Georgia 衬线字及粉色新艺术花边。')
    b.cyl('Thick porcelain foundation',R,TOP,(0,0,TOP/2),'ivory',base,.065,256)
    b.torus('Lower porcelain moulding',5.13,.04,(0,0,.083),'ivory',border)
    b.torus('Lower rose hairline',5.186,.008,(0,0,.115),'hairline',border)
    b.torus('Upper porcelain rolled edge',5.137,.041,(0,0,.546),'ivory',border)
    b.torus('Upper rose inlay',5.104,.01,(0,0,.57),'hairline',border)
    # Planar mapping is deterministic; front = -Y = lower half of source image.
    mat=b.material('Mucha glazed ceramic / generated albedo', (1,1,1),rough=.30)
    shader=mat.node_tree.nodes.get('Principled BSDF');shader.inputs['Coat Weight'].default_value=.4
    shader.inputs['Coat Roughness'].default_value=.22
    tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(TEXTURE));tex.image.pack()
    tex.image.colorspace_settings.name='sRGB';mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
    v=[(0,0,TOP+.007)]+[(5.08*math.cos(i*math.tau/256),5.08*math.sin(i*math.tau/256),TOP+.007) for i in range(256)]
    o=mesh('Continuous ceramic inlay',v,[(0,1+i,1+(i+1)%256) for i in range(256)],mat,paving,0,False)
    uv=o.data.uv_layers.new(name='Planar ornament UV')
    for p in o.data.polygons:
        for li in p.loop_indices:
            pos=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(pos.x/(5.08*2/.98)+.5,pos.y/(5.08*2/.98)+.5)
    # Closed, curved enamel plate directly overlaps the foundation, with no floating gap.
    plaque_body('Raised curved porcelain cartouche',plaque,5.274,.145,'ivory')
    contour=[]
    for i in range(201):
        x=-2.34+4.68*i/200;lo,hi=outline(x)
        contour.append(bend(x,.385+(hi-.385)*.87,5.286))
    for i in range(201):
        x=2.34-4.68*i/200;lo,hi=outline(x)
        contour.append(bend(x,.385+(lo-.385)*.87,5.286))
    b.tube('Rose cartouche contour',contour,.008,'hairline',plaque,True,3)
    # Font glyphs are bent onto the same cylinder as their ceramic support.
    c=bpy.data.curves.new('Exact Lucas formula','FONT');c.body='Lucas = ½ Fun + ½ Math'
    c.font=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Georgia.ttf')
    c.size=1;c.align_x='CENTER';c.resolution_u=12;c.extrude=.0012;c.bevel_depth=.00025
    o=bpy.data.objects.new('Lucas formula · curved Georgia',c);bpy.context.collection.objects.link(o)
    b.finish(o,o.name,'ink',plaque)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    xs=[v.co.x for v in o.data.vertices];ys=[v.co.y for v in o.data.vertices]
    scale=3.45/(max(xs)-min(xs));cx=(max(xs)+min(xs))/2;cy=(max(ys)+min(ys))/2
    for vertex in o.data.vertices:
        x,y,d=vertex.co
        vertex.co=bend((x-cx)*scale,.382+(y-cy)*scale,5.29+d)
    # Bilateral fleur-de-lis motifs with flowing stems, kept as physical enamel relief.
    curls=[[(0,-.16),(-.04,-.03),(-.03,.10),(0,.18)],
           [(0,.18),(.11,.16),(.06,.07),(0,.07)],
           [(-.01,-.055),(-.20,.11),(-.24,-.015),(-.11,-.01)],
           [(-.015,-.065),(.18,.07),(.22,-.065),(.10,-.05)],
           [(0,-.16),(.07,-.19),(.13,-.16),(.14,-.13)]]
    for sign in [-1,1]:
        for i,controls in enumerate(curls):
            points=[bend(sign*(2.01+x),.39+z,5.292) for x,z in bezier(controls)]
            b.tube('Mucha fleur de lis %s %s'%(sign,i),points,.013,'rose',plaque,False,3)
    # Geometry remains editable and distinct from the generated surface ornament.
    cy=-2.05;z=TOP+.016
    for radius in [.37,.74,1.10]:
        for i in range(32):
            a=math.tau*i/32
            b.tube('Polar circle dash',[(radius*math.cos(a+math.tau*j/(32*8)),cy+radius*math.sin(a+math.tau*j/(32*8)),z) for j in range(6)],.0032,'ink',mathpart,False,2)
    # Cardioid, r = a(1 - sin(theta)), heart indentation at the top.
    pts=[]
    for i in range(257):
        a=math.tau*i/256;r=.68*(1-math.sin(a))
        pts.append((r*math.cos(a),cy+.32+r*math.sin(a),z+.002))
    b.tube('Heart cardioid',pts,.008,'ink',mathpart,True,3)
    b.tube('X axis',[(-1.3,cy,z),(1.34,cy,z)],.004,'ink',mathpart)
    b.tube('Y axis',[(0,cy-1.35,z),(0,cy+1.3,z)],.004,'ink',mathpart)
    for x,y,a in [(1.34,cy,0),(0,cy+1.3,math.pi/2)]:
        b.tube('Axis arrow',[(x-.085*math.cos(a-.4),y-.085*math.sin(a-.4),z),(x,y,z),(x-.085*math.cos(a+.4),y-.085*math.sin(a+.4),z)],.006,'ink',mathpart)
    b.text('X label','x',(1.44,cy,z+.003),.14,'ink',mathpart,horizontal=True)
    b.text('Y label','y',(0,cy+1.45,z+.003),.14,'ink',mathpart,horizontal=True)
    return {'id':'island','name':'Island · 梦核圆盘','subtitle':'粉蓝穆夏陶瓷 · 弧形衬线铭牌 v002','category':'场景底盘','status':'review',
       'description':'加厚圆形陶瓷底座、凸起异形弧面铭牌、粉蓝穆夏釉面铺装与独立心形函数图。',
       'notes':['本轮已使用参考图生成的实际陶瓷底色贴图，嵌入 GLB。','铭牌和全部衬线字沿半径弯曲；粉色浮雕花边与底座紧密贴合。','保留 v001；当前 v002 供造型与材质确认。'],
       'modelUrl':'/assets/island/v002/model.glb','thumbnail':'/assets/island/v002/thumbnail.png',
       'source':{'label':'原创 Blender 陶瓷精修 · v002','path':'asset-sources/island/v002/source.blend'}}

def main():
    OUT.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
    record=build();b.consolidate();stats,report=b.geometry_report('island')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(OUT/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    stats['bytes']=(OUT/'model.glb').stat().st_size;record.update(parts=b.PARTS,stats=stats)
    report['dimensions']={'radius':R,'bodyThickness':TOP,'previousThickness':.23,'plaqueRadius':5.274,'plaqueBackRadius':5.129}
    report['texture']={'path':str(TEXTURE.relative_to(ROOT)),'width':bpy.data.images.get('mucha-ceramic-basecolor.png').size[0]}
    for folder in [OUT,SOURCE]:
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
        (folder/'geometry-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (OUT.parent/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'))
    print('ISLAND_V002_EXPORTED',json.dumps(stats),flush=True)
    b.render_preview('island',OUT/'thumbnail.png')
    scene=bpy.context.scene;cam=scene.camera
    cam.location=(0,-12,10);target=Vector((0,0,.3));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=11.8;scene.render.filepath=str(OUT/'thumbnail.png');bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'source.blend'))
    shutil.copy2(OUT/'thumbnail.png',SOURCE/'thumbnail.png');shutil.copy2(OUT/'thumbnail.png',OUT.parent/'thumbnail.png')
    print('ISLAND_V002_READY',flush=True)

if __name__=='__main__':main()
