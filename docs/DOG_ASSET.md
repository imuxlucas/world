# 小狗 · Asset Studio v002

预览：`http://127.0.0.1:5178/#dog`

模型：`public/assets/dog/v002/model.glb`  
源文件：`asset-sources/dog/v002/source.blend`  
制作脚本：`scripts/blender/refine_dog_v002.py`

本次保留全部 70,000 三角面、16 骨骼与两条动画，不再牺牲脸部轮廓。毛发去除金属感，粗糙度为 0.78，法线强度从 0.55 降到 0.30；4K 毛色不变，法线降为 1K。眼部保持独立的清漆角膜高光，粗糙度稍提高，减少镜面感。眼部按材质拆为独立蒙皮网格，仍共享头部骨骼。

GLB 从 12,540,408 bytes 降至 5,638,876 bytes（减少约 55%）。两条动画为 `Walk_InPlace` 与 `Walk_Forward`。Studio 默认播放原地慢步，提供暂停、时间轴与 0.5 / 1 / 1.5 倍速；保留下载文件中的前进位移动画。动画资产禁用爆炸拆件，支持身体和眼部的显隐与独显。

旧版独立预览与模型保留在 `/Users/lucas/Desktop/Lucas/dog-walk/output`。此次没有改动原有步态、转头与摇尾曲线。
