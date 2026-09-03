# Copilot 阶段 1：工程初始化

请在当前 `bright-idea` 仓库中完成第一阶段开发。开始前完整阅读：

- `.github/copilot-instructions.md`
- `docs/product-spec.md`
- `docs/rules.md`
- `docs/acceptance.md`

本阶段只完成工程与测试基础设施，不实现起课页面、规则算法、农历、繁简转换、笔画数据或历史记录。

## 要求

1. 使用 React 19、TypeScript、Vite 初始化项目，保持现有文档和 Git 历史。
2. 配置 ESLint、Prettier、Vitest、Testing Library、jsdom。
3. 配置 PWA：可安装、具备最小 manifest 和离线应用壳；应用名使用 `bright-idea`，界面中文。
4. 建立适合后续开发的目录：
   - `src/app`
   - `src/components`
   - `src/features/divination`
   - `src/features/history`
   - `src/rules`
   - `src/storage`
   - `src/test`
5. 做一个最小首页壳：显示产品名、`起课 / 记录 / 规则` 三个底部入口，以及“传统文化研究与娱乐用途”的提示。不得提前伪造任何推算结果。
6. 手机优先，360px 宽度不得横向溢出；支持系统深色模式；交互区域不小于 44px。
7. 添加并确保以下脚本可运行：
   - `npm run lint`
   - `npm run typecheck`
   - `npm test -- --run`
   - `npm run build`
8. 至少添加一个应用壳渲染测试和一个底部导航可访问名称测试。
9. 不接入在线 API、后端、账号、云同步、AI、UI 大型组件库或状态管理库。
10. 依赖选型以必要、维护活跃、许可证允许公开仓库使用为准；在 README 中记录本地启动和验证命令。

## 验收

- 四条质量命令全部通过。
- 构建产物可生成。
- 断网刷新仍能打开应用壳。
- 不修改已确认的规则口径。
- 不进入第二阶段。

完成后仅输出：

1. 做了什么；
2. 修改了哪些文件；
3. 测试结果；
4. 剩余风险或待确认项。
