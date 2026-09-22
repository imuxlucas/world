# 第二轮参考图细节精修

基准：`design/concepts/miniature-park-v08-selected.png`。第一轮确认的构型、铭文布局、木马四肢姿态与代码屏内容继续保留。

| 资产 | 当前版本 | 本轮修改 | 可编辑文件 |
| --- | --- | --- | --- |
| 梦核圆盘 | v009 | 瓷釉清漆与粗糙度；函数图蓝色线条。几何和 UV 不变。 | `asset-sources/island/v009/source.blend` |
| Code × Craft | v003 | 拉丝银与抛光边缘区分；48 条环梁细分缝、24 个带槽紧固件、屋顶凹槽灯环；降低散热片高度。 | `asset-sources/craft/v003/source.blend` |
| Workflow 旋转木马 | v004 | 瓷釉与金色材质统一；提高蓝粉浮雕配色辨识度；12 个下垂珠饰换成心形吊饰。 | `asset-sources/carousel/v004/source.blend` |

三个模型各自保留既有语义分组、旧版文件与来源署名。当前 GLB 均已嵌入材质资源；本轮没有重新生成或改写原贴图。

重建：`scripts/blender/polish_round_two.py`。运行后用 `scripts/assemble-manifest.mjs` 更新资产清单。脚本可以通过 `-- island`、`-- craft` 或 `-- carousel` 分别执行。

各版本源目录中的 `polish-report.json` 记录修改与坐标检查；网页验证记录为 `artifacts/round-two-check.json`，截图为 `artifacts/round-two-<asset>.png`。这些检查不等于完整动画碰撞验证。

### Carousel v005：挂绳与花檐交界修复

12 根挂绳分别按所在角度的花檐下沿缩短上段，顶端接在下沿金属轨道底部；上方两颗珠子重新排列到花檐以下。拍立得、下端心形吊饰及绳子底端高度保持不变。源模型：`asset-sources/carousel/v005/source.blend`，逐根高度检查：同目录 `hanger-clearance.json`。重建脚本：`scripts/blender/fix_carousel_hangers_v005.py`；Three.js 建模入口也同步了挂点计算。
