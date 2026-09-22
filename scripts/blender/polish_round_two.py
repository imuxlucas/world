"""Reference-led finishing pass; preserve accepted geometry and prior versions."""
import bpy,sys,math,json,shutil
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import build_asset_parts as b
ROOT=b.ROOT
JOBS={'island':('v008','v009'),'craft':('v002','v003'),'carousel':('v003','v004')}
def color(shader,hex):
    rgb=[int(hex[i:i+2],16)/255 for i in (0,2,4)]
    shader.inputs['Base Color'].default_value=(*[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb],1)
def preview(asset,out):
    scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE'
    scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.88,.92,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
    target=Vector((0,0,{'craft':1.4,'carousel':3.35,'island':.3}[asset]))
    loc={'craft':(5,-9,5.5),'carousel':(8,-12,7.8),'island':(0,-12,11)}[asset]
    scale={'craft':3.9,'carousel':8.1,'island':11.6}[asset]
    bpy.ops.object.camera_add(location=loc);cam=bpy.context.object;cam.name='PREVIEW_CAMERA';cam.data.type='ORTHO';cam.data.ortho_scale=scale;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
    for loc,energy,size in [((3,-7,9),1100,5),((-5,-5,5),650,5),((3,4,8),900,4)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.01));floor=bpy.context.object;floor.name='PREVIEW_FLOOR';floor.data.materials.append(b.material('Preview porcelain white',(.97,.97,.99),rough=.5))
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/'thumbnail.png');bpy.ops.render.render(write_still=True)
    shutil.copy2(out/'thumbnail.png',out.parent/'thumbnail.png')
