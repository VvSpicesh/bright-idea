# bright-idea

手机优先的小六壬 PWA。当前为阶段 1：React 19、TypeScript、Vite 工程、质量工具、PWA 应用壳与首页壳。

## 本地启动

```bash
npm install
npm run dev
```

## 验证

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

依赖均为公开 npm 包，版本锁定在 `package-lock.json`；运行时不接入在线 API。应用壳不依赖外部字体或网络资源。

手机优先、可离线使用的小六壬起课与复盘工具。

首版同时支持：

- 六宫小六壬：大安、留连、速喜、赤口、小吉、空亡
- 九宫小六壬（荀爽体系）：在六宫基础上增加病符、桃花、天德，并使用独立的九宫五行规则
- 三数、三字繁体笔画、随机三数、当前时间、手工农历月日时五种起课方式
- 初传、中传、末传及完整计算轨迹
- 本地历史记录与结果复盘

本项目把起课计算、规则数据和白话解释分开。首版不接入生成式 AI，不把传统文化推演结果描述为事实，也不用于替代医疗、法律、投资等现实判断。

开发规格见：

- [产品规格](docs/product-spec.md)
- [规则定义](docs/rules.md)
- [验收与测试](docs/acceptance.md)
- [Copilot 阶段 1 指令](docs/copilot-phase-1.md)

## 技术基线

- React 19
- TypeScript
- Vite
- Vitest + Testing Library
- PWA，数据仅保存在浏览器本地
- 手机优先，桌面端自适应

## 开发状态

当前仅完成产品和规则定义，功能实现交由 GitHub Copilot 分阶段完成。
