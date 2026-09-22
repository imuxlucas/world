import bpy,json
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/Users/lucas/Desktop/Lucas/lucas-okr-world/asset-sources/link/v003/source.blend')
o=bpy.data.objects['User cupid with heart sunglasses']
pts=[o.matrix_world@v.co for v in o.data.vertices]
for z in [2.35,2.40,2.45,2.50]:
 p=[v for v in pts if abs(v.z-z)<.012 and .09<abs(v.x)<.17]
 print('SHOULDER_SLICE',z,[min(v.y for v in p),max(v.y for v in p)],flush=True)
