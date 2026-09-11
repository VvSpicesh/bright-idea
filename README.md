# bright-idea

手机优先、可安装的小六壬 PWA。当前实现支持六宫小六壬与九宫小六壬（荀爽体系），提供任意三数、任意三字、随机三数和设备日期时间四种起课入口，展示三传、掌诀动画、白话解说、解读方向选择，并可将程序排盘和问题整理成提示词复制到外部 AI。

记录与规则两个导航入口目前是占位页。Cloudflare Worker、Vercel API 和浏览器直连 Gemini/DeepSeek 的历史代码当前未使用，已由 AI 提示词导出替代；运行当前应用不需要配置 API Key 或密码。

## 本地启动

```bash
npm install
npm run dev
```

## 检查命令

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

## GitHub Pages

线上地址：<https://vvspicesh.github.io/bright-idea/>

推送到 `main` 后，[Deploy Pages](.github/workflows/deploy-pages.yml) 工作流会依次执行 lint、typecheck、测试和构建，再发布 `dist`。也可以在 GitHub 的 **Actions → Deploy Pages → Run workflow** 手工触发。

## 文档

从[文档目录](docs/README.md)查看产品现状、规则、起课方式、解说引擎、测试、部署及已废弃方案。
