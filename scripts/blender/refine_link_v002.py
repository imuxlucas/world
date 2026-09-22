"""Reference-led Link revision. Z up, front -Y; originals remain in v001."""
import bpy, math, json, sys, shutil
from pathlib import Path
from mathutils import Vector, Matrix
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
b.reset()
ROOT=b.ROOT
base=b.part('link_base','圆形共用底座','加厚瓷白圆盘、粉蓝放射铺装，前后脚点围绕圆心对称。')
frame=b.part('link_supports','双 A 架与后撑','加宽开叉的四角凹槽型材，前后脚点对称，独立锚座。')
track=b.part('link_track','双心复合外缘单轨','横向舒展的双心并集闭合带状单轨，粉蓝厚边与白色包边。')
spokes=b.part('link_spokes','辐条与轮毂','扩大双轮毂，横向连接梁及丘比特承重悬臂。')
lights=b.part('link_lights','轨道与支架灯','轨道白色灯珠、粉蓝霓虹和 A 架嵌入式灯槽。')
pods=b.part('link_gondolas','完整吊舱 × 8','无条纹光滑硬壳顶棚，八根立柱、深蓝围栏、独立吊点。')
devices=b.part('link_devices','电脑与手机','缩小至轮毂轮廓内的设备，闭合实体心形与笑脸。')
ornament=b.part('link_ornament','底座心形装饰','沿圆形底座侧壁整圈排列的立体粉色心形。')

def heart(name,loc,width,depth,mat,parent,angle=0):
    pts=b.heart_points(width/32,width/32,96)
    # Star-shaped fan with an interior vertex: never triangulate the concave notch as a quad.
    v=[(0,-depth/2,0),(0,depth/2,0)]
    v.extend((x,-depth/2,z) for x,z in pts)
    v.extend((x,depth/2,z) for x,z in pts)
    n=len(pts);f=[]
    for i in range(n):
        j=(i+1)%n
        f.extend([(0,2+i,2+j),(1,2+n+j,2+n+i),(2+i,2+n+i,2+n+j,2+j)])
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    o.location=loc;o.rotation_euler[2]=angle
    return b.finish(o,name,mat,parent,.007,False)

b.M['petal_pink']=b.material('Pearl rose structural enamel',(.98,.56,.74),.12,.25)
b.M['petal_blue']=b.material('Pearl blue structural enamel',(.39,.70,.99),.15,.23)
b.M['navy']=b.material('Deep blue cabin panels',(.10,.24,.43),.12,.29)
b.M['floor_pink']=b.material('Blush ceramic paving',(.98,.81,.88),.02,.32)
b.M['floor_blue']=b.material('Sky ceramic paving',(.74,.85,.98),.02,.32)
b.M['recess']=b.material('Recess shadow enamel',(.52,.57,.72),.25,.30)
for m in ['pink_glow','cyan_glow','white_glow']:
    b.M[m].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=2.8

b.cyl('Unified porcelain platform',1.97,.27,(0,0,.135),'white',base,.032,128)
b.cyl('Pink rim',1.91,.045,(0,0,.282),'pale_pink',base,.014,128)
b.cyl('Ceramic deck',1.875,.030,(0,0,.315),'white',base,.008,128)
for i in range(20):
    a=math.tau*i/20
    b.sector('Radial ceramic petal',.035,a,a+math.tau/20,.331,.334,1.815,'floor_pink' if i%2==0 else 'floor_blue',base)
for r in [1.87,1.93]:b.torus('Pearl platform edging',r,.017,(0,0,.295),'white',base)
for i in range(28):
    a=math.tau*i/28
    heart('Raised perimeter heart %02d'%i,(1.968*math.cos(a),1.968*math.sin(a),.154),.187,.044,'petal_pink',ornament,a+math.pi/2)

