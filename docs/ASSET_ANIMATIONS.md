# 三主体运行时动画

入口：`http://127.0.0.1:5178/#park`。动画默认播放，尊重系统“减少动态效果”偏好；选中场景后按空格键统一暂停或继续，切到后台时停止推进。单模型页 `#link`、`#carousel`、`#craft` 也接入相同动画，并提供播放、进度和速度控制。拆件时暂停主体动画，便于检查。

## 摩天轮

使用当前 Link 模型同版本的 `route.json`（v012 沿用 v011 路径），将 Blender Z-up 坐标转换为 Three.js Y-up。直接在 640 个原始路径采样点之间按弧长插值，不重新拟合双心轮廓。由正面投影的有向面积判断方向，八个车厢沿双心复合外缘顺时针行进，一圈 48 秒。

以统一起始相位将轨道弧长八等分，静态模型与运行时起点一致，车厢间隔约 1.4682 模型米。保留吊点前后偏移，只平移完整车厢组，车厢始终直立。轨道、支架、轮毂设备和丘比特保持固定。

## 旋转木马

动画参考咕噜蛋Daria 的 [carousel-lamp](https://github.com/Daria1216/carousel-lamp) 中 `lib/carousel-motion.ts` 与 `lib/carousel-scene.ts`：缓慢起转、稳定后约 28 秒一圈、三匹木马错相位上下起伏。复用原项目的负 Y 旋转方向。木马、吊杆和照片组共同旋转，底座、中心柱、顶棚与灯环固定。

本地 v005 挂绳已缩短，因此摆动轴重新定位到实际绳顶。12 个后加的心形吊饰分别归入对应挂绳；绳顶随波浪花檐下沿调整高度，轻微摆动时仍保持连接。单匹木马起伏幅度为上下 0.1 模型米，相框摆角不超过 0.03 弧度。

来源署名和原许可保留在页面及 `public/assets/carousel/LICENSE.txt`，已有授权记录见 `docs/CAROUSEL_AUTHORIZATION.md`。

## Craft 工坊

中央光柱的 12 根纵向灯管与 5 个光环自转，24 秒一圈；外墙和屏幕固定，实体代码保留循环流光，粉蓝霓虹每 6 秒轻微呼吸。光柱内增加透明底人物视频，脚底贴合光柱底盘，随视角绕竖直轴转向，带轻微点阵与扫描线。人物段静音循环 20 秒，播放、暂停、倍速和进度控制与场景同步。详见 `docs/CRAFT_HOLOGRAM.md`。

## 实现与验证

`src/assetMotion.ts` 统一处理轨道、旋转木马、代码流光及时间控制；`ParkScene.tsx` 与 `Viewer.tsx` 复用。组合场景按 20 Hz 请求阴影更新，使阴影跟随移动部件，暂停时停止更新。

- `npm run build`：TypeScript 与生产构建。
- `node scripts/check-asset-motion.cjs`：加载实际 GLB，检查一圈 961 组车厢姿态、方向、路径误差、直立、闭合与底座高度；检查两圈木马起伏、固定结构、挂绳连接及材质清理。
- `node scripts/check-animated-park.cjs`：浏览器验证三个主体推进、空格暂停/继续、小狗同步暂停、移动端、单模型进度/速度/复位、减少动态效果及无控制台错误。

报告：`artifacts/asset-motion-check.json`、`artifacts/animated-park-check.json`。最新截图保存在 `artifacts/animated-*.png`。

动画在网页运行时计算，下载的 GLB 包含独立车厢和静态起始姿态，不包含网页运行时动画。Link v011 的结构调整和几何检查见 `docs/LINK_V011.md`。
