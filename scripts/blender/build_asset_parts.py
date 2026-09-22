"""Build deterministic, independently editable OKR park structural assets.

Usage (separate Blender process; does not touch the user's open document):
  Blender --background --factory-startup --python scripts/blender/build_asset_parts.py -- craft link island

Coordinates in source: Z up, front -Y, metres. GLB export converts to Y up.
These are reviewable structural prototypes, not final sculpted art assets.
"""
import bpy
import bmesh
import json
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
TAU = math.tau
PARTS = []
ASSET_OBJECTS = []
M = {}


def material(name, color, metal=0, rough=.3, emission=0, transmission=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    # Palette swatches are sRGB; Blender's shader inputs and glTF factors are linear.
    color = tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in color)
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = .25
    if emission:
        p.inputs['Emission Color'].default_value = (*color, 1)
        p.inputs['Emission Strength'].default_value = emission
    if transmission:
        p.inputs['Transmission Weight'].default_value = transmission
        p.inputs['IOR'].default_value = 1.45
        m.diffuse_color = (*color, .25)
    else:
        m.diffuse_color = (*color, 1)
    m['paletteColorSpace'] = 'linear-from-srgb-v1'
    return m


def reset():
    global PARTS, ASSET_OBJECTS, M
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.context.preferences.filepaths.save_version = 0
    for d in list(bpy.data.materials):
        bpy.data.materials.remove(d)
    PARTS, ASSET_OBJECTS = [], []
    M = {
        'silver': material('Cold silver / brushed structural alloy', (.62,.69,.77), .94, .23),
        'edge': material('Polished silver / bevel', (.85,.9,.98), .98, .14),
        'dark': material('Midnight screen / charcoal navy', (.012,.027,.072), .32, .24),
        'white': material('Porcelain / cold white', (.86,.91,1), .08, .24),
        'pink': material('Dream pink / enamel', (.91,.34,.60), .12, .25),
        'pale_pink': material('Milk pink / enamel', (1,.66,.82), .06, .30),
        'blue': material('Dream blue / enamel', (.23,.56,1), .13, .25),
        'pale_blue': material('Milk blue / enamel', (.59,.77,1), .07, .29),
        'lilac': material('Lavender porcelain', (.68,.58,.88), .08, .30),
        'gold': material('Small warm brass details', (.76,.46,.20), .75, .25),
        'glass': material('Blue architectural glass', (.26,.67,.90), .0, .09, transmission=.78),
        'cyan_glow': material('Cyan light strips', (.12,.68,1), .15, .22, 3.0),
        'pink_glow': material('Pink light strips', (1,.20,.57), .15, .22, 2.7),
        'white_glow': material('Warm white lamp beads', (.85,.96,1), .05, .20, 2.6),
        'ink': material('Periwinkle ink', (.14,.29,.60), .0, .45),
        'yellow': material('Smile yellow', (1,.67,.05), .05, .25),
    }


def part(id, name, description):
    obj = bpy.data.objects.new(id, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = 'PLAIN_AXES'
    obj['partId'] = id
    obj['description'] = description
    ASSET_OBJECTS.append(obj)
    PARTS.append({'id':id, 'name':name, 'nodeNames':[id], 'description':description})
    return obj


def nested(name, parent):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    ASSET_OBJECTS.append(obj)
    return obj


def finish(obj, name, mat, parent, bevel=0, smooth=True):
    obj.name = name
    obj.parent = parent
    if mat:
        obj.data.materials.append(M[mat] if isinstance(mat,str) else mat)
    if obj.type == 'MESH':
        for p in obj.data.polygons:
            p.use_smooth = smooth
    if bevel:
        mod = obj.modifiers.new('Manufactured edge radius', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
    ASSET_OBJECTS.append(obj)
    return obj


def cyl(name, radius, depth, loc, mat, parent, bevel=.012, verts=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc)
    return finish(bpy.context.object, name, mat, parent, bevel)


def cone(name, r1, r2, depth, loc, mat, parent, verts=64):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc)
    return finish(bpy.context.object, name, mat, parent, .006)


def box(name, loc, dims, mat, parent, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o,name,mat,parent,bevel,False)


def sphere(name, loc, radius, mat, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=loc)
    return finish(bpy.context.object,name,mat,parent)


def tube(name, points, radius, mat, parent, closed=False, res=4):
    c = bpy.data.curves.new(name,'CURVE')
    c.dimensions='3D'
    c.resolution_u=1
    c.bevel_depth=radius
    c.bevel_resolution=res
    c.resolution_u=2
    c.use_fill_caps=True
    s=c.splines.new('POLY')
    s.points.add(len(points)-1)
    for p,v in zip(s.points, points): p.co=(*v,1)
    s.use_cyclic_u=closed
    o=bpy.data.objects.new(name,c)
    bpy.context.collection.objects.link(o)
    return finish(o,name,mat,parent)


def beam(name, a, b, radius, mat, parent, verts=24):
    v=Vector(b)-Vector(a)
    o=cyl(name,radius,v.length,(Vector(a)+Vector(b))/2,mat,parent,.005,verts)
    o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
    return o


def torus(name, radius, minor, loc, mat, parent):
    bpy.ops.mesh.primitive_torus_add(major_segments=96, minor_segments=10, location=loc, major_radius=radius, minor_radius=minor)
    return finish(bpy.context.object,name,mat,parent)


def annulus(name, ro, ri, height, z, mat, parent, count=128):
    verts=[]
    for h,r in [(z-height/2,ro),(z-height/2,ri),(z+height/2,ro),(z+height/2,ri)]:
        verts.extend([(r*math.cos(TAU*i/count),r*math.sin(TAU*i/count),h) for i in range(count)])
    faces=[]
    for i in range(count):
        j=(i+1)%count
        faces.extend([(i,j,2*count+j,2*count+i),(count+j,count+i,3*count+i,3*count+j),
                      (2*count+i,2*count+j,3*count+j,3*count+i),(j,i,count+i,count+j)])
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces); mesh.update()
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o)
    return finish(o,name,mat,parent,.008)