# Reference silhouette: two large outer lobes, lower inner shoulders and rounded lower tips.
# Cubic spans describe one closed composite outer boundary, avoiding sharp analytic cusps.
spans=[
 ((0,3.70),(-.07,3.77),(-.15,3.82),(-.24,3.82)),
 ((-.24,3.82),(-.33,3.82),(-.40,3.75),(-.48,3.75)),
 ((-.48,3.75),(-.68,3.95),(-.95,4.24),(-1.22,4.20)),
 ((-1.22,4.20),(-1.77,4.16),(-2.13,3.65),(-2.08,3.14)),
 ((-2.08,3.14),(-2.06,2.59),(-1.46,1.99),(-.96,1.65)),
 ((-.96,1.65),(-.88,1.59),(-.85,1.59),(-.77,1.65)),
 ((-.77,1.65),(-.49,1.84),(-.23,2.02),(0,2.14)),
 ((0,2.14),(.23,2.02),(.49,1.84),(.77,1.65)),
 ((.77,1.65),(.85,1.59),(.88,1.59),(.96,1.65)),
 ((.96,1.65),(1.46,1.99),(2.06,2.59),(2.08,3.14)),
 ((2.08,3.14),(2.13,3.65),(1.77,4.16),(1.22,4.20)),
 ((1.22,4.20),(.95,4.24),(.68,3.95),(.48,3.75)),
 ((.48,3.75),(.40,3.75),(.33,3.82),(.24,3.82)),
 ((.24,3.82),(.15,3.82),(.07,3.77),(0,3.70)),
]
outline=[]
for a,c,d,e in spans:
    for j in range(48):
        t=j/48;s=1-t
        outline.append(tuple(s**3*a[k]+3*s*s*t*c[k]+3*s*t*t*d[k]+t**3*e[k] for k in [0,1]))
route,length=b.resample_closed(outline,640)
# Round all junctions over a finite arc; ribbon half-width must fit inside each bend.
for _ in range(4):
    route=[tuple(sum(route[(i+j)%640][k] for j in range(-4,5))/9 for k in [0,1]) for i in range(640)]
outline=route
route,length=b.resample_closed(outline,640)

def ribbon(name,pts,width,depth,y,parent):
    # Rounded rectangular cross-section, 16 vertices; normal follows the closed route.
    profile=[]
    radius=.022
    for cx,cy,start in [(width/2-radius,depth/2-radius,0),(-width/2+radius,depth/2-radius,90),(-width/2+radius,-depth/2+radius,180),(width/2-radius,-depth/2+radius,270)]:
        for j in range(4):
            a=math.radians(start+j*30)
            profile.append((cx+radius*math.cos(a),cy+radius*math.sin(a)))
    vs=[];faces=[];n=len(profile)
    for i,(x,z) in enumerate(pts):
        prev=Vector(pts[i-1]);nxt=Vector(pts[(i+1)%len(pts)])
        tangent=(nxt-prev).normalized();normal=Vector((-tangent.y,tangent.x))
        vs.extend((x+normal.x*u,y+v,z+normal.y*u) for u,v in profile)
    for i in range(len(pts)):
        for j in range(n):faces.append((i*n+j,((i+1)%len(pts))*n+j,((i+1)%len(pts))*n+(j+1)%n,i*n+(j+1)%n))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);b.finish(o,name,None,parent)
    o.data.materials.append(b.M['petal_pink']);o.data.materials.append(b.M['petal_blue'])
    for i,p in enumerate(o.data.polygons):p.material_index=0 if pts[i//n][0]<0 else 1
    return o

ribbon('Wide continuous double-heart rail',route,.175,.135,0,track)
for sign in [-1,1]:
    edge=[]
    for i,(x,z) in enumerate(route):
        d=(Vector(route[(i+1)%len(route)])-Vector(route[i-1])).normalized()
        edge.append((x-sign*d.y*.072,-.075,z+sign*d.x*.072))
    b.tube('Pearl rail edge',edge,.009,'white',track,True,3)
bulbs,_=b.resample_closed(outline,60)
for i,(x,z) in enumerate(bulbs):b.sphere('Rail lamp %02d'%i,(x,-.090,z),.039,'white_glow',lights)

HUB=2.75
def grooved_leg(name,foot,top,mat):
    d=Vector(top)-Vector(foot)
    axis=d.normalized()
    across=Vector((axis.z,0,-axis.x)).normalized()
    depth=axis.cross(across).normalized()
    basis=Matrix((across,depth,axis)).transposed()
    # A real re-entrant groove on every corner of a rectangular manufactured profile.
    p=[(-.069,-.072),(.069,-.072),(.069,-.052),(.052,-.052),(.052,-.034),(.088,-.034),(.088,.034),(.052,.034),(.052,.052),(.069,.052),(.069,.072),(-.069,.072),(-.069,.052),(-.052,.052),(-.052,.034),(-.088,.034),(-.088,-.034),(-.052,-.034),(-.052,-.052),(-.069,-.052)]
    v=[tuple(Vector(foot)+basis@Vector((x,y,z))) for z in [0,d.length] for x,y in p]
    n=len(p);f=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
    f.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],f);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);b.finish(o,name,mat,frame,.005,False)
    # Front face inlay with discrete luminous bulbs, aligned to the same leg basis.
    def at(z,x=0,y=-.078):return Vector(foot)+basis@Vector((x,y,z))
    b.beam(name+' neon channel',at(.11),at(d.length-.15),.026,'pink_glow' if mat=='petal_pink' else 'cyan_glow',lights,16)
    for j in range(8):b.sphere(name+' pearl bulb',at(.18+j*(d.length-.39)/7,y=-.095),.029,'white_glow',lights)
    return o

