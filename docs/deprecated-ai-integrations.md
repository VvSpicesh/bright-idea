# 历史 AI 接入方案

> 状态：当前未使用，已由 AI 提示词导出替代。

当前页面的 `LocalGeminiInterpretation` 只调用 `buildAiInterpretationPrompt()` 生成文本，用户可以复制提示词，或打开 ChatGPT、Gemini、DeepSeek、豆包、Kimi 后自行粘贴。应用不会从这里调用仓库中的 AI 后端，也不要求 API Key 或密码。

仓库为保留历史仍包含以下代码：

| 历史方案 | 保留位置 | 当前状态 |
|---|---|---|
| Cloudflare Worker | `worker-ai/` | 当前未使用；原密码与上游 API Key 配置不是当前应用的运行步骤 |
| Vercel API | `api/interpret.ts`、`api/health.ts`、`vercel.json` | 当前未使用；当前 GitHub Pages 构建不会部署这些函数 |
| 浏览器直连 Gemini | `src/features/ai/localGemini.ts` 及其测试 | 当前未被页面组件导入；本地加密 API Key/密码不是当前应用的必需配置 |
| 浏览器或后端直连 DeepSeek | 历史接口实现与文档 | 当前未使用；页面中的 DeepSeek 按钮只打开网站 |

不要把这些目录中的密钥、密码或 Worker 部署步骤写入当前安装说明。若未来恢复任一方案，应先明确它的调用入口、隐私边界、部署环境和密钥管理方式，再从本页移出“当前未使用”状态。
