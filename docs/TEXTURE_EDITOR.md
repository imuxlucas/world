# 底座贴图编辑器

入口：http://127.0.0.1:5178/#island → 右侧「贴图编辑」。

- 前侧铭牌：`Glitter inscription / glazed ceramic print` 材质。
- 地面花纹：`Mucha glazed ceramic / generated albedo` 材质。
- 宽高为图案相对原贴图的尺寸倍率，100% 为原始大小；UV repeat 等于对应倍率的倒数。
- 偏移为 UV 坐标比例，旋转单位为度，变换中心为 (0.5, 0.5)。原模型边缘采样方式保持不变。
- 开启锁定比例后，两轴按同一倍率变化（范围边界会限幅）。
- 近看铭牌 / 地面会清除独显、隐藏、拆件与自动旋转，以便编辑完整表面。
- 参数自动保存于当前浏览器 localStorage，键为 `lucas-island-texture-v009-v1`。
- 可以复制参数、导出 JSON、查看原始 JSON，或恢复当前贴图默认值。

当前只修改独立资产预览，不修改 GLB 或乐园场景。导出的 JSON 包含两个目标的图案变换和 UV repeat。应用到模型时，使用 Three.js Matrix3.setUvTransform(offsetX, offsetY, 1/scaleX, 1/scaleY, rotation*PI/180, .5, .5)，将结果左乘到原始贴图矩阵，设置 matrixAutoUpdate=false。

验证：TypeScript 与生产构建通过；铭牌 80% 宽 / 120% 高的实时视觉变化、倍率输出、复制参数及刷新恢复均已验证。验证后已还原 100% 默认值。原始文件未改动。

## 已应用的铭牌参数 · 2026-09-22

用户截图确认：宽度 104%、高度 120%、水平偏移 0、垂直偏移 2% UV、旋转 0°。配置位于 `src/islandTexturePreset.ts`，已应用于乐园铭牌，且作为无本地记录时独立编辑器的初始值。地面花纹保持原样。既有本机编辑记录仍优先；恢复当前贴图仍回到原始 100% 映射。