feet=[]
for side,cx,mat in [('left',-.91,'petal_pink'),('right',.91,'petal_blue')]:
    hub=(cx,0,HUB)
    for dx in [-.48,.48]:
        foot=(cx+dx,-.64,.39);rear=(cx+dx,.64,.39)
        grooved_leg(side+' grooved A leg',foot,hub,mat)
        b.beam(side+' rear stay',rear,hub,.057,'white',frame)
        b.beam(side+' floor tie',foot,rear,.026,'white',frame)
        for p in [foot,rear]:
            feet.append(p)
            b.cyl('Anchor lower flange',.139,.050,(p[0],p[1],.358),mat,frame,.014,40)
            b.cyl('Anchor socket',.108,.110,(p[0],p[1],.416),mat,frame,.015,40)
    b.beam(side+' rear crossbar',(cx-.33,.44,1.07),(cx+.33,.44,1.07),.037,'white',frame)
    o=b.cyl(side+' large wheel hub',.355,.22,(cx,-.025,HUB),'white',spokes,.018,96);o.rotation_euler=(math.pi/2,0,0)
    o=b.torus(side+' hub pearl rim',.326,.022,(cx,-.151,HUB),'pale_pink' if cx<0 else 'pale_blue',spokes);o.rotation_euler=(math.pi/2,0,0)
    for a in [0,math.pi/2,math.pi,3*math.pi/2]:b.sphere('Hub fixing',(cx+.305*math.cos(a),-.173,HUB+.305*math.sin(a)),.024,'edge',spokes)
    for i,(x,z) in enumerate(bulbs):
        if i%5==0 and ((x<0)==(cx<0)):
            b.beam('Pearl structural spoke',(cx,.075,HUB),(x,.075,z),.033,'white',spokes,24)
b.beam('Continuous hub-to-hub load beam',(-.91,-.05,HUB),(.91,-.05,HUB),.052,'white',spokes,32)
b.beam('Cupid cantilever',(0,-.05,HUB),(0,-.39,HUB-.10),.035,'white',spokes,24)
assert abs(sum(p[0] for p in feet))<1e-8 and abs(sum(p[1] for p in feet))<1e-8
assert max(math.hypot(p[0],p[1])+.14 for p in feet)<1.875

# Eight stations picked on the one shared route to reproduce the reference silhouette.
targets=[(-2.04,3.0),(-1.14,4.18),(0,3.70),(1.14,4.18),(2.04,3.0),(1.66,2.17),(0,2.14),(-1.66,2.17)]
anchors=[]
for i,target in enumerate(targets):
    x,z=min(route,key=lambda p:math.dist(p,target));anchors.append([x,0,z])
    g=b.gondola(i+1,x,z,pods,'pale_pink' if x<0 else 'pale_blue')
    for child in list(g.children):
        if child.name.startswith('Gondola roof'):
            # Single enamel material, smooth hard-shell canopy: no fabric bands or texture.
            child.data.materials.clear();child.data.materials.append(b.M['white'])
        if child.name.startswith('Cabin lower side panel'):
            child.data.materials.clear();child.data.materials.append(b.M['navy'])

