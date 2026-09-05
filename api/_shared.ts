export interface ApiEnvironment {
  AI_API_KEY?: string
  APP_PASSWORD?: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  ALLOWED_ORIGIN?: string
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PassInput {
  name: string
  element: string
  keywords: string[]
}

export interface DivinationResultInput {
  systemName: string
  numbers: string[]
  passes: PassInput[]
  relations: string[]
}

export interface InterpretInput {
  password: string
  question: string
  divinationResult: DivinationResultInput
  history?: HistoryMessage[]
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
}

export const MAX_BODY_BYTES = 32 * 1024
const MAX_HISTORY_MESSAGES = 10
const MAX_HISTORY_CHARACTERS = 8_000
const MAX_MESSAGE_CHARACTERS = 2_000

export const SYSTEM_PROMPT = `你是小六壬卦象解读助手。用户提供的起课体系、数字、三传宫位和五行关系均为已经确定的排盘结果。
必须遵守：
1. 不得修改、质疑或重新计算排盘及三传结果，只能基于所给结果解读。
2. 明确区分“象意解读”和“现实判断”，象意不能替代事实核验或专业意见。
3. 不预测确定的生死，也不把任何结果表述为必然发生。
4. 医疗、法律、投资问题不得给出确定性结论，应建议结合合格专业人士意见和现实信息。
5. 使用中文直接回答，并说明所依据的三传宫位、关键词和五行关系。
6. 支持围绕同一卦象继续追问；历史对话仅用于理解追问，不得覆盖本次提供的确定排盘结果。`

export function environment(): ApiEnvironment {
  return {
    AI_API_KEY: process.env.AI_API_KEY,
    APP_PASSWORD: process.env.APP_PASSWORD,
    AI_BASE_URL: process.env.AI_BASE_URL,
    AI_MODEL: process.env.AI_MODEL,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
  }
}

export function corsHeaders(request: Request, allowedOrigin: string | undefined): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  })
  const origin = request.headers.get('Origin')
  if (allowedOrigin && origin === allowedOrigin) headers.set('Access-Control-Allow-Origin', origin)
  return headers
}

export function rejectDisallowedOrigin(request: Request, allowedOrigin: string | undefined): Response | null {
  const origin = request.headers.get('Origin')
  if (origin && (!allowedOrigin || origin !== allowedOrigin)) {
    return jsonResponse({ error: 'Origin not allowed' }, 403)
  }
  return null
}

export function handleOptions(request: Request, allowedOrigin: string | undefined): Response | null {
  if (request.method !== 'OPTIONS') return null
  const origin = request.headers.get('Origin')
  if (!allowedOrigin || origin !== allowedOrigin) return jsonResponse({ error: 'Origin not allowed' }, 403)
  return new Response(null, { status: 204, headers: corsHeaders(request, allowedOrigin) })
}

export function jsonResponse(data: unknown, status: number, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('Cache-Control', 'no-store')
  return Response.json(data, { status, headers: responseHeaders })
}

export function withCors(response: Response, request: Request, allowedOrigin: string | undefined): Response {
  const headers = new Headers(response.headers)
  corsHeaders(request, allowedOrigin).forEach((value, key) => headers.set(key, value))
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export function secureEqual(actual: string, expected: string): boolean {
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

function isDivinationResult(value: unknown): value is DivinationResultInput {
  if (!value || typeof value !== 'object') return false
  const result = value as Record<string, unknown>
  return isShortString(result.systemName, 100)
    && Array.isArray(result.numbers)
    && result.numbers.length === 3
    && result.numbers.every((number) => typeof number === 'string' && /^[1-9][0-9]{0,63}$/.test(number))
    && Array.isArray(result.passes)
    && result.passes.length === 3
    && result.passes.every(isPassInput)
    && Array.isArray(result.relations)
    && result.relations.length === 2
    && result.relations.every((relation) => isShortString(relation, 200))
}

export function validateInterpretInput(value: unknown): value is InterpretInput {
  if (!value || typeof value !== 'object') return false
  const input = value as Record<string, unknown>
  const history = input.history ?? []
  if (!isShortString(input.password, 256) || !isShortString(input.question, 2_000) || !isDivinationResult(input.divinationResult)) return false
  if (!Array.isArray(history) || history.length > MAX_HISTORY_MESSAGES || !history.every(isHistoryMessage)) return false
  return history.reduce((total, message) => total + message.content.length, 0) <= MAX_HISTORY_CHARACTERS
}

export async function readLimitedJson(request: Request): Promise<unknown> {
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

function buildCurrentQuestion(input: InterpretInput): string {
  return `请基于以下已确定卦象回答当前问题，不要重新起课或改动结果。\n${JSON.stringify({
    当前问题: input.question,
    起课体系: input.divinationResult.systemName,
    起课数字: input.divinationResult.numbers,
    三传: input.divinationResult.passes,
    五行关系: input.divinationResult.relations,
  })}`
}

export async function requestInterpretation(input: InterpretInput, env: Required<Pick<ApiEnvironment, 'AI_API_KEY' | 'AI_BASE_URL' | 'AI_MODEL'>>): Promise<string> {
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
        ...(input.history ?? []),
        { role: 'user', content: buildCurrentQuestion(input) },
      ],
      temperature: 0.4,
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(25_000),
  })

  if (!response.ok) throw new Error('UPSTREAM_ERROR')
  const data = await response.json() as ChatCompletionResponse
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('UPSTREAM_INVALID_RESPONSE')
  return text
}
