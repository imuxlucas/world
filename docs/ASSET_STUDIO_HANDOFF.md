# 资产工作台 · 本轮交付

## 使用

在项目根目录运行 `npm install`、`npm run dev`，打开 <http://127.0.0.1:5178/>。当前开发服务器只监听本机，没有公开部署。

- 左侧切换或搜索四件独立资产，URL hash 可直达，例如 `/#carousel`。
- 中央 Three.js 画布可拖动旋转、滚轮缩放、右键平移；切换棚拍/梦核灯光、线框及自动旋转。
- 右侧部件可以隐藏或独显；Esc 退出独显。拆件滑杆调整分离距离，重置按钮恢复视角及部件。
- 审阅状态与备注自动保存在当前浏览器 localStorage，可以导出 JSON。它们不是共享数据库，也不会直接改写模型文件。
- 每件 GLB 可从标题旁下载。可编辑 Blender 原文件在 `asset-sources/<id>/<version>/source.blend`；圆盘为 v008（用户已确认），旋转木马为 v003，其余为 v001。

## 实际完成内容

| 资产 | 来源 | 顶层部件 | 现状 |
| --- | --- | --- | --- |
| carousel | 用户确认已获得授权的 Carousel Lamp | 7 | v003：加高波浪花檐、独立浮雕、珍珠和彩灯；木马头脸、鬃毛与抬腿姿态精修 |
| craft | 本地 Blender 原创建模 | 7 | 银色双环、立柱/斜撑、分片玻璃、霓虹、代码屏幕等可拆结构初稿 |
| link | 本地 Blender 原创建模 | 8 | 双心并集单轨、双 A 架及后撑、8 个完整吊舱、设备屏幕；丘比特待独立制作 |
| island | 本地 Blender 建模 + imagegen 铺装贴图 | 4 | v008：0.24m 凸起、平整铺装、凹面圆角、无描边闪粉铭文 |

以上是可检查的拆件资产，不是最终艺术验收后的成品。场景总组装与 OKR 弹窗还未开始；本轮网页专用于资产管理和单体预览。

所有模型都保留源文件。原始及中间参数可在 `scripts/blender/build_asset_parts.py`、`src/assets/carousel/` 和 `scripts/carousel/` 继续修改。本轮没有提交 Lux3D、Rodin 或 Tripo 的付费生成任务。

Blender 原文件：[旋转木马 v003](../asset-sources/carousel/v003/source.blend)、[Craft](../asset-sources/craft/v001/source.blend)、[Link](../asset-sources/link/v001/source.blend)、[圆盘 v008](../asset-sources/island/v008/source.blend)。网页发布文件与 `.blend` 母版分开保存。

## 版本与来源

- 选定美术基准：`design/concepts/miniature-park-v08-selected.png`。
- Carousel 上游 commit：`15cceb3a7f26467f807e370a727ffd77757d0ef2`。
- 作者：咕噜蛋Daria，原项目 <https://github.com/Daria1216/carousel-lamp>。
- 用户授权陈述与修改边界见 `CAROUSEL_AUTHORIZATION.md`；原许可证保留在工作台公开资产目录，网页可见署名与项目链接。
- 本地模型制作基于 aholo/Lux3D 技能中允许的 Blender 本地流程；未伪造云端任务记录。

## 数据与验证

`public/assets/manifest.json` 是网页资产清单；从各资产 `parts.json` 汇总：

```sh
node scripts/assemble-manifest.mjs
npm run build
```

汇总脚本读取真实 GLB，核对部件名称是否存在，并统计 mesh、三角面、材质和文件体积，记录到 `artifacts/asset-validation.json`。

已执行实际 Chrome / WebGL 单体预览，检查四件模型加载、27 组部件命名对应、独显/显隐、拆件、线框、灯光、搜索、审阅记录刷新保留和手机宽度布局。见 `artifacts/studio-browser-check.json`，截图在 `artifacts/studio-*.png`。该自动化使用软件 WebGL 验证功能，不作为展示设备上的帧率测试。

旋转木马 GLB 已重新导入 Blender，238 个 mesh、7 个语义组和嵌入纹理均保留；检查未发现非有限顶点或近零面积面，见 `asset-sources/carousel/v001/import-report.json`。其他模型的几何报告随源文件保留。几何局部检查不等于完整动画轨迹和装配碰撞检查，后续实际动效制作时继续验收。

## 下一步

地面 v008 已获用户确认。旋转木马 v002 已完成本轮蓝粉瓷彩修改，等待视觉确认；后续精修 Craft 的金属/玻璃，丘比特作为独立资产制作。确认后才将四件资产组装到最终 Three.js 场景，保留独立文件与场景布局配置。

