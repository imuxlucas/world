# 冷银代码工坊 v002

保留 v001；本轮按用户参考图精修。网页入口：http://127.0.0.1:5178/#craft。

- 基座加入独立透明玻璃环，内外银色密封圈与青色灯槽。
- 上层八片玻璃闭合一圈，下层七片，仅正门 bay 5 留空。
- 三块深色曲面屏及实体字形沿圆周弯曲；补齐左侧 `</>` 屏。
- 右侧代码分为 `{`、`design: true`、`}` 三行，共用左边界。
- 两个检修盒及灯条分别朝向 -135°、-45°，与相邻立柱之间的弦平面对齐。
- 增强模型粉蓝自发光；Viewer.tsx 为 craft 单独启用泛光并调整曝光和初始视角。

源文件：`asset-sources/craft/v002/source.blend`，保留分别命名的可编辑对象。
模型：`public/assets/craft/v002/model.glb`，导出时按材质及语义组批处理。
重建：后台 Blender 运行 `scripts/blender/refine_craft_v002.py`，随后运行 `node scripts/assemble-manifest.mjs`。
检查：`scripts/check-craft-v002.cjs`；源目录含几何报告和结构参数记录。建模完全在本地 Blender 完成。