def run(asset):
    old,new=JOBS[asset];src=ROOT/f'asset-sources/{asset}/{new}';out=ROOT/f'public/assets/{asset}/{new}';src.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'asset-sources/{asset}/{old}/source.blend'))
    record=json.loads((ROOT/f'public/assets/{asset}/parts.json').read_text())
    roots=[bpy.data.objects[p['id']] for p in record['parts']]
    keep=set(roots)
    for o in roots:
        keep.update(o.children_recursive)
        p=o.parent
        while p:keep.add(p);p=p.parent
    for o in list(bpy.context.scene.objects):
        if o not in keep:bpy.data.objects.remove(o,do_unlink=True)
    b.ASSET_OBJECTS=list(keep);b.M={}
    used={m for o in keep if o.type=='MESH' for m in o.data.materials if m}
    for m in used:
        p=m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
        if not p:continue
        name=m.name.lower()
        if asset=='island':
            if any(t in name for t in ['ceramic','porcelain','glitter']):
                p.inputs['Roughness'].default_value=.25;p.inputs['Coat Weight'].default_value=.48;p.inputs['Coat Roughness'].default_value=.17
            if 'ink' in name:color(p,'244f94');p.inputs['Roughness'].default_value=.38
        elif asset=='craft':
            if 'brushed' in name:p.inputs['Roughness'].default_value=.25;color(p,'a3afbf')
            if 'polished' in name:p.inputs['Roughness'].default_value=.12
            if 'screen' in name:p.inputs['Roughness'].default_value=.55;p.inputs['Coat Weight'].default_value=.03
        else:
            if any(t in name for t in ['porcelain','enamel','painted','saddlecloth','tulip','valance']):
                p.inputs['Roughness'].default_value=.23;p.inputs['Coat Weight'].default_value=.55;p.inputs['Coat Roughness'].default_value=.17
            if name.startswith('powder blue enamel'):color(p,'6eafe2')
            if name.startswith('rose enamel'):color(p,'ed8fba')
            if name.startswith('champagne carved mane'):p.inputs['Roughness'].default_value=.3;p.inputs['Coat Weight'].default_value=.28
            if name.startswith('champagne trim'):color(p,'d9a66d');p.inputs['Metallic'].default_value=.66
    additions=[]
    if asset=='craft':
        hardware=bpy.data.objects['craft_hardware'];neon=bpy.data.objects['craft_neon']
        b.M['cut']=b.material('Machined graphite joint',(.11,.15,.20),.65,.32)
        b.M['polish']=b.material('Polished fastener head',(.78,.86,.94),.97,.16)
        b.M['halo']=b.material('Roof recessed cyan halo',(.12,.65,1),.1,.2,3)
        for obj in bpy.context.scene.objects:
            if obj.name.startswith('Roof radial fin'):obj.scale.z*=.55
        for z in [.381,1.491,2.451]:
            for i in range(16):
                a=math.tau*i/16
                b.tube('Precision radial ring joint',[(r*math.cos(a),r*math.sin(a),z) for r in [.903,1.109]],.0018,'cut',hardware)
                if i%2:
                    x,y=1.033*math.cos(a),1.033*math.sin(a)
                    b.cyl('Recessed slotted fastener',.012,.003,(x,y,z+.001),'polish',hardware,.001,16)
                    b.tube('Fastener driver slot',[(x-.006*math.cos(a),y-.006*math.sin(a),z+.003),(x+.006*math.cos(a),y+.006*math.sin(a),z+.003)],.0012,'cut',hardware)
        for r in [.78,.87]:b.torus('Recessed roof halo channel',r,.006,(0,0,2.469),'cut',hardware)
        b.torus('Roof deck cyan inlay',.87,.0035,(0,0,2.473),'halo',neon)
        additions=['48 fine radial joints','24 slotted fasteners','recessed roof halo','lower profile roof fins']
    if asset=='carousel':
        frames=bpy.data.objects['frames'];b.M['heartpink']=b.material('Rose heart charm',(.94,.40,.64),.15,.2);b.M['heartblue']=b.material('Blue heart charm',(.29,.63,.92),.15,.2)
        count=0
        for mobile in [o for o in list(bpy.context.scene.objects) if o.type=='EMPTY' and o.name.startswith('photo-mobile-')]:
            gems=[]
            for o in mobile.children:
                if o.type!='MESH' or not o.data.materials:continue
                p=o.data.materials[0].node_tree.nodes.get('Principled BSDF')
                if p and p.inputs['Transmission Weight'].default_value>.20 and max(o.dimensions)>.12:gems.append(o)
            if not gems:continue
            bead=min(gems,key=lambda o:o.matrix_world.translation.z);pos=bead.matrix_world.translation.copy()
            heart=b.heart_badge('Pastel heart pendant',*pos,.18,'heartpink' if count%2 else 'heartblue',None)
            heart.rotation_euler.z=math.atan2(pos.x,-pos.y);bpy.context.view_layer.update();world=heart.matrix_world.copy();heart.parent=frames;heart.matrix_world=world
            bpy.data.objects.remove(bead,do_unlink=True);count+=1
        additions=[f'{count} enamel heart pendants','stronger blue/pink relief accents','porcelain clearcoat']
    if asset=='island':additions=['porcelain glaze finish','clearer periwinkle math ink','accepted mesh and UV preserved']
    # Convert additions and editable text/modifiers before portable export.
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.convert(target='MESH')
    bpy.ops.file.pack_all()
    scene=bpy.context.scene;scene['polishRevision']=new;scene['reference']='miniature-park-v08-selected.png'
    bpy.ops.wm.save_as_mainfile(filepath=str(src/'source.blend'))
    bpy.ops.export_scene.gltf(filepath=str(out/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    meshes=[o for o in scene.objects if o.type=='MESH'];bad=sum(not all(math.isfinite(c) for c in v.co) for o in meshes for v in o.data.vertices);assert bad==0
    stats={'meshes':len(meshes),'triangles':sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons),'materials':len({m for o in meshes for m in o.data.materials if m}),'bytes':(out/'model.glb').stat().st_size}
    record.update(modelUrl=f'/assets/{asset}/{new}/model.glb',thumbnail=f'/assets/{asset}/{new}/thumbnail.png',stats=stats)
    record['subtitle']={'island':'瓷釉圆盘 · 第二轮细节 v009','craft':'冷银工艺与灯槽 · 第二轮细节 v003','carousel':'蓝粉瓷釉与心形吊饰 · 第二轮细节 v004'}[asset]
    record['source']['path']=f'asset-sources/{asset}/{new}/source.blend';record['source']['label']=f'Blender 可编辑源文件 · {new}'
    record['notes'].append('第二轮按选定参考图优化材质与细部，保留第一轮已确认主体结构。')
    for folder in [out,src,out.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
    (src/'polish-report.json').write_text(json.dumps({'asset':asset,'from':old,'to':new,'changes':additions,'nonFiniteVertices':bad,'stats':stats},ensure_ascii=False,indent=2))
    preview(asset,out)
    print('POLISHED',asset,new,additions,flush=True)
if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else list(JOBS)
    for asset in args:run(asset)