## 圆盘 v002（2026-09-21）

- 源脚本：`scripts/blender/refine_island_v002.py`；原 v001 未覆盖。
- 半径仍为 5.2，厚度从 0.23 改为 0.56。铭牌前曲面半径 5.274、背面 5.129，与圆盘实体相交贴合。字形转换为曲面网格，公式为 `Lucas = ½ Fun + ½ Math`。
- 铺装贴图：`public/assets/island/v002/mucha-ceramic-basecolor.png`，实际输出 1254 × 1254；GLB 和 Blender 源文件都嵌入贴图。生成提示与来源在 `design/textures/island-v002-floor.prompt.md`。
- 釉面由底色纹样与真实 PBR 粗糙度、清漆层共同呈现；没有将场景灯光烘进贴图。函数图仍为独立部件。
- 定向验证：`node scripts/check-island-v002.cjs`。几何报告检查了退化面、非有限坐标、内部非流形边与实体开边；单面铺装圆周的开放边界是预期的。

## 圆盘 v003（2026-09-21，结构纠正）

- 前缘凸起属于底盘自身的一个连续闭合网格，普通面高 0.56、中央高 0.88；正视为梯形肩部，内侧坡面连接铺装。
- 删除独立铭牌实体、铭牌边框与立体公式字。公式和粉蓝新艺术花纹由 `scripts/make-island-face.cjs` 生成精确 SVG 与 PNG，直接作为底盘侧面材质；不叠放贴花几何。
- 心形曲线改为标准尖底三角函数爱心，替换圆底心脏线。
- 4 个语义组：一体底盘、随形包边、铺装、函数图。v001/v002 保留；当前模型 `public/assets/island/v003/model.glb`。
- 重建：先 `node scripts/make-island-face.cjs`，再后台 Blender 运行 `scripts/blender/refine_island_v003.py`。
- 验证：`scripts/blender/check_island_v003.py` 检查底盘连通性及公式材质归属；`scripts/check-island-v003.cjs` 验证网页加载、双纹理嵌入和部件控制。

## 圆盘 v004（已选贴图应用）

- 用户确认的铭牌图原样复制至 `public/assets/island/v004/front-inscription.png`，保留原始 2172×724 像素和字形比例。图案位置使用等比例 UV 映射，不横向拉伸。
- 从原图读取粉色外描边的上下轮廓数据，保存于 `asset-sources/island/v004/inscription-contour.json`，仅测量图片，没有修改图片内容。上沿追随该轮廓，外侧留边 0.044，真实凹槽深度 0.036。
- 抬升仅限半径 5.08–5.20 的外缘；圆盘平面沿用已选铺装，不再向内形成坡面或涟漪。凹槽是同一闭合底盘网格的凹入表面，没有附加铭牌实体。
- 重建脚本：`scripts/blender/refine_island_v004.py`。定向验证：`scripts/blender/check_island_v004.py`、`scripts/check-island-v004.cjs`。报告在 `artifacts/island-v004-*.json`。

## 圆盘 v005（平滑与厚度修正）

- 上沿改为解析圆角梯形函数，中央上底宽 3.96m、下底约 4.92m，转角使用五次平滑曲线；不再把贴图像素轮廓直接转换为几何，因此没有像素抖动造成的折面。
- 凸起从半径 5.20 向圆心延伸至 4.48，进深 0.72m；仅正前方局部抬升，并以一段单调坡面回到高度 0.56 的平地。
- 凹槽深度 0.038m。贴图保持原始宽高比，缩至凹面宽度约 90.6%，四周形成更清楚的瓷白留边。
- 重建脚本：`scripts/blender/refine_island_v005.py`。几何检查确认底盘为一个连通闭合实体、内侧平面高度变化为 0、坡面单调连续；网页检查确认 GLB、两张嵌入贴图、部件独显和重置均正常。

## 圆盘 v006（紧凑直背修正）

- 凸起进深由 0.72m 收回至 0.32m。中央主要高度在 0.006m 的水平距离内落下，形成近垂直后缘；上下交线各以约 0.008m 的小圆角衔接。
- 圆盘半径 4.87m 以内保持完全平整，避免继续侵占放射铺装。
- 左右凹槽圆角宽度由 0.050m 收紧至 0.018m；上下圆角保持 0.050m，使两侧凹陷边界更清楚。
- 贴图相对原始布置分别缩放：宽度 96%、高度 92%，未修改源图片内容。
- 重建脚本：`scripts/blender/refine_island_v006.py`。几何与网页验证结果在 `artifacts/island-v006-topology.json` 和 `artifacts/island-v006-check.json`。
