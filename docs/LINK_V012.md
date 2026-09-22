# Link v012 · 加宽底座与棋盘格圆垫

以 v011 为基础，仅调整底座及其装饰。圆盘半径从 1.97 增至 2.22，直径增加约 12.7%。八个柱脚完整落在平整盘面内，扣除盘边倒角后，最小余量约 0.143；原有轮体、支架、丘比特和吊舱位置保持不变。

移除中心花瓣与花心，换成半径 0.70 的圆形蓝白棋盘格地垫，方格边长 0.175，哑光材质配细蓝包边。外圈粉蓝放射铺装及侧边爱心保留。旧版临时外脚托垫随底座扩大移除。

格纹由圆形裁切的网格和两种 glTF 材质构成，在 Blender 和网页中均可显示。源文件为 `asset-sources/link/v012/source.blend`，网页模型为 `public/assets/link/v012/model.glb`，重建脚本为 `scripts/blender/refine_link_v012.py`。

`base-check.json` 记录全部柱脚的边缘余量、轮体及支架变换保持不变、整圈车厢最低点与盘面的高度间距。网页寻路同步采用扩大后的底座半径，并将两个不可达的后侧漫游点调整到前侧；`check-park-navigation.mjs` 检查所有漫游点间的路径及底座间距。

视觉检查：`artifacts/link-v012-base.png`、`artifacts/link-v012-mat.png`、`artifacts/link-v012-three-quarter.png`。