def sector(name, radius, start, end, z0, z1, thickness, mat, parent):
    count=16
    v=[]
    for z,r in [(z0,radius),(z0,radius+thickness),(z1,radius),(z1,radius+thickness)]:
        v.extend([(r*math.cos(start+(end-start)*i/count),r*math.sin(start+(end-start)*i/count),z) for i in range(count+1)])
    n=count+1; f=[]
    for i in range(count):
        j=i+1
        f.extend([(i,2*n+i,2*n+j,j),(n+j,3*n+j,3*n+i,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(j,n+j,n+i,i)])
    f.extend([(0,n,3*n,2*n),(count,2*n+count,3*n+count,n+count)])
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(v,[],f);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    return finish(o,name,mat,parent,0,True)


def text(name, body, loc, size, mat, parent, align='CENTER', horizontal=False):
    c=bpy.data.curves.new(name,'FONT');c.body=body;c.size=size;c.align_x=align;c.align_y='CENTER'
    c.extrude=.0008;c.bevel_depth=.0002;c.resolution_u=4
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.location=loc
    if not horizontal: o.rotation_euler=(math.pi/2,0,0)
    return finish(o,name,mat,parent)


def heart_points(sx=1, sz=1, n=128):
    return [(16*math.sin(TAU*i/n)**3*sx, (13*math.cos(TAU*i/n)-5*math.cos(2*TAU*i/n)-2*math.cos(3*TAU*i/n)-math.cos(4*TAU*i/n))*sz) for i in range(n)]


def heart_badge(name, x,y,z, size, mat, parent):
    pts=heart_points(size/32,size/32,64)
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='2D';c.fill_mode='BOTH';c.extrude=.012;c.bevel_depth=.005;c.bevel_resolution=2
    s=c.splines.new('POLY');s.points.add(len(pts)-1)
    for p,(a,b) in zip(s.points,pts):p.co=(a,b,0,1)
    s.use_cyclic_u=True
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.location=(x,y,z);o.rotation_euler=(math.pi/2,0,0)
    return finish(o,name,mat,parent)


def build_craft():
    base=part('craft_base','圆形基座','独立圆底座、入口踏步、环形灯槽。')
    frame=part('craft_structure','环梁与立柱','双层环梁、8 根外柱及后侧斜撑；精确同心对齐。')
    glass=part('craft_glass','分片玻璃','有厚度的弧形玻璃，正面入口和屏幕位置留空。')
    neon=part('craft_neon','霓虹灯带','独立粉蓝发光材质，光源槽与金属分离。')
    core=part('craft_core','中央 AI 光柱','上下贯通的透明光芯、环形机电细节和上层屋顶。')
    screens=part('craft_screens','代码屏幕','可独立替换的深色屏板及代码字形。')
    hardware=part('craft_hardware','工艺细节','外环拼接、检修盒、紧固件和顶部散热片。')
    cyl('Porcelain foundation',1.19,.16,(0,0,.08),'white',base)
    cyl('Floating silver plinth',1.13,.105,(0,0,.20),'silver',base)
    torus('Base cyan groove',1.10,.012,(0,0,.253),'cyan_glow',neon)
    cyl('Interior floor',1.02,.028,(0,0,.263),'pale_blue',base)
    for z in [.32,1.43,2.39]:
        annulus('Machined ring beam',1.12,.89,.12,z,'silver',frame)
        torus('Polished upper lip',1.105,.016,(0,0,z+.056),'edge',hardware)
        torus('Light channel',1.126,.010,(0,0,z-.017),'pink_glow' if z<2 else 'cyan_glow',neon)
    for i in range(8):
        a=TAU*i/8+math.pi/8
        x,y=.998*math.cos(a),.998*math.sin(a)
        beam('Structural column %02d'%i,(x,y,.31),(x,y,2.39),.041,'silver',frame)
        for da,mat in [(-.023,'cyan_glow'),(.023,'pink_glow')]:
            xx,yy=1.045*math.cos(a+da),1.045*math.sin(a+da)
            beam('Recessed column light',(xx,yy,.43),(xx,yy,2.28),.0085,mat,neon,12)
        if y>.01:
            b=a+TAU/8
            beam('Precision diagonal lower',(x,y,.45),(.995*math.cos(b),.995*math.sin(b),1.33),.025,'silver',frame)
            beam('Precision diagonal upper',(x,y,1.54),(.995*math.cos(b),.995*math.sin(b),2.28),.025,'silver',frame)
        # Each panel is a closed thin solid rather than a single-sided sheet.
        if i not in (5,6):
            sector('Lower curved glass %02d'%i,.974,a+.06,a+TAU/8-.06,.405,1.346,.015,'glass',glass)
        if i not in (5,6):
            sector('Upper curved glass %02d'%i,.974,a+.06,a+TAU/8-.06,1.513,2.303,.015,'glass',glass)
        for z in [.38,1.49,2.45]:
            o=cyl('Flush fixing %02d'%i,.019,.008,(1.035*math.cos(a),1.035*math.sin(a),z),'dark',hardware,.003,12)
    # Build small raised floor pads and a completely enclosed central core.
    cyl('Core base',.35,.1,(0,0,.34),'silver',core)
    cyl('Core glass volume',.29,2.31,(0,0,1.54),'glass',core,.012)
    cyl('Core crown cap',.41,.12,(0,0,2.88),'silver',core)
    cyl('Core neck',.365,.51,(0,0,2.565),'glass',core)
    for z in [.46,1.17,1.71,2.45,2.81]:
        torus('Core luminous ring',.303,.013,(0,0,z),'cyan_glow',neon)
    for i in range(12):
        a=TAU*i/12
        beam('Core light rib',(.29*math.cos(a),.29*math.sin(a),.40),(.29*math.cos(a),.29*math.sin(a),2.81),.008,'cyan_glow' if i%2 else 'pink_glow',neon,12)
    for i in range(24):
        a=TAU*i/24
        o=box('Roof radial fin',(.56*math.cos(a),.56*math.sin(a),2.47),(.24,.024,.032),'silver',hardware,.006)
        o.rotation_euler[2]=a
    annulus('Roof open deck',.90,.405,.065,2.428,'silver',core)
    for x in [-.38,.38]:
        box('Entrance upright',(x,-.99,.74),(.07,.11,.80),'silver',frame,.015)
        box('Entrance light seam',(x,-1.055,.75),(.012,.009,.62),'cyan_glow',neon,.003)
    box('Entry step',(0,-1.034,.275),(.61,.24,.08),'silver',base,.025)
    box('Upper code screen frame',(0,-1.025,1.93),(1.27,.105,.56),'silver',screens,.042)
    box('Upper code screen glass',(0,-1.084,1.93),(1.17,.018,.46),'dark',screens,.024)
    text('Craft screen title','<Craft />',(0,-1.097,2.035),.168,'cyan_glow',screens)
    text('Craft screen code','const idea = build();',(0,-1.097,1.843),.084,'white_glow',screens)
    box('Lower code screen frame',(.52,-.909,.85),(.42,.08,.67),'silver',screens,.028)
    box('Lower code screen glass',(.52,-.957,.85),(.36,.014,.59),'dark',screens,.014)
    text('Lower code lines','{\n design:\n   true\n}',(.52,-.969,.86),.079,'cyan_glow',screens)
    text('Entrance bracket icon','</>',(-.45,-1.062,.98),.18,'pink_glow',screens)
    for x in [-.72,.72]:
        box('Utility module',(x,-.69,.50),(.18,.18,.37),'silver',hardware,.022)
        for i in range(4):
            box('Utility status strip',(x,-.787,.415+i*.048),(.11,.012,.012),'pink_glow' if x<0 else 'cyan_glow',neon,.004)
    return {'name':'Code × Craft','subtitle':'冷银代码工坊 · 原创结构拆件 v001','category':'主体建筑','description':'围绕同心环梁、精确立柱与可替换代码屏幕制作的真实几何样品。','notes':['本轮是原创结构与拆件样品，不是选定效果图的最终美术还原。','分片玻璃为有厚度实体；浏览器环境反射及透明排序仍需视觉验收。','字形为可拆的实体几何，后续可换成屏幕贴图降低面数。']}


def inside(pt,poly):
    x,y=pt; result=False
    for i,p in enumerate(poly):
        q=poly[(i+1)%len(poly)]
        if (p[1]>y)!=(q[1]>y) and x < (q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0]:result=not result
    return result


def intersect(a,b,c,d):
    rx,ry=b[0]-a[0],b[1]-a[1];sx,sy=d[0]-c[0],d[1]-c[1]
    cross=rx*sy-ry*sx
    if abs(cross)<1e-10:return None
    t=((c[0]-a[0])*sy-(c[1]-a[1])*sx)/cross
    u=((c[0]-a[0])*ry-(c[1]-a[1])*rx)/cross
    return (t,u) if -1e-8<=t<=1+1e-8 and -1e-8<=u<=1+1e-8 else None


def union_outline(p,q):
    """Polygon boundary union: split crossings, keep only exterior subsegments."""
    retained=[]
    for poly,other in [(p,q),(q,p)]:
        for i,a in enumerate(poly):
            b=poly[(i+1)%len(poly)];ts=[0.,1.]
            for j,c in enumerate(other):
                hit=intersect(a,b,c,other[(j+1)%len(other)])
                if hit:ts.append(max(0,min(1,hit[0])))
            ts=sorted(set(round(t,10) for t in ts))
            for t1,t2 in zip(ts[:-1],ts[1:]):
                if t2-t1<1e-8:continue
                mid=(t1+t2)/2
                point=lambda t:(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
                if not inside(point(mid),other):retained.append((point(t1),point(t2)))
    key=lambda v:(round(v[0],6),round(v[1],6))
    adjacent={}
    for a,b in retained:
        adjacent.setdefault(key(a),[]).append(b);adjacent.setdefault(key(b),[]).append(a)
    current=retained[0][0];start=key(current);previous=None;out=[]
    for _ in range(len(retained)+1):
        out.append(current);opts=adjacent[key(current)]
        nxt=next((x for x in opts if key(x)!=previous),None)
        if nxt is None:raise RuntimeError('Union outline has a disconnected boundary')
        previous,keycurrent=key(current),key(current);current=nxt
        if key(current)==start:break
    if len(out)!=len(retained):raise RuntimeError('Expected exactly one closed exterior route')
    return out


def resample_closed(poly,count):
    lengths=[math.dist(poly[i],poly[(i+1)%len(poly)]) for i in range(len(poly))]
    length=sum(lengths);result=[];seg=0;cum=0
    for i in range(count):
        t=length*i/count
        while cum+lengths[seg]<t: cum+=lengths[seg];seg+=1
        f=(t-cum)/lengths[seg];a=poly[seg];b=poly[(seg+1)%len(poly)]
        result.append(tuple(a[j]+(b[j]-a[j])*f for j in range(len(a))))
    return result,length


def gondola(index,x,z,parent,mat):
    g=nested('link_gondola_%02d'%index,parent)
    g['animation']='Translate along route; preserve world-up orientation'
    y=-.56
    # Suspension goes backwards to the rail, then down onto the complete canopy.
    beam('Gondola rail axle',(x,-.06,z),(x,y,z),.025,'white',g)
    sphere('Bearing', (x,-.15,z),.052,'gold',g)
    beam('Suspension pin',(x,y,z),(x,y,z-.13),.021,'gold',g)
    cone('Gondola roof',.205,.025,.14,(x,y,z-.20),mat,g,32)
    torus('Canopy rim',.201,.016,(x,y,z-.27),'white',g)
    cyl('Closed gondola floor',.19,.045,(x,y,z-.65),mat,g,.012,40)
    cyl('Cabin toe rail',.20,.024,(x,y,z-.673),'white',g,.006,40)
    # Eight uprights all connect roof ring, railing and floor; no missing rear posts.
    for j in range(8):
        a=TAU*j/8
        xx,yy=x+.173*math.cos(a),y+.173*math.sin(a)
        beam('Cabin complete post %02d'%j,(xx,yy,z-.634),(xx,yy,z-.278),.012,'white',g,12)
        # solid translucent lower balustrade for safety + a visible narrow cross-rail
        sector('Cabin lower side panel',.172,a+.055,a+TAU/8-.055,z-.624,z-.505,.01,mat,g)
        o=ASSET_OBJECTS[-1];o.location.x=x;o.location.y=y
    torus('Cabin handrail',.181,.013,(x,y,z-.491),'gold',g)
    cyl('Cabin seat',.114,.028,(x,y,z-.57),'pale_blue',g,.006,32)
    # Place the moving subassembly's pivot on its own rail bearing, preserving
    # every mesh's world transform. Animation can translate this group directly.
    bpy.context.view_layer.update()
    child_worlds=[(child,child.matrix_world.copy()) for child in g.children]
    g.location=(x,-.02,z)
    bpy.context.view_layer.update()
    for child,world in child_worlds:child.matrix_world=world
    g['routeAnchor']=[x,-.02,z]
    g['completePostCount']=8
    return g


def build_link():
    base=part('link_base','圆形共用底座','两颗心的支架共用一个圆形底座；包含独立前后锚座。')
    frame=part('link_supports','双 A 架与后撑','两套可见的 A 形支架、后腿与水平连接梁。')
    track=part('link_track','双心复合外缘单轨','计算两颗同高心形的并集外边界，输出一条闭合行走路径。')
    spokes=part('link_spokes','辐条与轮毂','支撑轨道的固定结构，双轮毂分别承载电脑与手机图形。')
    lights=part('link_lights','轨道与支架灯','粉蓝轨道灯、白色灯珠，与承力结构分层。')
    pods=part('link_gondolas','完整吊舱 × 8','独立子层级；匹配选定图的 8 个吊舱，每个包含地板、座位、8 根柱、围栏和完整顶棚。')
    devices=part('link_devices','电脑与手机','电脑笑脸及手机心形图形；单独可替换部件。')
    ornament=part('link_ornament','底座心形装饰','小型心形浅浮雕；丘比特未在本轮假造，预留独立雕塑阶段。')
    cyl('Unified porcelain platform',1.87,.17,(0,0,.085),'white',base,.025,128)
    cyl('Pink rim',1.79,.07,(0,0,.205),'pale_pink',base,.018,128)
    cyl('Blue white top',1.75,.035,(0,0,.255),'white',base,.012,128)
    torus('Platform lip',1.78,.023,(0,0,.25),'pale_blue',base)
    for i in range(20):
        a=TAU*i/20
        o=heart_badge('Base heart %02d'%i,1.806*math.cos(a),1.806*math.sin(a),.18,.115,'pink',ornament)
        o.rotation_euler=(math.pi/2,0,a+math.pi/2)
    raw=heart_points(.060,.085,240)
    left=[(x-.69,z+3.02) for x,z in raw];right=[(x+.69,z+3.02) for x,z in raw]
    outline=union_outline(left,right)
    route,route_length=resample_closed(outline,480)
    path=[(x,-.02,z) for x,z in route]
    tube('Continuous structural exterior rail',path,.050,'white',track,True,4)
    tube('Rear structural rail',[(x,.16,z) for x,z in route],.033,'white',track,True,3)
    # Two continuous color tubes, not hundreds of touching capped cylinders.
    edge_colors=['pink_glow' if (route[i][0]+route[(i+1)%len(route)][0])/2<0 else 'cyan_glow' for i in range(len(route))]
    start=next(i for i in range(len(route)) if edge_colors[i]!=edge_colors[i-1])
    chain=[];color=edge_colors[start];chain_index=0
    for j in range(len(route)):
        i=(start+j)%len(route);x,z=route[i];nx,nz=route[(i+1)%len(route)]
        if not chain:chain=[(x,-.071,z)]
        if edge_colors[i]!=color:
            tube('Continuous exterior color %02d'%chain_index,chain,.020,color,lights,False,3)
            chain_index+=1;chain=[(x,-.071,z)];color=edge_colors[i]
        chain.append((nx,-.071,nz))
    tube('Continuous exterior color %02d'%chain_index,chain,.020,color,lights,False,3)
    bulbpoints,_=resample_closed(outline,56)
    for i,(x,z) in enumerate(bulbpoints):
        sphere('Rail lamp %02d'%i,(x,-.094,z),.043,'white_glow',lights)
        beam('Track cross tie',(x,-.02,z),(x,.16,z),.022,'white',track,12)
    for side,cx,mat in [('left',-.69,'pink'),('right',.69,'blue')]:
        hub=(cx,.17,2.76)
        for dx in [-.38,.38]:
            foot=(cx+dx,-.035,.30)
            beam(side+' A-frame front leg',foot,hub,.065,mat,frame)
            beam(side+' front luminous inlay',(foot[0],foot[1]-.068,.4),(cx,.095,2.62),.018,'white_glow',lights,16)
            rearfoot=(cx+dx*.75,.64,.30)
            beam(side+' rear support',rearfoot,hub,.045,'white',frame)
            for xx,yy,_ in [foot,rearfoot]:
                cyl('Bolted foot plinth',.12,.10,(xx,yy,.31),mat,frame,.016,32)
            beam(side+' side bracing',foot,rearfoot,.027,'pale_blue',frame)
        beam(side+' A-frame cross member',(cx-.27,-.01,1.04),(cx+.27,-.01,1.04),.035,'white',frame)
        # Individual hub cylinder's axis is the depth direction.
        o=cyl(side+' wheel hub',.26,.26,(cx,.14,2.76),'white',spokes,.02,64);o.rotation_euler=(math.pi/2,0,0)
    # Sparse precise spokes are only decorative internal structure, never another travel loop.
    for i,(x,z) in enumerate(bulbpoints):
        if i%4==0:
            cx=-.69 if x<0 else .69
            beam('Fixed rail spoke %02d'%i,(cx,.16,2.76),(x,.16,z),.024,'white',spokes,16)
    # Even arc-length distribution guarantees the same closed outer path for every pod.
    # A half-slot offset keeps the device screens legible in the frontal composition.
    samples=[route[(41+i*60)%len(route)] for i in range(8)]
    for i,(x,z) in enumerate(samples):gondola(i+1,x,z,pods,'pale_pink' if x<0 else 'pale_blue')
    # Device panels sit before the hubs and after the gondola plane.
    box('Monitor housing',(-.69,-.155,2.76),(.56,.15,.43),'pale_pink',devices,.06)
    box('Monitor luminous display',(-.69,-.240,2.77),(.44,.018,.31),'cyan_glow',devices,.027)
    box('Monitor stand',(-.69,-.17,2.48),(.08,.10,.14),'white',devices,.016)
    box('Monitor foot',(-.69,-.19,2.42),(.26,.17,.035),'white',devices,.016)
    smile=cyl('Smile emoji disc',.112,.018,(-.69,-.257,2.77),'yellow',devices,.004,48);smile.rotation_euler=(math.pi/2,0,0)
    for dx in [-.037,.037]:sphere('Smile eye',(-.69+dx,-.274,2.802),.013,'dark',devices)
    tube('Smile mouth',[(-.69+.065*math.cos(math.pi+t*math.pi/16),-.276,2.765+.046*math.sin(math.pi+t*math.pi/16)) for t in range(17)],.008,'dark',devices)
    box('Phone housing',(.69,-.157,2.76),(.34,.16,.58),'pale_blue',devices,.056)
    box('Phone display',(.69,-.247,2.77),(.264,.018,.444),'white',devices,.023)
    box('Phone speaker',(.69,-.264,3.020),(.075,.013,.009),'dark',devices,.003)
    heart_badge('Phone heart emoji',.69,-.281,2.79,.186,'pink',devices)
    sphere('Phone home button',(.69,-.246,2.51),.017,'white_glow',devices)
    route_info={'units':'metres','coordinates':'Blender source Z up; frontend route maps [x,y,z] to [x,z,-y]','closed':True,'length':route_length,'samples':path,'gondolaCount':8,'gondolaPhase':41/480,'cabinForwardOffset':-.54,'status':'static structural prototype; collision-free animation not yet validated'}
    return {'name':'业务 × Link','subtitle':'双心连接摩天轮 · 原创结构拆件 v001','category':'主体装置','description':'单条双心并集外轮廓轨道、双 A 架、完整吊舱与双设备符号的实体结构样品。','notes':['丘比特雕塑尚未制作；不以粗糙人形占位冒充最终雕塑。','已计算并验证外轮廓为一个闭合无分支边界，均匀采样保存在 route.json。','静态样品的吊舱与支架深度错开；沿全路径的运动净空、机构可制造性仍待后续验证。','灯具按语义分组，可见玻璃及浮雕还需最终美术精修。'],'route':route_info}


def petal_mesh(name,points,mat,parent,z):
    # A flat decal polygon with its own UV-ready mesh: no falsely extruded sculpture.
    v=[(x,y,z) for x,y in points]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],[tuple(range(len(v)))]);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    return finish(o,name,mat,parent,0,False)


