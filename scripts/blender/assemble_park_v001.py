"""Editable composition corresponding to the Three.js park; originals unchanged."""
import bpy,json,hashlib,numpy as np
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'asset-sources/park/v001';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
assets={a['id']:a for a in json.loads((ROOT/'public/assets/manifest.json').read_text())['assets']}
layout=[('island',0,0,1),('link',0,-2.15,1.05),('craft',-2.5,1.45,1.18),('carousel',2.55,1.4,.60),('dog',0,2.8,.27)]
records=[]
for id,x,z,scale in layout:
    path=ROOT/'public'/assets[id]['modelUrl'].lstrip('/')
    before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(path));objects=set(bpy.context.scene.objects)-before
    bpy.context.view_layer.update();mins=[];maxs=[]
    for o in objects:
        if o.type!='MESH':continue
        co=np.empty(len(o.data.vertices)*3,dtype=np.float32);o.data.vertices.foreach_get('co',co)
        m=np.array(o.matrix_world);co=co.reshape(-1,3)@m[:3,:3].T+m[:3,3];mins.append(co.min(0));maxs.append(co.max(0))
    lo=np.array(mins).min(0);hi=np.array(maxs).max(0);center=(lo+hi)/2
    group=bpy.data.objects.new('park_'+id,None);bpy.context.collection.objects.link(group)
    for o in objects:
        if o.parent not in objects:
            world=o.matrix_world.copy();o.parent=group;o.matrix_world=world
    if id!='island':
        group.scale=(scale,scale,scale);group.location=(x-center[0]*scale,-z-center[1]*scale,.566-lo[2]*scale)
    group['asset_id']=id;group['source_glb']=assets[id]['modelUrl']
    records.append({'id':id,'model':assets[id]['modelUrl'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'positionXZ':[x,z],'scale':scale,'blenderLocation':list(group.location)})
    print('ASSEMBLED',id,flush=True)
scene=bpy.context.scene
bpy.ops.object.camera_add(location=(.2,-17,12.5));cam=bpy.context.object;target=Vector((0,0,1.7));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.6;scene.camera=cam
for pos,energy,size in [((-4,-7,10),1800,7),((6,5,6),1000,6)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=energy;o.data.size=size;o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(1,1,1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source.blend'))
(OUT/'assembly.json').write_text(json.dumps({'coordinateSystem':'Blender Z up; front -Y. Browser Y up; front +Z.','deckHeight':.566,'assets':records,'dogMotion':'Browser uses Walk_InPlace plus collision-aware routing. Source retains imported rig/clips; autonomous travel is implemented in src/ParkScene.tsx.'},indent=2))
print('PARK_SOURCE_SAVED',str(OUT/'source.blend'),flush=True)
