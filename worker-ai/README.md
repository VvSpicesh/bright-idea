# bright-idea AI Worker

独立 Cloudflare Worker，为前端提供受密码保护的 OpenAI-compatible 解读接口。Worker 不记录密码、API Key 或问题正文。

## 接口

- `GET /health`：返回纯文本 `ok`。
- `POST /interpret`：请求头必须包含 `X-App-Password`。
- `OPTIONS`：为允许的来源处理 CORS 预检。

生产来源仅允许 `https://vvspicesh.github.io`；本地允许 `http://localhost:<端口>`、`http://127.0.0.1:<端口>` 及对应 HTTPS 地址。`/interpret` 请求必须携带允许列表中的 `Origin`。

请求体示例：

```json
{
  "question": "这件事接下来应注意什么？",
  "systemName": "六宫小六壬",
  "numbers": ["1", "2", "3"],
  "passes": [
    { "name": "大安", "element": "木", "keywords": ["安定", "持续"] },
    { "name": "留连", "element": "土", "keywords": ["拖延", "反复"] },
    { "name": "赤口", "element": "金", "keywords": ["口舌", "争执"] }
  ],
  "relations": ["木→土：相克", "土→金：相生"],
  "history": [{ "role": "user", "content": "这是关于合作的事情。" }]
}
```

请求体最多 32 KiB；历史最多 10 条、合计最多 8000 字符，单条历史最多 2000 字符。

## 本地启动

```bash
cd worker-ai
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Windows PowerShell 可使用 `Copy-Item .dev.vars.example .dev.vars`。请编辑 `.dev.vars` 写入本地密码和 API Key；该文件已被 Git 忽略。

## 设置生产 Secret

```bash
npx wrangler secret put APP_PASSWORD
npx wrangler secret put AI_API_KEY
```

`AI_BASE_URL`、`AI_MODEL`、`ALLOWED_ORIGIN` 位于 `wrangler.jsonc` 的 `vars` 中。生产环境的 `ALLOWED_ORIGIN` 应保持为 `https://vvspicesh.github.io`。

## 检查与部署

```bash
npm run typecheck
npm test
npm run deploy
```

部署前先登录 Cloudflare：

```bash
npx wrangler login
```