def build_island():
    base=part('island_base','圆形岛屿底盘','整体保持真正圆形，原点为圆心，薄圆盘和圆边独立。')
    border=part('island_border','粉蓝边缘','同心浅色包边与细圆环。')
    paving=part('island_paving','放射铺装','独立的粉蓝放射铺装与曲线花瓣图样，尚待最终穆夏纹样精修。')
    mathpart=part('island_math','心形函数图','平面心形函数线、坐标轴和标记，独立可替换。')
    plaque=part('island_plaque','公式铭牌','正面弧形承载区与清晰实体字形，可后续更换矢量贴图。')
    cyl('Island circular ceramic body',5.2,.23,(0,0,.115),'white',base,.055,160)
    cyl('Cold white paving plane',5.05,.032,(0,0,.244),'white',base,.012,160)
    torus('Blue circular inlay',5.08,.018,(0,0,.269),'pale_blue',border)
    torus('Pink outer inlay',5.155,.021,(0,0,.25),'pale_pink',border)
    for i in range(48):
        a=TAU*i/48
        b=a+TAU/48*.61
        pts=[(.32*math.cos(a),.32*math.sin(a)),(4.91*math.cos(a),4.91*math.sin(a)),(4.91*math.cos(b),4.91*math.sin(b)),(.32*math.cos(b),.32*math.sin(b))]
        petal_mesh('Radial paving segment %02d'%i,pts,'pale_pink' if i%2 else 'pale_blue',paving,.263)
    # Large flowing petal outlines rather than thousands of high-poly leaves.
    for i in range(12):
        a=TAU*i/12
        curve=[]
        for j in range(97):
            t=TAU*j/96
            r=3.28+.69*math.cos(t)
            tang=.42*math.sin(t)*(1-.45*math.cos(t))
            curve.append((r*math.cos(a)-tang*math.sin(a),r*math.sin(a)+tang*math.cos(a),.271))
        tube('Art Nouveau petal outline %02d'%i,curve,.012,'pink' if i%2 else 'blue',paving,True,2)
    torus('Inner ornamental ring',2.62,.015,(0,0,.275),'pale_blue',paving)
    # Foreground medallion has calm white ground to keep the math readable.
    cyl('Formula diagram medallion',.86,.012,(0,-3.4,.275),'white',mathpart,.004,96)
    pts=heart_points(.035,.035,160)
    tube('Heart function line',[(x,y-3.38,.286) for x,y in pts],.007,'ink',mathpart,True,2)
    for radius in [.28,.56,.79]:
        for i in range(24):
            a=TAU*i/24
            tube('Polar dashed circle',[(radius*math.cos(a+TAU*j/(24*8)),radius*math.sin(a+TAU*j/(24*8))-3.4,.286) for j in range(6)],.0027,'ink',mathpart,False,1)
    tube('X axis',[(-.91,-3.4,.289),(.95,-3.4,.289)],.004,'ink',mathpart)
    tube('Y axis',[(0,-4.25,.289),(0,-2.49,.289)],.004,'ink',mathpart)
    for a in [0,math.pi/2]:
        x,y=.95*math.cos(a),-3.4+.91*math.sin(a)
        tube('Axis arrow',[(x-.07*math.cos(a-.5),y-.07*math.sin(a-.5),.289),(x,y,.289),(x-.07*math.cos(a+.5),y-.07*math.sin(a+.5),.289)],.004,'ink',mathpart)
    text('X label','x',(1.01,-3.4,.292),.11,'ink',mathpart,horizontal=True)
    text('Y label','y',(0,-2.38,.292),.11,'ink',mathpart,horizontal=True)
    # Subtle front nameplate attaches to rim without changing the circular foundation.
    box('Equation plate',(0,-5.123,.193),(3.28,.078,.24),'white',plaque,.10)
    text('Lucas equation','Lucas = 1/2 Fun + 1/2 Math',(0,-5.168,.193),.147,'ink',plaque)
    return {'name':'Island · 梦核圆盘','subtitle':'圆形铺装与心形函数 · 原创结构拆件 v001','category':'场景底盘','description':'圆形薄底盘、独立粉蓝铺装、心形函数图与公式铭牌。','notes':['本轮花瓣线和放射铺装为可编辑样稿；不是选定图中完整穆夏图案的最终还原。','平面铺装是有意设计的单面贴花几何，QA 中会与实体结构的开边分开记录。','建议后续将平面装饰烘成清晰纹理，保留地面主体的低绘制开销。']}


