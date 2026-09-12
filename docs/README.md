# 文档目录

本目录区分“当前实现说明”和“历史目标/验收基线”。若旧规格与源码冲突，以当前源码为实际行为，并在[实现差异](#实现差异)中记录。

## 产品功能

- [项目 README](../README.md)：当前可用功能、启动与部署入口。
- [本地记录与规则页面](records-and-rules.md)：自动保存、复盘、备份恢复和规则页数据来源。
- [产品规格 v0.1](product-spec.md)：早期完整产品目标；本地记录与复盘现已实现，设置等内容仍未完成。
- [三字起课数据来源](character-data.md)：繁体转换、笔画数据来源和构建体积记录。

## 六宫/九宫规则

- [起课规则定义](rules.md)：宫位顺序、五行、方位、关键词、通用三传公式与时间/三字规则。
- 当前规则配置：`src/rules/configs.ts`；计算引擎：`src/rules/engine.ts`。
- 规则页章节配置已分离为 `src/components/sixRuleSections.ts` 与 `src/components/nineRuleSections.ts`；页面按当前体系渲染独立正文。

## 起课方式

- [产品规格的起课方式](product-spec.md#3-起课方式)：需求基线，部分内容与当前实现有差异。
- [起课规则中的时间与三字取数](rules.md#5-时间取数)。
- 当前实现包括任意三数、任意三字、1～18 随机三数和设备日期时间；没有独立的手工农历输入方式。

## 解说引擎

- [解说程序说明](interpretation-engine.md)：当前源码入口、真实类型、topic/intent、九宫配置、五行、生成逻辑和固定案例追踪。
- 当前 AI 功能为提示词导出，不向应用内后端提交问题。

## 测试与验收

- [首版验收与单体测试](acceptance.md)：早期验收目标；记录相关核心行为现已有单元测试。
- 当前测试位于 `src/**/*.test.ts(x)`、`api/api.test.ts` 和 `worker-ai/test/index.test.ts`。
- 根目录命令：`npm test -- --run`、`npm run typecheck`、`npm run build`、`npm run lint`。

## 部署

- [GitHub Pages 工作流](../.github/workflows/deploy-pages.yml)：当前部署方式，发布 `dist`。
- Vite 生产环境基路径为 `/bright-idea/`。

## 已废弃方案

- [历史 AI 接入说明](deprecated-ai-integrations.md)：Cloudflare Worker、Vercel API、浏览器直连 Gemini/DeepSeek 均为当前未使用方案，已由 AI 提示词导出替代。
- [Copilot 阶段 1 指令](copilot-phase-1.md)：已完成阶段的历史开发指令，不代表当前功能状态。

## 实现差异

截至当前源码核对结果：

| 文档原说法 | 当前代码 | 状态 |
|---|---|---|
| 随机三数为 1～99 | `generateRandomInputs()` 生成 1～18 | 文档与实现不一致，未改规则代码 |
| 提供手工农历月、日、时辰 | 时间入口只接收设备本地公历日期时间，再由 `convertTimeDivination()` 自动换算 | 尚未实现独立手工农历入口 |
| 历史记录、复盘、JSON 导入导出 | 已实现本地自动保存、搜索筛选、复盘、删除和备份恢复 | 已实现；不含云同步 |
| 规则说明页和设置页 | 规则页已读取实际配置生成；无设置页 | 规则已实现，设置尚未实现 |
| 结果保存、复制和完整计算轨迹文本 | 已自动保存完整步骤快照；当前有动画重播/跳过和 AI 提示词复制，没有独立轨迹列表或复制结果按钮 | 部分实现 |
| 每传结果卡展示宫位关键词 | 当前结果卡显示“观察基础条件/推进变化/收尾条件”，关键词集中在“判断依据” | 旧规格已过时 |
| 无网络可查看历史 | 记录保存在浏览器 `localStorage`，页面不请求后端 | 已实现本地查看；离线安装行为仍取决于 PWA 缓存 |
