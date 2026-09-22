# Lucas OKR World

网站：<https://imuxlucas.github.io/world/> · GitHub：<https://github.com/imuxlucas/world>。推送到 `main` 后自动部署，详见 [发布与维护](docs/GITHUB_PAGES.md)。

个人 OKR 沙盘网站。已完成完整乐园、独立资产工作台，以及三个 O / 九个 KR 的演讲详情视图。

**OKR 演讲视图**：点击旋转木马（O1）、双心摩天轮（O2）或金属楼（O3），模型在左侧独立展示，右侧滑入包含目录、大幅案例区与完整 OKR 的内容模块。打开 <http://127.0.0.1:5178/#park>；交互说明与素材接入方法见 [OKR 演讲视图](docs/OKR_PRESENTATION.md)。

摩天轮当前版本 **Link v012**：底座加宽约 13%，完整包住柱脚，中心花饰换为蓝白棋盘格圆垫；保留共面轮体、镜像斜撑与八舱等弧长动画。见 [底座修正](docs/LINK_V012.md)、[结构修正](docs/LINK_V011.md) 与 [三主体动画](docs/ASSET_ANIMATIONS.md)。总场景预览：<http://127.0.0.1:5178/#park>。

最新第二轮细节版本：圆盘 **v009**、Craft **v003**、旋转木马 **v004**。修改清单与源文件位置见 [第二轮精修记录](docs/ROUND_TWO_POLISH.md)，资产清单中的 `modelUrl` 为当前生效版本。

## 运行资产工作台

```sh
npm install
npm run dev
```

打开 <http://127.0.0.1:5178/>，逐件预览旋转木马、Craft 楼、双心摩天轮与圆盘，支持 26 组部件显隐/独显、拆件、线框、灯光切换和本地审阅记录。每件均有真实 GLB 和可编辑 Blender 文件。详情、来源授权和验证说明见 [本轮交付](docs/ASSET_STUDIO_HANDOFF.md)。

圆盘已更新为 **v008**：保留 0.24m 凸起和平整铺装，凹面四角增加 0.16m 圆角；去掉铭文外框，文字与花纹加入细碎闪粉贴图和清漆反光。直接打开 <http://127.0.0.1:5178/#island>；源文件 `asset-sources/island/v008/source.blend`，旧版保留。

圆盘 v008 已获用户确认。旋转木马更新为 **v003**：加高波浪花檐、独立浮雕花饰、金属双轨、珍珠彩灯；木马增加额前鬃毛、大眼睛、渐细鼻梁与错位抬腿。预览 <http://127.0.0.1:5178/#carousel>；源文件 `asset-sources/carousel/v003/source.blend`；复用 v002 蓝粉贴图，旧版保留。

构建命令：`npm run build`。资产清单更新：`node scripts/assemble-manifest.mjs`。本轮资产仍待逐件美术精修，未提交云端模型生成任务。

核心目标：用 Lucas 喜欢的审美和交互介绍自己，让三个核心实体清楚承载 Code × Craft、业务 × Link、AI-Native × Workflow。

完整方案见 [项目方案](docs/PROJECT_PLAN.md)。已确认首版用于两天后的 15 分钟对齐会：一个微缩景观、三个主体、三个详情弹窗。内容名义周期为 2026 H2，实际执行窗口为 10—12 月。文中的美术方向和实体映射为首轮建议。

**当前锁定美术基准：[用户选定的 v08 第一张蓝粉版](design/concepts/miniature-park-v08-selected.png)**，对应原文件 exec-ab6db055-2009-4915-a9fb-11b5ff261b8a.png。后续两张轮廓修改图不作为建模基准。[独立资产建模计划](docs/ASSET_PRODUCTION_PLAN.md)已进入本地 Blender 制作与逐件预览阶段；未提交云端模型生成任务。

首张整场概念图已生成：[微缩乐园 v01](design/concepts/miniature-park-v01.png)，[生成提示词与参考记录](design/concepts/miniature-park-v01.prompt.md)。本轮加入心连心轮缘、丘比特、局部穆夏装饰，以及金属和充气材质对比。

针对首版细节过多的反馈，新增 [三版精简对比 v02](design/concepts/COMPARISON-V02.md)：A 冷银酸性、B 粉白充气、C 蓝白梦核。原图与每版完整提示词均保存在 design/concepts 中，尚未选定最终方案。

最新概念：[v03 白色世界与数学铺装](design/concepts/miniature-park-v03-white-world.png)，[完整提示词](design/concepts/miniature-park-v03-white-world.prompt.md)。按用户新要求改为 1:1、白色世界、无植物、穆夏风格地面，加入心形函数图与 Lucas 公式，冷银酸性金属集中于 Craft 建筑。8 张新参考已归档到 design/references/v03/；图像尚待用户反馈。

进一步迭代：[v04 修长主体与双心轨道](design/concepts/miniature-park-v04-slender-double-heart.png)，[完整提示词](design/concepts/miniature-park-v04-slender-double-heart.prompt.md)。v03 地面已获用户认可；本轮延续该地面方案，将 Craft 楼改为更修长的代码霓虹建筑，木马抬高并悬挂拍立得照片，摩天轮改为两条交叉的大心形轨道与传统吊篮，保留丘比特。主体增加粉蓝色，新图仍待反馈。

已选定摩天轮基础方案：[v05 A · 轻交叠双支架](design/concepts/miniature-park-v05-a-light-overlap.png)。两颗心同高对齐，各有独立支架。[三方案对比](design/concepts/COMPARISON-V05.md)作为迭代记录保留。

最新概念：[v06 复合外缘单轨与多端符号](design/concepts/miniature-park-v06-union-track-devices.png)，[完整提示词](design/concepts/miniature-park-v06-union-track-devices.prompt.md)，[可见结构检查](design/concepts/miniature-park-v06-QA.md)。用户已指定车厢走双心复合图形的单条外边界轨道，左心电脑笑脸、右心手机爱心。三底座中心的精确等边坐标已记录在 [布局规范](design/layout/v06-equilateral-layout.json)，后续搭建 3D 场景时使用；当前效果图不能代替精确摆位或网格检查。

最新布局修正：[v07 圆形底座](design/concepts/miniature-park-v07-circular-bases.png)，[完整提示词](design/concepts/miniature-park-v07-circular-bases.prompt.md)。大岛与三个独立底座均为圆盘，摩天轮两副 A 架共用同一个圆形底座。[精确俯视图](design/layout/v07-circle-layout.svg)与[布局数据](design/layout/v07-circular-layout.json)定义三个小底座圆心位于同心圆上，相隔 120°；斜视效果图是该布局的外观近似，以俯视图及坐标作为后续建模摆位依据。

后续在资产工作台逐件确认并精修模型，再组装总场景和真实 OKR 弹窗。位置拖拽 GUI 和 Jev 演示后置。

参考工程：`../aespa-drama-local`（交互研究）、`../okr-park`（内容与技术验证）、`../idea`（视觉参考）。