# Compact screen housings fit within the 0.355 m hub radius.
cx=-.91
b.box('Monitor pearl housing',(cx,-.216,HUB),(.49,.13,.385),'pale_pink',devices,.038)
b.box('Monitor blue screen',(cx,-.29,HUB),(.397,.020,.285),'blue',devices,.022)
b.box('Monitor neck',(cx,-.215,HUB-.240),(.075,.07,.095),'white',devices,.012)
b.box('Monitor foot',(cx,-.235,HUB-.293),(.19,.10,.026),'white',devices,.010)
o=b.cyl('Smile emoji',.092,.021,(cx,-.312,HUB),'yellow',devices,.004,64);o.rotation_euler=(math.pi/2,0,0)
for dx in [-.030,.030]:b.sphere('Smile eye',(cx+dx,-.331,HUB+.026),.010,'dark',devices)
b.tube('Smile mouth',[(cx+.054*math.cos(math.pi+j*math.pi/20),-.333,HUB-.006+.035*math.sin(math.pi+j*math.pi/20)) for j in range(21)],.007,'dark',devices)
cx=.91
b.box('Phone pearl housing',(cx,-.216,HUB),(.285,.13,.495),'pale_blue',devices,.040)
b.box('Phone pink display',(cx,-.291,HUB+.008),(.224,.015,.369),'pale_pink',devices,.020)
b.box('Phone earpiece',(cx,-.303,HUB+.215),(.065,.013,.010),'dark',devices,.003)
heart('Phone solid heart',(cx,-.318,HUB+.012),.16,.020,'pink',devices)
b.sphere('Phone home button',(cx,-.296,HUB-.212),.014,'white',devices)

cupid=b.part('link_cupid','丘比特 · 本地候选','本地瓷白雕塑候选，用于检查双轮毂横梁安装位置；待用户选择现成资源后替换。')
from link_cupid_sculpt import build as sculpt_cupid
sculpt_cupid(cupid)
b.beam('Cupid cantilever to shoulder',(0,-.39,HUB-.10),(-.13,-.416,2.58),.031,'white',spokes,24)

route_info={'units':'metres','closed':True,'coordinates':'Blender Z up; front -Y','length':length,'samples':[(x,0,z) for x,z in route],'gondolaCount':8,'anchors':anchors,'status':'Static assembly; animated full-route clearance not validated'}

def deliver():
    source=ROOT/'asset-sources/link/v002';public=ROOT/'public/assets/link/v002'
    source.mkdir(parents=True,exist_ok=True);public.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(source/'source.blend'))
    b.consolidate()
    stats,report=b.geometry_report('link')
    assert all(o['nonFiniteCoordinates']==0 and o['degenerateFaces']==0 for o in report['objects'])
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(public/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
    stats['bytes']=(public/'model.glb').stat().st_size
    record={'name':'业务 × Link','subtitle':'双心连接摩天轮 · 参考比例精修 v002','category':'主体装置','description':'居中双 A 架、加宽双心轨道、八个硬壳吊舱与轮毂设备。','notes':['保留 v001；本地 Blender 结构精修。','静态装配已检查；吊舱沿全轨道运动的净空尚未验证。'],'id':'link','status':'review','modelUrl':'/assets/link/v002/model.glb','source':{'label':'可编辑 Blender · v002','path':'asset-sources/link/v002/source.blend'},'parts':b.PARTS,'stats':stats,'thumbnailUrl':'/assets/link/v002/thumbnail.png'}
    for folder in [source,public,public.parent]:
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    (source/'geometry-report.json').write_text(json.dumps(report,indent=2))
    for folder in [source,public]:(folder/'route.json').write_text(json.dumps(route_info,indent=2))
    (source/'assembly-check.json').write_text(json.dumps({'supportFootprintCenter':[0,0],'feet':feet,'trackWidth':.175,'trackDepth':.135,'hubRadius':.355,'perimeterHearts':28,'gondolas':8},indent=2))
    b.render_preview('link',public/'thumbnail.png')
    shutil.copy2(public/'thumbnail.png',public.parent/'thumbnail.png')
    print('LINK_V002_READY',json.dumps(stats),flush=True)

if __name__=='__main__':deliver()
