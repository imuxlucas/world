"""Craft v002: concentric glazing, curved displays and radial hardware."""
import sys, math, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import build_asset_parts as b
import bpy
from mathutils import Vector

b.reset()
record = b.build_craft()
groups = {p['id']: bpy.data.objects[p['id']] for p in b.PARTS}
base, glass, screens, hardware, neon = [groups['craft_'+n] for n in ['base','glass','screens','hardware','neon']]
def remove(o):
    b.ASSET_OBJECTS.remove(o)
    bpy.data.objects.remove(o, do_unlink=True)

for o in list(b.ASSET_OBJECTS):
    if o.parent in [glass, screens] or o.name.startswith(('Utility ', 'Interior floor')):
        remove(o)

# Transparent floor annulus is inset into the silver plinth, not laid over opaque flooring.
remove(bpy.data.objects['Floating silver plinth'])
b.annulus('Floating silver outer plinth',1.13,.96,.105,.20,'silver',base)
b.cyl('Central plinth',.40,.105,(0,0,.20),'silver',base)
b.M['clear'] = b.material('Clear cyan floor glass',(.80,.95,1),0,.055,transmission=1)
b.M['clear'].node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value=1.12
dark=b.M['dark'].node_tree.nodes['Principled BSDF']
dark.inputs['Metallic'].default_value=0
dark.inputs['Roughness'].default_value=.48
dark.inputs['Coat Weight'].default_value=0
b.annulus('Transparent central floor ring',.96,.40,.036,.238,'clear',base)
for r in [.405,.955]:
    b.torus('Glass floor silver seal',r,.009,(0,0,.26),'edge',base)
    b.torus('Glass floor cyan halo',r,.007,(0,0,.268),'cyan_glow',neon)
# Glazing: seven lower bays, with only the front doorway open; eight upper bays.
for i in range(8):
    a=math.tau*i/8+math.pi/8
    for level,z0,z1 in [('Lower',.405,1.346),('Upper',1.513,2.303)]:
        if level=='Lower' and i==5: continue
        b.sector(f'{level} curved glass {i:02}',.974,a+.047,a+math.pi/4-.047,z0,z1,.012,'clear',glass)

def curved_text(name, body, angle, z, size, radius, align='CENTER', offset=0, mat='cyan_glow'):
    o=b.text(name,body,(0,0,0),size,mat,screens,align=align,horizontal=True)
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    for v in o.data.vertices:
        x,y,d=v.co
        a=angle+(x+offset)/radius
        v.co=((radius+d)*math.cos(a),(radius+d)*math.sin(a),z+y)
    return o

def screen(name,angle,width,z0,z1):
    r=1.045
    b.sector(name+' silver frame',r-.022,angle-width/2,angle+width/2,z0,z1,.040,'edge',screens)
    b.sector(name+' dark curved display',r+.020,angle-width/2+.025,angle+width/2-.025,z0+.025,z1-.025,.009,'dark',screens)
    for z in [z0+.026,z1-.026]:
        pts=[(1.078*math.cos(angle-width/2+.028+(width-.056)*i/64),1.078*math.sin(angle-width/2+.028+(width-.056)*i/64),z) for i in range(65)]
        b.tube(name+' luminous edge',pts,.003,'cyan_glow',screens)

screen('Upper code screen',-math.pi/2,1.38,1.62,2.21)
curved_text('Craft title','<Craft />',-math.pi/2,2.035,.16,1.081)
curved_text('Craft code','const idea = build();',-math.pi/2,1.83,.074,1.081,mat='white_glow')
screen('Left bracket screen',-3*math.pi/4,.60,.40,1.31)
curved_text('Bracket icon','</>',-3*math.pi/4,.98,.20,1.081,mat='pink_glow')
screen('Right design screen',-math.pi/4,.65,.65,1.30)
for i,line in enumerate(['{','design: true','}']):
    curved_text('Design line '+str(i),line,-math.pi/4,1.17-i*.17,.077,1.081,align='LEFT',offset=-.265)

# Each module face is parallel to its bay chord; rotate the entire assembly together.
for a in [-3*math.pi/4,-math.pi/4]:
    module=b.nested('Radial utility assembly',hardware)
    module.location=(1.075*math.cos(a),1.075*math.sin(a),0)
    module.rotation_euler[2]=a+math.pi/2
    b.box('Utility housing',(0,0,.49),(.19,.15,.35),'silver',module,.014)
    b.box('Utility dark inset',(0,-.082,.49),(.137,.018,.265),'dark',module,.008)
    # Light elements use a matching transform under the neon semantic group.
    lamps=b.nested('Radial utility lamps',neon)
    lamps.location=module.location;lamps.rotation_euler=module.rotation_euler
    for i in range(5):
        b.box('Utility status strip',(0,-.096,.40+i*.043),(.108,.012,.014),'pink_glow',lamps,.004)

for name in ['cyan_glow','pink_glow']:
    b.M[name].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value=5.5
b.M['glass'].node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.36,.72,.88,1)
b.M['glass'].node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value=.95
for p in b.PARTS:
    if p['id']=='craft_glass':p['description']='上层八片完整弧形玻璃，下层七片，正门独留一格。'
    if p['id']=='craft_base':p['description']='银色基座、中心透明玻璃环与入口踏步。'
    if p['id']=='craft_screens':p['description']='贴近圆周的三块曲面屏；三行 design 代码左对齐。'
    if p['id']=='craft_hardware':p['description']='沿相邻立柱弦平面对齐的检修盒、紧固件与散热片。'
source=b.ROOT/'asset-sources/craft/v002';public=b.ROOT/'public/assets/craft/v002'
source.mkdir(parents=True,exist_ok=True);public.mkdir(parents=True,exist_ok=True)
evidence={'upperGlassPanels':8,'lowerGlassPanels':7,'entranceBay':5,'curvedScreens':3,'displayRadius':1.081,'designLines':['{','design: true','}'],'designAlignment':'LEFT','utilityBayAnglesDegrees':[-135,-45]}
(source/'design-check.json').write_text(json.dumps(evidence,indent=2))
# Keep editable individually named geometry in the source; consolidate only for export.
bpy.ops.wm.save_as_mainfile(filepath=str(source/'source.blend'))
b.consolidate()
stats,report=b.geometry_report('craft')
assert all(o['nonFiniteCoordinates']==0 and o['degenerateFaces']==0 for o in report['objects'])
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(public/'model.glb'),export_format='GLB',use_selection=True,export_extras=True,export_lights=False,export_cameras=False)
stats['bytes']=(public/'model.glb').stat().st_size
record.update(subtitle='冷银代码工坊 · 曲面玻璃与霓虹精修 v002',modelUrl='/assets/craft/v002/model.glb',id='craft',status='review',source={'label':'Blender 可编辑源文件 · v002','path':'asset-sources/craft/v002/source.blend'},parts=b.PARTS,stats=stats,thumbnailUrl='/assets/craft/v002/thumbnail.png',notes=['上层整圈玻璃、下层单格入口，三块曲面代码屏。','本地 Blender 精修，保留 v001；霓虹泛光由网页渲染器呈现。'])
for folder in [source,public,b.ROOT/'public/assets/craft']:
    (folder/'parts.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
(source/'geometry-report.json').write_text(json.dumps(report,indent=2))
b.render_preview('craft',public/'thumbnail.png')
import shutil
shutil.copy2(public/'thumbnail.png',public.parent/'thumbnail.png')
print('CRAFT_V002_READY',json.dumps(stats),flush=True)
