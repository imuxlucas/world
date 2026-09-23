import { publicUrl } from './publicUrl';
import { createElement, type ReactNode } from 'react';
import WorkflowFolder from './components/WorkflowFolder';
import WorkflowDesktop from './components/WorkflowDesktop';
import WorkflowFinder from './components/WorkflowFinder';
import MobileComparison from './components/MobileComparison';
import DotsDemo from './components/DotsDemo';
import CraftDesktop from './components/CraftDesktop';

export type ObjectiveId = 'o1' | 'o2' | 'o3';
// Replace a cover with an image, a live page, or a local React demo here.
export type CaseMedia =
  | { type: 'cover' }
  | { type: 'image'; src: string; alt: string }
  | { type: 'embed'; src: string; title: string }
  | { type: 'component'; render: () => ReactNode };
export type KeyResult = {
  title: string; shortTitle: string; weight: number; action: string; acceptance: string;
  caseTitle: string; caption: string; tags: string[]; media: CaseMedia;
};
export type Objective = {
  id: ObjectiveId; model: 'carousel' | 'link' | 'craft'; title: string; word: string;
  statement: string; note: string; results: KeyResult[];
};

export const OBJECTIVES: Objective[] = [
  {
    id: 'o1', model: 'carousel', title: 'AI · Workflow', word: 'Workflow',
    statement: '建立服务真实设计任务的 AI-Native 工作方法，提升从问题到体验验证的效率',
    note: '从持续输入，到真实任务。\n让好的方法，转动起来。',
    results: [
      {
        title: '将持续输入转化为可用于实际任务的判断', shortTitle: '输入 → 判断', weight: 25,
        action: '围绕真实设计任务，持续追踪 AI 模型、产品与交互范式，通过场景化测评和案例分析，明确工具的适用场景、能力边界及值得借鉴的体验设计，并将有效结论用于工具选型、工作流调整或设计决策。',
        acceptance: 'All-in-one 测评动态、好体验点子库，以及可追溯的“输入结论—实际应用—效果反馈”案例。',
        caseTitle: '把输入，变成有用的判断。', caption: '从一次场景化测评出发，串起输入结论、实际应用与效果反馈。',
        tags: ['All-in-one 测评', '好体验点子库', '设计决策'], media: { type: 'component', render: () => createElement(WorkflowFolder) },
      },
      {
        title: '解决工作流断点，提升“灵感—Demo—体验验证”的效率与质量', shortTitle: '灵感 → 验证', weight: 50,
        action: '在真实需求中识别并解决从想法到可运行 Demo 的关键阻碍，通过前后对比，验证新工具与 Build 方法在实现耗时、体验还原度或沟通效率上的改善。基于实践完成 2 次 Build 经验分享。',
        acceptance: '可运行 Demo、包含前后对比的工具实践报告、2 次经验分享及同事试用反馈，形成可复现的实践方法。',
        caseTitle: '让灵感，走到可体验的那一步。', caption: '以同一个真实需求的前后对比，讲清工具与 Build 方法带来的变化。',
        tags: ['可运行 Demo', '前后对比', '2 次 Build 分享'], media: { type: 'component', render: () => createElement(WorkflowDesktop) },
      },
      {
        title: '推动有效方法被团队独立使用，形成可维护的工作流资产', shortTitle: '方法 → 复用', weight: 25,
        action: '将验证有效的工作流、Skill 和交互 Pattern 整理为团队资产，补齐适用场景、操作步骤、示例与使用边界，推动同事在真实任务中独立使用，并根据反馈持续迭代。',
        acceptance: '需求到 Demo SOP、WorkBuddy 团队知识库、可复用 Skill 与 Pattern；以同事独立完成任务的记录验证复用效果，在 Dots 中持续维护相关实践。',
        caseTitle: '一个人的方法，成为团队的能力。', caption: '用一次同事独立完成任务的过程，验证工作流资产的复用价值。',
        tags: ['需求到 Demo SOP', 'WorkBuddy', 'Skill & Pattern'], media: { type: 'component', render: () => createElement(WorkflowFinder) },
      },
    ],
  },
  {
    id: 'o2', model: 'link', title: 'UX · Link', word: 'Link',
    statement: '主动定义并解决创作链路中的关键问题，打造简单、智能、一致的多端体验',
    note: '连接工具，也连接体验。\n让每一步，自然发生。',
    results: [
      {
        title: '从完整创作链路定义共性问题，推动跨端、跨工具体验一致', shortTitle: '链路 → 一致', weight: 50,
        action: '结合平台、APP 与生成工具的业务视角，通过链路走查、用户反馈或使用数据，识别重复理解、重复操作和规则不一致等问题。明确核心问题、影响范围与优先级，推动业务方形成共识，将统一的设计规则落实到相关场景。',
        acceptance: '做同款 / 使用技能链路优化、资产展示规则、商业化相关设计及跨端交互模式；通过改版前后对照，说明减少了哪些理解负担、冗余操作或规则冲突。',
        caseTitle: '把分散的操作，连成自然的体验。', caption: '从完整创作链路看做同款、使用技能与资产展示，呈现改版前后的差异。',
        tags: ['做同款 / 使用技能', '资产展示规则', '跨端交互'], media: { type: 'embed', src: publicUrl('/demos/lip-prompt/index.html'), title: '唇妆反差钩子 · 词槽输入组件' },
      },
      {
        title: '用可运行方案验证智能交互解法，推动关键体验按预期落地', shortTitle: '方案 → 落地', weight: 30,
        action: '针对明确的业务问题，运用 O1 积累的方法，通过概念方案与动态 Demo 比较不同解法，说明设计取舍及验证结论。根据项目需要采用设计稿、Demo、组件或代码分支交付，明确关键状态、交互与动效要求，并跟进实现与体验验收。',
        acceptance: '主体库组件、词槽组件、智能交互提案，以及列表到详情的元素过渡、抽屉动效等优化案例；保留方案比较、落地效果与关键体验问题的解决记录。',
        caseTitle: '从交互设想，到每一帧的落地。', caption: '以主体库、词槽或一次元素过渡为例，用动态方案说明设计取舍。',
        tags: ['主体库组件', '词槽组件', '动效与过渡'], media: { type: 'embed', src: publicUrl('/demos/tad-universal/'), title: 'tad-universal · 标签、主体库与滑块' },
      },
      {
        title: '支持 APP 核心能力迭代，形成经实际使用验证的移动端体验亮点', shortTitle: '移动 → 亮点', weight: 20,
        action: '支持平台核心能力向 APP 延伸，结合移动端的输入方式、屏幕空间与使用情境优化核心链路。在做同款、局部编辑等场景中探索语言与图形界面的协同方式，形成 1—2 个经实际使用验证的移动端交互亮点。',
        acceptance: 'APP 核心链路迭代、GUI 与 LUI 协同的场景案例；结合实际任务表现与使用反馈，说明交互亮点解决了什么问题，并据此完成优化。',
        caseTitle: '小屏幕，也能承载完整的创造力。', caption: '结合做同款或局部编辑的实际任务，展示语言与图形界面如何协同。',
        tags: ['APP 核心链路', 'GUI × LUI', '1—2 个交互亮点'], media: { type: 'component', render: () => createElement(MobileComparison) },
      },
    ],
  },
  {
    id: 'o3', model: 'craft', title: 'Code · Craft', word: 'Craft',
    statement: '以 AI 交互组件与 Craft 代表作，形成有设计判断的个人专业表达',
    note: '把判断，写进作品。\n把细节，打磨成表达。',
    results: [
      {
        title: '形成能够完整呈现个人设计判断的 Craft 代表案例', shortTitle: '判断 → 作品', weight: 50,
        action: '在业务需求与体验专项中，主动提出值得解决的问题，以用户依据明确问题，通过方案比较说明取舍，并用 Build 验证关键判断。将代表性实践整理为完整案例，呈现个人在问题定义、交互设计、技术实现与品质打磨中的贡献。',
        acceptance: 'Dots Craft 案例库，包含“问题—依据—取舍—实现—结果”、可运行 Demo 及落地效果，清晰呈现设计判断及验证后的收获。',
        caseTitle: '好的作品，有清晰的判断。', caption: '沿着问题、依据、取舍、实现与结果，完整讲述一件 Craft 代表作。',
        tags: ['Dots Craft', '设计判断', 'Build 验证'], media: { type: 'component', render: () => createElement(DotsDemo) },
      },
      {
        title: '将业务中的 AI 交互沉淀为可复用组件，让设计成果持续产生价值', shortTitle: '组件 → 价值', weight: 40,
        action: '与超超、Minna 协作维护 tad-universal，从真实业务中提炼并沉淀 5 个具有明确智能交互价值的组件。每个组件明确其解决的问题，补齐适用场景、状态与异常规则、设计依据及使用示例，并完成业务应用。',
        acceptance: '5 个 AI 交互组件、组件使用规范及业务应用案例；以真实业务中的可用性与复用价值验收组件，结合创新点沉淀具备申报价值的专利提案。',
        caseTitle: '让一次设计，持续产生价值。', caption: '从真实业务中提炼智能交互，以组件使用与业务应用验证可复用性。',
        tags: ['tad-universal', '5 个 AI 组件', '业务应用'], media: { type: 'embed', src: 'https://tad-universal.woa.com/biz-mx/?path=/docs/rx-快速组件-rxslider-滑块--文档', title: 'tad-universal · RxSlider 滑块文档' },
      },
      {
        title: '建立持续展示作品与设计主张的个人窗口', shortTitle: '表达 → 窗口', weight: 10,
        action: '结合个人优势与兴趣，主动开展小型 Build 探索，提炼作品中的关键体验与设计主张。完成 1 个可访问、可持续更新的个人网站，系统呈现代表作品、设计思考与 Build 实践。',
        acceptance: '已上线的个人网站，包含代表作品、关键设计决策与 Demo 体验入口，并建立便于后续补充作品的内容结构。',
        caseTitle: '一个窗口，持续生长的作品。', caption: '让代表作品、设计思考与 Build 探索，成为可以被访问和体验的个人表达。',
        tags: ['个人网站', '代表作品', 'Build 实践'], media: { type: 'component', render: () => createElement(CraftDesktop) },
      },
    ],
  },
];

export type KrVariant = 'default' | 'comparison' | 'archive';
export function readOkrRoute() {
  const match = location.hash.match(/^#park\/(o[123])(?:\/kr([123]))?(\/(?:comparison|archive))?$/);
  const variant: KrVariant = match?.[1] === 'o2' && match?.[2] === '1' && match?.[3] === '/comparison' ? 'comparison'
    : match?.[1] === 'o3' && match?.[2] === '3' && match?.[3] === '/archive' ? 'archive' : 'default';
  return { objective: OBJECTIVES.find(o => o.id === match?.[1]) ?? null, kr: Number(match?.[2] ?? 1) - 1, variant };
}
export function navigateOkr(id: ObjectiveId | null, kr = 0, variant: KrVariant = 'default') {
  const suffix = id === 'o2' && kr === 0 && variant === 'comparison' ? '/comparison'
    : id === 'o3' && kr === 2 && variant === 'archive' ? '/archive' : '';
  location.hash = id ? `park/${id}/kr${kr + 1}${suffix}` : 'park';
}
