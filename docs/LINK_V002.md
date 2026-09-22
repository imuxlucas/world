# 双心连接摩天轮 v002

入口：http://127.0.0.1:5178/#link。v001 保留。

## 本轮结构修改

- 前后脚点 y = ±0.64，双轮毂 x = ±0.91；八个脚点的平面中心位于底座圆心，锚座完整落在台面内。
- 前支腿开叉半宽 0.48，使用四角有实际凹槽的型材，附独立霓虹槽与灯珠。
- 双心轮廓按参考图重画为一条闭合外轨；截面宽 0.175、深 0.135，左右粉蓝、白色包边。
- 八个吊舱采用纯白光滑硬壳顶棚、深蓝围栏，保留各自挂点和世界竖直朝向。
- 设备尺寸收进半径 0.355 的轮毂；手机心形使用封闭三角扇实体，修正凹形填充伪影。
- 底座侧壁有 28 个尺寸 0.187 的凸起心形，围绕圆周径向排列。
- 两个轮毂之间加入连续承重梁和中央悬臂。

## 丘比特状态

用户提出寻找现成资源。本地制作的瓷白雕塑仅标为“丘比特 · 本地候选”，尚未定稿；模型中可单独隐藏或替换，不能将此版本称为现成第三方资源。

已找到的资源页面（2026-09-21，均未购买或下载）：

- CGTrader 免费 OBJ：https://www.cgtrader.com/free-3d-models/character/fantasy-character/cupid--2 。已看预览；造型粗糙，无弓箭，和目标差距较大。
- Cults Angel Cupid / DavidG7：https://cults3d.com/en/3d-model/art/angel-cupid-3d-model 。检索页标为免费 OBJ/STL，CULTS PU；浏览器当前无法连接，尚未确认文件与适用许可。
- CGTrader cggold 高精度雕塑：https://www.cgtrader.com/3d-models/character/child/high-poly-of-a-valentine-day-angel-sculpture-not-for-printing-43f6910e-c77f-464c-9791-abbcfe280b7a 。详情页显示 $35、Royalty Free、OBJ/FBX/MAX；已看预览，卷发和羽翼较接近，仍需改姿势和添弓箭。列表促销价格可能不同，以购买页面为准。
- Cults Cupid Angel Statue Bow and Arrow：https://cults3d.com/en/3d-model/art/cupid-angel-statue-bow-and-arrow 。检索页标价 $19，含 blend/FBX/OBJ/STL；页面访问受限，尚未核实文件、实物外观及许可。

源文件：`asset-sources/link/v002/source.blend`，GLB：`public/assets/link/v002/model.glb`。
重建脚本：`scripts/blender/refine_link_v002.py`；本地雕塑脚本：`scripts/blender/link_cupid_sculpt.py`。
建模脚本执行脚点中心和边界断言，并生成几何报告。完整运动净空未验证。
