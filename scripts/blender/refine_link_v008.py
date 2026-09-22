"""Reference canopy textures, under-hub legs, independently editable tinted lenses/eyes."""
import bpy,bmesh,sys,json,math,shutil,numpy as np
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT;src=ROOT/'asset-sources/link/v008';pub=ROOT/'public/assets/link/v008'
src.mkdir(parents=True,exist_ok=True);pub.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/link/v007/source.blend'))
bpy.context.preferences.filepaths.save_version=0
def mat(prefix):return next(m for m in bpy.data.materials if m.name.startswith(prefix))
b.M={'white':mat('Porcelain / cold white'),'gold':mat('V007 champagne'),'skin':b.material('V008 eyelid pink porcelain',(.91,.60,.64),.03,.37),'eye':b.material('V008 warm eye sclera',(.96,.85,.83),.02,.26),'iris':b.material('V008 soft brown iris',(.30,.15,.18),.05,.28),'pupil':b.material('V008 pupil',(.06,.025,.04),0,.24)}
record=json.loads((ROOT/'public/assets/link/v007/parts.json').read_text())
# UV-mapped embedded radial paint textures, aligned to the eight canopy seams.
for side,color in [('pink',(.74,.55,.91)),('blue',(.30,.61,.92))]:
    n=512;yy,xx=np.mgrid[0:n,0:n];angle=np.arctan2(yy-n/2,xx-n/2)%(2*math.pi)
    panel=np.floor(angle/(math.pi/4)).astype(int)%2
    arr=np.ones((n,n,4),dtype=np.float32);arr[:,:,:3]=(.99,.95,.90)
    arr[panel==0,:3]=color
    im=bpy.data.images.new('V008 '+side+' canopy radial paint',width=n,height=n,alpha=True)
    im.pixels.foreach_set(arr.ravel());im.filepath_raw=str(src/f'canopy-{side}.png');im.file_format='PNG';im.save();im.pack()
    m=b.material('V008 '+side+' reference canopy paint',(1,1,1),.08,.26)
    tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im
    m.node_tree.links.new(tex.outputs['Color'],m.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    for o in bpy.context.scene.objects:
        if o.name.startswith('Gondola roof') and ('pink' if o.matrix_world.translation.x<0 else 'blue')==side:
            o.data.materials.clear();o.data.materials.append(m)
            uv=o.data.uv_layers.active or o.data.uv_layers.new(name='Canopy radial UV')
            for loop in o.data.loops:
                v=o.data.vertices[loop.vertex_index].co;uv.data[loop.index].uv=(v.x/.43+.5,v.y/.43+.5)
# Shorten and splay each leg into an independent socket below the hub.
removed=[];adjusted=[]
for o in list(bpy.context.scene.objects):
    if 'floor tie' in o.name:
        removed.append(o.name);bpy.data.objects.remove(o,do_unlink=True);continue
    if not ('grooved A leg' in o.name or 'rear stay' in o.name):continue
    if o.type!='MESH':continue
    cx=-.91 if o.name.startswith('left') else .91
    pts=[o.matrix_world@v.co for v in o.data.vertices]
    sign=1 if sum(p.x-cx for p in pts)>0 else -1
    inv=o.matrix_world.inverted()
    for v,p in zip(o.data.vertices,pts):
        t=(p.z-.39)/(2.75-.39)
        p.x+=sign*.115*t;p.z=.39+(p.z-.39)*(2.37-.39)/(2.75-.39)
        v.co=inv@p
    o.data.update();adjusted.append(o.name)
frame=bpy.data.objects['link_supports']
for cx in [-.91,.91]:
    for dx in [-.115,.115]:b.box('Under-hub leg socket',(cx+dx,0,2.383),(.115,.18,.055),'white',frame,.015)
# Separate red lens surfaces from the original UV-textured sculpture.
model=bpy.data.objects['User cupid with heart sunglasses'];before=model.matrix_world.copy()
uv=model.data.uv_layers.active.data;im=bpy.data.images['texture_diffuse'];w,h=im.size
pixels=np.empty(w*h*4,dtype=np.float32);im.pixels.foreach_get(pixels);pixels=pixels.reshape(h,w,4)
selected=set()
for p in model.data.polygons:
    c=model.matrix_world@p.center
    if not (-.24<c.x<.24 and 2.93<c.z<3.19 and c.y<-.04):continue
    t=sum((uv[i].uv for i in p.loop_indices),Vector((0,0)))/len(p.loop_indices)
    r,g,bl=pixels[min(h-1,int(t.y*h)),min(w-1,int(t.x*w)),:3]
    if r>g*1.7 and r>bl*1.12:selected.add(p.index)
# Keep only the four large connected front/back lens surfaces, not red skin shadows.
edges={}
for i in selected:
    for edge in model.data.polygons[i].edge_keys:edges.setdefault(edge,[]).append(i)
adj={i:set() for i in selected}
for ids in edges.values():
    for i in ids:adj[i].update(ids)
remaining=set(selected);groups=[]
while remaining:
    group=set();stack=[remaining.pop()]
    while stack:
        i=stack.pop();group.add(i)
        for j in adj[i]&remaining:remaining.remove(j);stack.append(j)
    groups.append(group)
selected=set().union(*(g for g in groups if len(g)>250))
assert len(selected)>1000
def subset(mesh,keep):
    bm=bmesh.new();bm.from_mesh(mesh);bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if (f.index in selected)!=keep],context='FACES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bm.to_mesh(mesh);bm.free();mesh.update()
