"""Retune carousel colors and aligned UV paint; preserve geometry and animation nodes."""
import bpy, json, hashlib, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'asset-sources/carousel/v006'
OUT=ROOT/'public/assets/carousel/v006'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'asset-sources/carousel/v005/source.blend'))

def snapshot():
    result=[]
    for obj in sorted(bpy.context.scene.objects,key=lambda o:o.name):
        item=[obj.name,obj.parent.name if obj.parent else None,list(sum((tuple(row) for row in obj.matrix_local),()))]
        if obj.type=='MESH':
            h=hashlib.sha256()
            for v in obj.data.vertices:h.update(str(tuple(v.co)).encode())
            for uv in obj.data.uv_layers:
                for loop in uv.data:h.update(str(tuple(loop.uv)).encode())
            item.extend([len(obj.data.vertices),len(obj.data.polygons),h.hexdigest()])
        result.append(item)
    return result

before=snapshot()
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def srgb(c):return c*12.92 if c<=.0031308 else 1.055*c**(1/2.4)-.055
def set_color(shader,hex):
    shader.inputs['Base Color'].default_value=tuple(linear(int(hex[i:i+2],16)/255) for i in (0,2,4))+(1,)

replacement={
  'Painted blue pink ivory roof':bpy.data.images.load(str(SRC/'textures/canopy-paint.png')),
  'Blue pink petal base band':bpy.data.images.load(str(SRC/'textures/base-paint.png')),
}
for name,image in replacement.items():image.name='Vivid v006 '+name;image.colorspace_settings.name='sRGB';image.pack()
changes=[]
used={m for o in bpy.context.scene.objects if o.type=='MESH' for m in o.data.materials if m}
for mat in sorted(used,key=lambda m:m.name):
    p=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if mat.use_nodes else None
    if not p:continue
    name=re.sub(r'\.\d+$','',mat.name)
    old=list(p.inputs['Base Color'].default_value)
    paint=None
    if name in replacement:
        for node in mat.node_tree.nodes:
            if node.type=='TEX_IMAGE':node.image=replacement[name]
        p.inputs['Roughness'].default_value=.34
        p.inputs['Coat Weight'].default_value=.22
        p.inputs['Coat Roughness'].default_value=.24
        p.inputs['Metallic'].default_value=0
        paint='new aligned UV artwork'
    elif name.startswith('Rose enamel'):paint='ef679f'
    elif name.startswith('Powder blue enamel'):paint='369bde'
    elif name.startswith('Rose metallic scalloped rail'):
        paint='e88cae';p.inputs['Metallic'].default_value=.32
    elif name.startswith('Champagne trim'):
        paint='e5b16b';p.inputs['Metallic'].default_value=.48
    elif name.startswith('Blue heart charm'):paint='319de3'
    elif name.startswith('Rose heart charm'):paint='f061a0'
    elif name.startswith('carousel-painted') and not p.inputs['Base Color'].is_linked:
        r,g,b=[srgb(c) for c in old[:3]]
        if max(r,g,b)>.4:
            if b>r*1.12 and b>g*1.05:paint='5aade5'
            elif r>g*1.12 and b>g*1.07:paint='ef82b1'
            elif p.inputs['Metallic'].default_value>.3 and r>g>b:
                paint='e3b173';p.inputs['Metallic'].default_value=.48
    if paint:
        if paint!='new aligned UV artwork':
            set_color(p,paint)
            p.inputs['Roughness'].default_value=.29
            p.inputs['Coat Weight'].default_value=.28
            p.inputs['Coat Roughness'].default_value=.22
        changes.append({'material':mat.name,'from':old,'to':paint})
assert before==snapshot(),'Color revision changed geometry, transforms, hierarchy or UVs'
assert all(x in bpy.data.objects for x in ['base','column','canopy','horses','rods','frames','lights','horse-1','horse-2','horse-3'])
bpy.context.scene['paletteRevision']='carousel-v006: vivid blue/rose enamel and aligned roof paint'
bpy.ops.object.select_all(action='SELECT');bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'source.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
record=json.loads((ROOT/'public/assets/carousel/parts.json').read_text())
record.update(modelUrl='/assets/carousel/v006/model.glb',thumbnail='/assets/carousel/v006/thumbnail.png',subtitle='鲜明蓝粉珐琅与棚顶彩绘 · v006')
record['stats']['bytes']=(OUT/'model.glb').stat().st_size
record['source'].update(path='asset-sources/carousel/v006/source.blend',label='Blender 可编辑源文件 · v006')
record['notes'].append('v006：重绘与16片棚顶对齐的蓝粉奶油色带和底座花瓣；增强彩釉、金饰颜色，调低彩绘面清漆反光。几何、UV和动画层级保持一致。')
for folder in [SRC,OUT,OUT.parent]:(folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
manifest_path=ROOT/'public/assets/manifest.json'
manifest=json.loads(manifest_path.read_text())
manifest['assets']=[record if a['id']=='carousel' else a for a in manifest['assets']]
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(SRC/'palette-report.json').write_text(json.dumps({'from':'v005','to':'v006','geometryUVHierarchyUnchanged':True,'objects':len(before),'changes':changes},ensure_ascii=False,indent=2))
print('PALETTE_READY',len(changes),'materials; geometry/UV/hierarchy unchanged',flush=True)
