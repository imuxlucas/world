# Craft 内圈自转与人物全息

`src/assetMotion.ts` 将中央光柱的 12 根纵向灯管与 5 个光环挂到独立旋转组，24 秒一圈。外墙灯槽、代码屏幕、金属结构保持原位，原有代码流光与灯光呼吸继续播放。

`src/craftHologram.ts` 在光柱底盘表面（模型 Y=0.391）放置人物影像，身高 1.8，保持源视频比例。影像按相机方向绕竖直轴转向，脚底始终在相同高度；透明像素不写深度，不产生矩形投影。添加轻微蓝紫色、点阵、扫描线和稀疏上升光点。内管径在屋顶现有开口内扩展，确保转身时的手臂也能显示。

视频由用户提供的 `aespa 에스파 'Whiplash' ae-WINTER _ Whiplash Universe.mp4` 制作，原件保存在 `asset-sources/craft/hologram/original.mp4`。取前 20 秒人物段，排除黑底片尾，移除白背景和鞋底以下的地面倒影。循环播放默认静音，跟随乐园暂停、单模型播放速度与进度；页面隐藏时暂停，销毁场景时释放视频、纹理、材质和事件监听。

`scripts/prepare-craft-hologram.py` 以逐帧遮罩处理白底，保留被人物轮廓包围的金属高光。输出 H.264 的左 RGB / 右 alpha 布局，两者使用同一视频帧，避免双视频不同步，并兼容不支持透明视频编码的浏览器。文件在 `public/assets/craft/hologram/`，来源、裁切与时长见 `video.json`。预处理使用系统 FFmpeg、Python NumPy 和临时目录 `/tmp/codex-craft-video-deps` 中的 OpenCV，不增加网页依赖。

网页运行时加载动画、透明视频和点阵效果；原 Craft v003 GLB 和 Blender 源模型保留。相关逻辑同时用于完整乐园与单模型页。

验证：`scripts/check-craft-hologram.cjs` 检查真实 GLB 的内圈部件、固定结构、贴地高度、四个方位的透明人物轮廓和宽度一致性、视频播放/暂停/倍速与退出清理。截图位于 `artifacts/craft-hologram-*.png`，结果为 `artifacts/craft-hologram-check.json`。