lensmesh=model.data.copy();subset(lensmesh,True);subset(model.data,False)
lenspart=b.part('link_cupid_lenses','透光心形眼镜','独立粉色透光镜片层，原有金色镜框留在丘比特主体。')
eyepart=b.part('link_cupid_eyes','丘比特眼部','镜片后独立眼球、虹膜和粉瓷眼睑，可单独查看。')
lens=bpy.data.objects.new('Cupid separated pink lenses',lensmesh);bpy.context.collection.objects.link(lens)
lens.parent=lenspart;lens.matrix_world=before
glass=b.material('V008 rose transparent lenses',(1,.62,.72),0,.23)
bs=glass.node_tree.nodes['Principled BSDF'];bs.inputs['IOR'].default_value=1.38
bs.inputs['Alpha'].default_value=.24
glass.surface_render_method='DITHERED';glass.use_transparency_overlap=False
lens.data.materials.clear();lens.data.materials.append(glass)
for p in lens.data.polygons:p.material_index=0
# Eye layers sit just behind each original lens; restrained almond silhouettes.
for x,y,z in [(-.074,-.288,3.030),(.105,-.253,3.060)]:
    o=b.sphere('Cupid orbital backing',(x,y+.030,z-.007),1,'skin',eyepart);o.scale=(.086,.022,.081)
    o=b.sphere('Cupid eye socket',(x,y+.018,z),1,'skin',eyepart);o.scale=(.064,.019,.038)
    o=b.sphere('Cupid almond eye',(x,y+.004,z),1,'eye',eyepart);o.scale=(.034,.009,.012)
    o=b.sphere('Cupid iris',(x+.003,y-.006,z),1,'iris',eyepart);o.scale=(.009,.0025,.010)
    o=b.sphere('Cupid pupil',(x+.003,y-.008,z),1,'pupil',eyepart);o.scale=(.004,.0015,.005)
    b.sphere('Cupid eye catchlight',(x-.001,y-.009,z+.003),.002,'white',eyepart)
    for sign in [-1,1]:
        points=[(x+.035*math.cos(t),y-.003,z+sign*.012*math.sin(t)) for t in np.linspace(0,math.pi,25)]
        b.tube('Cupid sculpted eyelid',points,.003,'skin',eyepart,False,2)
record['parts'].extend(b.PARTS)
record.update(subtitle='双心连接摩天轮 · 分片顶棚与透光眼镜 v008',modelUrl='/assets/link/v008/model.glb',thumbnailUrl='/assets/link/v008/thumbnail.png',source={'label':'可编辑 Blender · v008','path':'asset-sources/link/v008/source.blend'})
for p in record['parts']:
    if p['id']=='link_gondolas':p['description']='参考图粉紫／蓝白分片顶棚贴图、金属分缝、珠形吊点、双层栏杆。'
    if p['id']=='link_supports':p['description']='支腿分别接入轮毂下方支座，正视不交叉，已去掉前后落地连接杆。'
record['notes']=['恢复与参考图对齐的顶棚分片贴图，纹理嵌入 GLB。','A 架与后撑上端移至轮毂下方；去掉前后落地连接线。','原模型没有独立镜片部件；按贴图颜色与面部范围提取镜片，新增眼部层，原始百万面文件保留。','保留 v006 丘比特位置及细直梁。']
(src/'revision-check.json').write_text(json.dumps({'removedTies':removed,'adjustedObjects':len(adjusted),'lensFaces':len(selected),'parts':len(record['parts']),'cupidTransformUnchanged':model.matrix_world==before},indent=2))
for folder in [src,pub]:shutil.copy2(ROOT/'asset-sources/link/v007/route.json',folder/'route.json')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
# Bake all manufactured geometry in one operation, then batch by parent/material.
bpy.ops.object.select_all(action='DESELECT')
manufactured=[o for o in bpy.context.scene.objects if o not in [model,lens] and o.type in {'MESH','CURVE','FONT'}]
for o in manufactured:o.select_set(True)
bpy.context.view_layer.objects.active=manufactured[0];bpy.ops.object.convert(target='MESH')
groups={}
for o in bpy.context.selected_objects:
    if o.type=='MESH':groups.setdefault((o.parent.name if o.parent else '',o.data.materials[0].name if o.data.materials else ''),[]).append(o)
for key,group in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:o.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    if len(group)>1:bpy.ops.object.join()
    o=group[0];bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(pub/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
stats,geometry=b.geometry_report('link');stats['bytes']=(pub/'model.glb').stat().st_size;record['stats']=stats
assert all(o['nonFiniteCoordinates']==0 for o in geometry['objects'])
for folder in [src,pub,pub.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(src/'geometry-report.json').write_text(json.dumps(geometry,indent=2))
print('V008_EXPORTED',stats,flush=True)
b.render_preview('link',pub/'thumbnail.png');shutil.copy2(pub/'thumbnail.png',pub.parent/'thumbnail.png')
camera=bpy.context.scene.camera;camera.location=(0,-6,3.03);camera.rotation_euler=(Vector((0,0,3.03))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=.58
bpy.context.scene.cycles.samples=16
for o in bpy.context.scene.objects:
    if o.parent and (o.parent.name.startswith('link_gondola') or o.parent.parent and o.parent.parent.name=='link_gondolas'):o.hide_render=True
bpy.context.scene.render.filepath=str(ROOT/'artifacts/link-v008-eyes.png');bpy.ops.render.render(write_still=True)
