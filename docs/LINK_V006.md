# 肩前横梁遮挡微调

相对 v005，丘比特前移 0.02、上移 0.06 场景单位；大小、材质及横梁端点不变。仅轮毂之间这根直横梁的半径由 0.052 改为 0.038，粗细减少约 27%。保留身体外侧通向轮毂的可见梁段。

身体中央 15 条正面射线确认雕像在横梁之前。另检查八个直立吊舱的完整几何部件沿 640 段轨迹的保守包围盒扫掠，最小净空下界 0.0232338 场景单位；不涵盖摆动或整机机械安全。

生成：`scripts/blender/refine_link_v005.py --v006`。源文件、模型、证据分别位于 `asset-sources/link/v006/source.blend`、`public/assets/link/v006/model.glb`、`asset-sources/link/v006/clearance-check.json`。

`artifacts/link-v006-front-detail.png` 是正面遮挡诊断近景，渲染时临时隐藏吊舱以便观察；交付模型中所有吊舱保持完整。