def consolidate():
    """Bake edge modifiers and batch geometry by immediate semantic parent/material.

    Independent gondola child groups stay independent. Fonts become real geometry.
    This keeps the glTF hierarchy manageable without flattening motion boundaries.
    """
    meshes=[]
    for obj in list(ASSET_OBJECTS):
        if obj.type not in ('MESH','CURVE','FONT'):continue
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH')
        meshes.append(bpy.context.object)
    groups={}
    for o in meshes:
        mat=o.data.materials[0].name if o.data.materials else 'unassigned'
        groups.setdefault((o.parent.name if o.parent else '',mat),[]).append(o)
    for (parent,mat),group in groups.items():
        if len(group)>1:
            bpy.ops.object.select_all(action='DESELECT')
            for o in group:o.select_set(True)
            bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
        o=group[0];o.name=parent+'__'+mat.split(' / ')[0].replace(' ','_')
        # Recalculate outward on all closed manufactured parts. Decal ngons retain up normal.
        bm=bmesh.new();bm.from_mesh(o.data)
        # Font conversion duplicates cap/perimeter vertices; weld only microscopic seams.
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
        bmesh.ops.dissolve_degenerate(bm,dist=1e-7,edges=list(bm.edges))
        bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
        o.data.update()


def geometry_report(asset):
    stats={'meshes':0,'triangles':0,'materials':0,'bytes':0}
    used=set();report=[]
    for o in bpy.context.scene.objects:
        if o.type!='MESH':continue
        stats['meshes']+=1;o.data.calc_loop_triangles();stats['triangles']+=len(o.data.loop_triangles)
        used.update(m.name for m in o.data.materials if m)
        bm=bmesh.new();bm.from_mesh(o.data)
        degenerate=sum(f.calc_area()<1e-12 for f in bm.faces)
        boundary=sum(e.is_boundary for e in bm.edges)
        nonmanifold=sum(not e.is_manifold and not e.is_boundary for e in bm.edges)
        invalid=sum(not math.isfinite(c) for v in bm.verts for c in v.co)
        report.append({'mesh':o.name,'degenerateFaces':degenerate,'boundaryEdges':boundary,'nonManifoldInteriorEdges':nonmanifold,'nonFiniteCoordinates':invalid})
        bm.free()
    stats['materials']=len(used)
    return stats,{'asset':asset,'checks':'Object meshes after modifier application; outward normals recalculated; finite coordinates, face area and edge manifold checks. Separate intersecting solids are deliberate assembly pieces, not boolean-unioned.','objects':report,'limitations':['No global self-intersection solver or full animation collision sweep was performed.','Zero boundary edges does not prove an assembled part has no collision.','Island decals are intentionally single sided; font caps may have open triangulated boundaries depending on font conversion.','Lighting, metal reflection and transparent glass must also be checked in the Three.js viewer.']}


