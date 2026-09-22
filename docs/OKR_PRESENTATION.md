# OKR 演讲视图

入口：<http://127.0.0.1:5178/#park>。支持直接打开 `#park/o1/kr1` 到 `#park/o3/kr3`，刷新和浏览器前进、后退均可恢复对应内容。

## 演讲顺序与交互

1. O1 · AI · Workflow：左前方旋转木马。
2. O2 · UX · Link：后方双心摩天轮。
3. O3 · Code · Craft：右前方金属楼。

首页不显示底部目标导航与操作提示。点击主体，当前模型移至左侧独显；右侧滑入单一内容模块。模块含目标标题、KR 缩略目录、大幅案例画布、案例说明，以及完整关键行动和交付验收。右侧内容独立滚动，保留标题、目标、KR 缩略目录和案例正文；移除关闭按钮、顶部英文标签与底部翻页栏。

详情内用目录或键盘左右箭头切换 KR；切换 O 时返回乐园点击对应模型。详情页左上角以固定位置的浅灰色 Back 按钮替换 logo 与标语；左侧模型不附带标题、说明或 O 切换导航。按 Esc 或 Back 恢复先前场景视角。聚焦画布时，数字键 1、2、3 选择 O；空格暂停动画，方向键环视；加减键、滚轮与捏合缩放仅在完整乐园生效，详情模型禁止缩放。系统减少动态效果偏好会关闭位移动画，并默认暂停模型动画。

手机布局将独立模型放在顶部，详情自下方展开，目录变为横向三项。

## 替换案例素材

完整内容位于 `src/okrContent.ts`。九个 KR 均保留用户提供的标题、权重、行动和验收原文。新增的案例标题、描述与封面是演讲占位，不代表已完成案例。

在对应 KR 的 `media` 字段选择：

```ts
// 默认概念封面
media: { type: 'cover' }

// 图片放进 public/cases/，通过网站根路径引用
media: { type: 'image', src: '/cases/workflow-demo.png', alt: '工作流改版前后对照' }

// 可嵌入的网页。目标页面须允许 iframe 嵌入。
media: { type: 'embed', src: 'https://example.com/demo', title: '交互演示' }

// 导入本地 React 组件；本文件是 .ts，可使用 createElement。
media: { type: 'component', render: () => createElement(MyDemo) }
```

同步修改 `caseTitle`、`caption` 和 `tags`；大图与目录概念缩略封面相互独立，后续可按案例需要替换目录预览。

实现文件：`src/OkrDetails.tsx`（内容模块）、`src/okr.css`（展示样式）、`src/ParkScene.tsx`（场景选择与平滑聚焦）、`src/parkNavigation.ts`（位置与避障）。

## 验证

- `npm run build`：TypeScript 与生产构建。
- `node scripts/check-park-navigation.mjs`：交换位置后 56 条路径、模型底座间隔与边界。
- 浏览器验证：模型点击、三个 O / 九个 KR、连续演讲导航、正文滚动、桌面与手机布局。

修改前的四个场景文件保存在 `artifacts/before-okr-details/`。

首页 logo 固定宽度 280px。整页及模型区域保持白色，仅右侧详情模块为轻微冷灰 #f5f6f8，无模块外框；O 标题与目标下方有分割线，区分 KR 内容。

## 简洁杂志版式

详情字体优先使用苹方 PingFang SC。导航仅显示三张缩略图，完整 KR 名称与权重保留在无障碍标签中。内容顺序为展示区、KR 一句话、关键行动、交付与验收；移除封面文字、额外案例描述和标签。桌面正文以双栏展示，窄屏改为单栏。

展示文案集中在 `src/okrEditorial.ts`，九个 KR 均经精简，并保留数量与验收要求。`src/okrContent.ts` 保留完整原文与素材配置，便于后续追溯和替换案例。

最新阅读版：移除 O 下方分割线与缩略图选中样式；行动和验收不显示标签，改为一列两段、各一句。每个 O 的 KR1 标题上方显示灰色小号衬线字 Hi December～。
