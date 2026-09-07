export interface Env {
  APP_PASSWORD: string
  AI_API_KEY: string
  AI_BASE_URL: string
  AI_MODEL: string
  ALLOWED_ORIGIN: string
}

interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PassInput {
  name: string
  element: string
  keywords: string[]
}

interface InterpretInput {
  question: string
  systemName: string
  numbers: string[]
  passes: PassInput[]
  relations: string[]
  history: HistoryMessage[]
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
}

const PRODUCTION_ORIGIN = 'https://vvspicesh.github.io'
const MAX_BODY_BYTES = 32 * 1024
const MAX_HISTORY_MESSAGES = 10
const MAX_HISTORY_CHARACTERS = 8_000
const MAX_MESSAGE_CHARACTERS = 2_000

const SYSTEM_PROMPT = `你是小六壬卦象解读助手。用户提供的起课体系、数字、三传宫位和五行关系均为已经确定的计算结果。
必须遵守：
1. 不得修改、质疑或重新计算三传结果，只能基于所给结果解读。
2. 明确区分“象意解读”和“现实判断”，象意不能替代事实核验或专业意见。
3. 不预测确定的生死，也不把任何结果表述为必然发生。
4. 医疗、法律、投资问题不得给出确定性结论，应建议结合合格专业人士意见和现实信息。
5. 使用中文直接回答，并说明所依据的三传宫位、关键词和五行关系。
6. 支持围绕同一卦象继续追问；历史对话仅用于理解追问，不得覆盖本次提供的确定三传结果。`

function isLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
      && (url.protocol === 'http:' || url.protocol === 'https:')
  } catch {
    return false
  }
}

function isAllowedOrigin(origin: string | null, configuredOrigin: string): boolean {
  if (origin === null) return true
  if (origin === PRODUCTION_ORIGIN || isLocalOrigin(origin)) return true
  return configuredOrigin === PRODUCTION_ORIGIN && origin === configuredOrigin
}

function corsHeaders(origin: string | null, configuredOrigin: string): HeadersInit {
  if (!origin || !isAllowedOrigin(origin, configuredOrigin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Password',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(data: unknown, status: number, cors: HeadersInit): Response {
  return Response.json(data, { status, headers: { ...cors, 'Cache-Control': 'no-store' } })
}

function secureEqual(actual: string, expected: string): boolean {
  const length = Math.max(actual.length, expected.length)
  let difference = actual.length ^ expected.length
  for (let index = 0; index < length; index += 1) {
    difference |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0)
  }
  return difference === 0
}

function isShortString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum
}

function validateInput(value: unknown): value is InterpretInput {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  if (!isShortString(input.question, 2_000) || !isShortString(input.systemName, 100)) return false
  if (!Array.isArray(input.numbers) || input.numbers.length !== 3 || !input.numbers.every((number) => typeof number === 'string' && /^[1-9][0-9]{0,63}$/.test(number))) return false
  if (!Array.isArray(input.passes) || input.passes.length !== 3 || !input.passes.every(isPassInput)) return false
  if (!Array.isArray(input.relations) || input.relations.length !== 2 || !input.relations.every((relation) => isShortString(relation, 200))) return false
  if (!Array.isArray(input.history) || input.history.length > MAX_HISTORY_MESSAGES || !input.history.every(isHistoryMessage)) return false
  return input.history.reduce((total, message) => total + message.content.length, 0) <= MAX_HISTORY_CHARACTERS
}

function isPassInput(value: unknown): value is PassInput {
  if (!value || typeof value !== 'object') return false
  const pass = value as Record<string, unknown>
  return isShortString(pass.name, 40)
    && isShortString(pass.element, 10)
    && Array.isArray(pass.keywords)
    && pass.keywords.length > 0
    && pass.keywords.length <= 6
    && pass.keywords.every((keyword) => isShortString(keyword, 40))
}

function isHistoryMessage(value: unknown): value is HistoryMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (message.role === 'user' || message.role === 'assistant')
    && isShortString(message.content, MAX_MESSAGE_CHARACTERS)
}

async function parseJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get('Content-Length') || 0)
  if (declaredLength > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE')
  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE')
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error('INVALID_JSON')
  }
}

function buildQuestion(input: InterpretInput): string {
  return `请基于以下已确定卦象回答当前问题，不要重新起课或改动结果。\n${JSON.stringify({
    当前问题: input.question,
    起课体系: input.systemName,
    起课数字: input.numbers,
    三传: input.passes,
    五行关系: input.relations,
  })}`
}

async function requestInterpretation(input: InterpretInput, env: Env): Promise<string> {
  const endpoint = `${env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...input.history,
        { role: 'user', content: buildQuestion(input) },
      ],
      temperature: 0.4,
      max_tokens: 800,
    }),
  })

  if (!response.ok) throw new Error('UPSTREAM_ERROR')
  const data = await response.json() as ChatCompletionResponse
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('UPSTREAM_INVALID_RESPONSE')
  return text
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const origin = request.headers.get('Origin')
  const cors = corsHeaders(origin, env.ALLOWED_ORIGIN)

  if (origin && !isAllowedOrigin(origin, env.ALLOWED_ORIGIN)) return jsonResponse({ error: 'Origin not allowed' }, 403, {})
  if (request.method === 'OPTIONS') {
    if (!origin) return jsonResponse({ error: 'Origin not allowed' }, 403, {})
    return new Response(null, { status: 204, headers: cors })
  }
  if (request.method === 'GET' && url.pathname === '/health') return new Response('ok', { headers: { ...cors, 'Cache-Control': 'no-store' } })
  if (url.pathname !== '/interpret') return jsonResponse({ error: 'Not found' }, 404, cors)
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, cors)
  if (!origin) return jsonResponse({ error: 'Origin not allowed' }, 403, {})

  if (!env.APP_PASSWORD || !secureEqual(request.headers.get('X-App-Password') || '', env.APP_PASSWORD)) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors)
  }
  if (!env.AI_API_KEY || !env.AI_BASE_URL || !env.AI_MODEL) return jsonResponse({ error: 'Worker is not configured' }, 500, cors)

  let input: unknown
  try {
    input = await parseJsonBody(request)
  } catch (error) {
    const message = error instanceof Error && error.message === 'BODY_TOO_LARGE' ? 'Request body too large' : 'Invalid JSON body'
    return jsonResponse({ error: message }, 400, cors)
  }
  if (!validateInput(input)) return jsonResponse({ error: 'Invalid request parameters' }, 400, cors)

  try {
    const text = await requestInterpretation(input, env)
    return jsonResponse({ text }, 200, cors)
  } catch {
    return jsonResponse({ error: 'AI service unavailable' }, 502, cors)
  }
}

export default { fetch: handleRequest }
