import type { ObjectiveId } from './okrContent';

// Presentation copy; full original OKRs remain in okrContent.ts.
export const OKR_EDITORIAL: Record<ObjectiveId, { title: string; action: string; acceptance: string }[]> = {
  o1: [
    { title: '让持续输入，成为真实任务中的设计判断。', action: '围绕真实任务测评 AI 模型、产品与交互范式，明确适用场景、能力边界与体验启发，用于工具选型、工作流和设计决策。', acceptance: 'All-in-one 测评动态、好体验点子库，以及可追溯的「输入结论—实际应用—效果反馈」案例。' },
    { title: '打通灵感到 Demo，让体验验证更快、更好。', action: '识别真实需求中的工作流断点，以前后对比验证实现耗时、体验还原度或沟通效率的改善，完成 2 次 Build 经验分享。', acceptance: '可运行 Demo、前后对比实践报告、2 次分享与同事试用反馈，形成可复现的方法。' },
    { title: '让有效方法，成为团队可独立使用的资产。', action: '将工作流、Skill 与 Pattern 整理为团队资产，补齐场景、步骤、示例和边界，推动同事独立使用并持续迭代。', acceptance: '需求到 Demo SOP、WorkBuddy 知识库、可复用 Skill 与 Pattern；以独立完成任务的记录验证复用，在 Dots 持续维护。' },
  ],
  o2: [
    { title: '从完整创作链路出发，让多端体验保持一致。', action: '结合平台、APP 与生成工具，通过链路走查、用户反馈或数据识别共性问题，明确优先级，推动业务共识与统一规则落地。', acceptance: '做同款 / 使用技能、资产展示、商业化与跨端交互案例；以前后对照说明减少的理解负担、冗余操作或规则冲突。' },
    { title: '用可运行的方案，推动智能交互按预期落地。', action: '以概念方案和动态 Demo 比较解法、说明取舍；按需交付设计稿、Demo、组件或代码，明确状态与动效并跟进验收。', acceptance: '主体库、词槽、智能交互提案及元素过渡、抽屉动效案例，保留方案比较、落地效果与问题解决记录。' },
    { title: '把核心能力带到移动端，做出经使用验证的体验亮点。', action: '结合移动端输入等优化核心链路，在做同款、局部编辑中探索 GUI 与 LUI 协同，形成 1—2 个经实际使用验证的亮点。', acceptance: 'APP 核心链路迭代与 GUI × LUI 场景案例；以任务表现和使用反馈说明价值，并据此优化。' },
  ],
  o3: [
    { title: '用 Craft 代表作，完整呈现我的设计判断。', action: '从业务与体验问题出发，以用户依据定义问题、方案比较说明取舍、Build 验证判断，呈现个人在设计、实现与打磨中的贡献。', acceptance: 'Dots Craft 案例库，涵盖「问题—依据—取舍—实现—结果」、可运行 Demo 与落地效果，呈现判断及验证后的收获。' },
    { title: '沉淀 5 个 AI 交互组件，让设计持续产生价值。', action: '与超超、Minna 维护 tad-universal，落地 5 个智能交互组件，补齐场景、状态、异常、设计依据与示例，并完成业务应用。', acceptance: '5 个 AI 组件、使用规范与应用案例；以业务可用性和复用价值验收，结合创新点沉淀具备申报价值的专利提案。' },
    { title: '建立一个持续更新的窗口，展示作品与设计主张。', action: '围绕优势与兴趣开展小型 Build 探索，提炼体验与主张，完成 1 个可访问、可持续更新的个人网站。', acceptance: '上线个人网站，呈现代表作品、关键设计决策与 Demo 入口，并建立便于持续补充作品的内容结构。' },
  ],
};
