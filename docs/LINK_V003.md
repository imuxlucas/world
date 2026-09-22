# 双心连接摩天轮 v003

本版保留 v002 的结构调整，将本地候选丘比特替换为用户提供的粉色心形眼镜、托腮羽翼半身像。

- 输入压缩包：`8aef0c00-7a55-42fa-8eea-1c50c76ae6bf.zip`。
- 两份原始 GLB 完整保留在 `asset-sources/cupid/user-20260921/`；采用 `base_basic_pbr.glb`，保留原始颜色、法线、金属度/粗糙度贴图。
- 网页副本从 1,000,000 三角面简化为 120,000，宽度为 0.98，置于两个轮毂之间。
- 背部支架连接原有轮毂贯通承重梁；通过射线检查支架确实接触雕像。没有添加原模型不具备的弓箭或身体。
- 可编辑源文件：`asset-sources/link/v003/source.blend`，贴图已内嵌。
- 网页资产：`public/assets/link/v003/model.glb`；原 v002 文件保留。
- 再生成：运行 `scripts/blender/integrate_user_cupid_v003.py`，然后运行 `node scripts/assemble-manifest.mjs`。
- 验证：`node scripts/check-link-v003.cjs`，报告和 Three.js 截图位于 `artifacts/link-v003-*`。
