import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
R=Path('/Users/lucas/Desktop/Lucas/lucas-okr-world');O=R/'public/assets/dog/v002';S=R/'asset-sources/dog/v002'
bpy.ops.wm.open_mainfile(filepath='/Users/lucas/Desktop/Lucas/dog-walk/output/dog-walk.blend')
rig=bpy.data.objects['Dog_Walk_Rig'];dog=bpy.data.objects['Dog_Fur_Optimized'];rig.animation_data.action=bpy.data.actions['Walk_InPlace'];rig.location=(0,0,0);bpy.context.scene.frame_set(1)
fur=dog.data.materials[0];fur.name='Soft natural fur';p=fur.node_tree.nodes.get('Principled BSDF')
for key,value in [('Metallic',0),('Roughness',.78),('Coat Weight',0)]:
 for link in list(p.inputs[key].links):fur.node_tree.links.remove(link)
 p.inputs[key].default_value=value
for n in fur.node_tree.nodes:
 if n.type=='NORMAL_MAP':n.inputs['Strength'].default_value=.30
for im in bpy.data.images:
 if im.name=='texture_normal':im.scale(1024,1024);im.pack()
eye=dog.data.materials[1];p=eye.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.11;p.inputs['Coat Roughness'].default_value=.07
# Separate by material while preserving vertex groups and armature modifiers.
bpy.ops.object.select_all(action='DESELECT');dog.select_set(True);bpy.context.view_layer.objects.active=dog
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:o.name='dog_body' if len(o.data.polygons)>1000 else 'dog_eyes'
bpy.ops.object.select_all(action='SELECT');bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(S/'source.blend'))
bpy.ops.export_scene.gltf(filepath=str(O/'model.glb'),export_format='GLB',use_selection=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_apply=False,export_image_format='AUTO',export_extras=True)
r={'id':'dog','name':'小狗 · 散步伙伴','subtitle':'柔和毛发与湿润眼眸 · v002','category':'角色资产','status':'review','description':'7 万面写实小狗，保留毛发纹理与湿润角膜高光。8 秒循环慢步，头部缓慢转向，卷尾间歇轻摇。','source':{'label':'Blender 绑定动画源文件 · v002','path':'asset-sources/dog/v002/source.blend','license':'用户提供模型，本地优化与绑定'},'modelUrl':'/assets/dog/v002/model.glb','thumbnail':'/assets/dog/v002/thumbnail.png','animation':{'defaultClip':'Walk_InPlace','duration':8},'parts':[{'id':'dog_body','name':'毛发与身体','nodeNames':['dog_body'],'description':'保留原有轮廓的 7 万面蒙皮网格，柔和非金属毛发材质。','explodeOffset':[0,0,0]},{'id':'dog_eyes','name':'反光眼部','nodeNames':['dog_eyes'],'description':'保留虹膜纹理，独立低粗糙度角膜高光，跟随头部骨骼。','explodeOffset':[0,0,0]}],'notes':['Walk_InPlace 为原地无缝散步；Walk_Forward 带前进位移，保留在下载文件中。','与上一版使用相同的骨骼、权重和步态；只分离眼部材质网格，不改变几何。','4K 毛色保留，法线降至 1K，移除不适合毛发的金属度贴图。']}
for folder in [O,O.parent,S]:(folder/'parts.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
rig.animation_data.action=bpy.data.actions['Walk_InPlace'];rig.location=(0,0,0);bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
sc=bpy.context.scene;sc.render.engine='BLENDER_EEVEE';sc.render.resolution_x=900;sc.render.resolution_y=900;sc.render.resolution_percentage=100;sc.world.color=(.25,.25,.25)
for loc,power in [((3,-4,5),600),((-3,-2,3),400),((1,3,4),600)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.size=3;l.rotation_euler=(Vector((0,0,.8))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2.5,-3.5,1.9));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.35;sc.camera=cam
sc.render.film_transparent=True;sc.render.filepath=str(O/'thumbnail.png');bpy.ops.render.render(write_still=True)
print('DOG_V002', (O/'model.glb').stat().st_size,flush=True)