def render_preview(asset, path):
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=32
    scene.cycles.use_denoising=True
    scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.filepath=str(path)
    scene.world.color=(.8,.8,.8)
    scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.88,.93,1,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
    if asset=='craft':target=Vector((0,0,1.42));scale=4.3;camloc=(5,-8,5.5)
    elif asset=='link':target=Vector((0,0,2.13));scale=5.8;camloc=(3,-11,6.0)
    else:target=Vector((0,0,0));scale=12.3;camloc=(6,-10,11)
    bpy.ops.object.camera_add(location=camloc);camera=bpy.context.object;camera.name='PREVIEW_CAMERA'
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=scale;scene.camera=camera
    for name,loc,energy,size,color in [('Studio large key',(2,-5,8),1100,5,(.86,.93,1)),('Pink fill',(-4,-1,4),650,4,(1,.74,.85)),('Cool rim',(2,4,6),1400,4,(.62,.79,1))]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
    # White studio floor is preview-only and excluded from exported asset/source geometry.
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));ground=bpy.context.object;ground.name='PREVIEW_FLOOR';ground.data.materials.append(M['white'])
    scene.view_settings.view_transform='AgX'
    bpy.ops.render.render(write_still=True)
    # .blend retains studio camera/lights for reproducible local inspection, tagged preview only.
    for obj in [o for o in scene.objects if o.name.startswith('PREVIEW') or o.type=='LIGHT']:obj['previewOnly']=True


