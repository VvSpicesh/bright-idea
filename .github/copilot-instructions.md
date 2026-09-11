# GitHub Copilot repository instructions

本仓库是 React 19、TypeScript、Vite 实现的手机优先小六壬 PWA。开始修改前先阅读：

- `docs/README.md`
- `docs/rules.md`
- 涉及解说时阅读 `docs/interpretation-engine.md`
- 涉及验收目标时阅读 `docs/acceptance.md`

## 当前实现约束

- 六宫与九宫使用 `src/rules/configs.ts` 中独立、不可变的配置，共用 `src/rules/engine.ts` 的循环计算引擎。
- 起课算法、宫位顺序、五行和规则版本属于稳定规则；不得为了调整文案或界面改变计算结果。
- 数字、三字、随机和时间起课逻辑位于 `src/features/divination`；繁简转换与笔画查询离线完成。
- 内置解说入口是 `src/features/divination/interpretation.ts`，问题分类与叙事生成已拆分为纯函数。
- 页面当前只导出 AI 提示词。`worker-ai/`、`api/`、`src/features/ai/localGemini.ts` 是保留的历史方案，当前未使用；不要把 API Key 或密码写成启动必需步骤。
- “记录”和“规则”导航目前是占位页，不得把历史、复盘或完整规则页面描述为已实现。
- UI 使用“小六壬”“六宫小六壬”“九宫小六壬（荀爽体系）”，不要称为“六爻”。
- 传统象义使用可能性表达，不能替代医疗、法律或投资等现实领域的事实核验和专业意见。

## 工程要求

- 业务计算保持为无 UI、无存储依赖的纯 TypeScript 函数。
- 修改后按范围执行测试，并运行 `npm run typecheck`；发布相关修改再运行 `npm run build`。
- 保持手机单栏、宽屏双栏、局部滚动、深色模式和无障碍行为。
- 文档描述当前行为时以源码为准；未完成的旧规格要明确标为目标或差异。