def deliver(asset,record):
    consolidate()
    source=ROOT/'asset-sources'/asset/'v001';public=ROOT/'public'/'assets'/asset/'v001'
    source.mkdir(parents=True,exist_ok=True);public.mkdir(parents=True,exist_ok=True)
    stats,report=geometry_report(asset)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(public/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    stats['bytes']=(public/'model.glb').stat().st_size
    route=record.pop('route',None)
    if route:
        (source/'route.json').write_text(json.dumps(route,ensure_ascii=False,indent=2))
        (public/'route.json').write_text(json.dumps(route,ensure_ascii=False,indent=2))
    record.update({'id':asset,'status':'review','modelUrl':f'/assets/{asset}/v001/model.glb','source':{'label':'原创 Blender 程序建模 · v001','path':f'asset-sources/{asset}/v001/source.blend'},'parts':PARTS,'stats':stats,'thumbnailUrl':f'/assets/{asset}/v001/thumbnail.png'})
    for folder in [source,public]:
        (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
        (folder/'geometry-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    bpy.ops.wm.save_as_mainfile(filepath=str(source/'source.blend'))
    print('ASSET_READY',asset,json.dumps(stats),flush=True)
    render_preview(asset,public/'thumbnail.png')
    bpy.ops.wm.save_as_mainfile(filepath=str(source/'source.blend'))
    import shutil
    shutil.copy2(public/'thumbnail.png',source/'thumbnail.png')
    print('ASSET_RENDERED',asset,flush=True)


if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['craft','link','island']
    builders={'craft':build_craft,'link':build_link,'island':build_island}
    for asset in args:
        reset();record=builders[asset]();deliver(asset,record)
