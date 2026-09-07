export const GEMINI_PRIMARY_MODEL = 'gemini-2.5-flash'
export const GEMINI_FALLBACK_MODEL = 'gemini-3.1-flash-lite'
export const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_PRIMARY_MODEL}:generateContent`
export const GEMINI_FALLBACK_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:generateContent`
export const GEMINI_KEY_STORAGE = 'bright-idea:gemini-key'

const STORAGE_VERSION = 1
const PBKDF2_ITERATIONS = 250_000
const MAX_HISTORY_MESSAGES = 10
const MAX_ERROR_DETAIL_LENGTH = 300

export interface StoredGeminiKey {
  version: 1
  ciphertext: string
  salt: string
  iv: string
}

export interface GeminiChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface GeminiDivinationContext {
  question: string
  systemName: string
  inputMethod: string
  originalInput: string
  passes: ReadonlyArray<{
    name: string
    element: string
    direction?: string
    keywords: readonly string[]
  }>
}

export interface GeminiInterpretationResult {
  text: string
  model: string
}

export type GeminiRequestErrorKind = 'http' | 'connection' | 'response'

export class GeminiRequestError extends Error {
  readonly kind: GeminiRequestErrorKind
  readonly status?: number

  constructor(kind: GeminiRequestErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'GeminiRequestError'
    this.kind = kind
    this.status = status
  }
}

const SYSTEM_INSTRUCTION = `你是小六壬卦象解读助手。程序提供的体系和初传、中传、末传是已经确定的排盘结果。
必须遵守：
1. 不得修改、质疑或重新计算程序计算出的宫位及三传结果。
2. 明确区分“象义解读”和“现实事实”，象义不能替代事实核验或专业意见。
3. 不得作确定性的死亡、医疗、法律或投资结论，不把任何结果表述为必然发生。
4. 涉及健康问题时，明确提示以医生诊断为准；法律和投资问题应建议咨询合格专业人士。
5. 使用中文直接回答，并说明依据的宫位、五行、方位和象义。
6. 可以围绕同一排盘继续追问，但历史对话不得覆盖程序提供的排盘结果。`

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function parseStoredKey(value: string | null): StoredGeminiKey | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as Partial<StoredGeminiKey>
    if (parsed.version !== STORAGE_VERSION || typeof parsed.ciphertext !== 'string' || typeof parsed.salt !== 'string' || typeof parsed.iv !== 'string') return null
    return parsed as StoredGeminiKey
  } catch {
    return null
  }
}

export function hasStoredGeminiKey(storage: Storage = localStorage): boolean {
  return parseStoredKey(storage.getItem(GEMINI_KEY_STORAGE)) !== null
}

export async function storeEncryptedGeminiKey(apiKey: string, password: string, storage: Storage = localStorage): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(apiKey))
  const stored: StoredGeminiKey = {
    version: STORAGE_VERSION,
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
  }
  storage.setItem(GEMINI_KEY_STORAGE, JSON.stringify(stored))
}

export async function unlockGeminiKey(password: string, storage: Storage = localStorage): Promise<string> {
  const stored = parseStoredKey(storage.getItem(GEMINI_KEY_STORAGE))
  if (!stored) throw new Error('NO_STORED_KEY')
  try {
    const salt = base64ToBytes(stored.salt)
    const iv = base64ToBytes(stored.iv)
    const key = await deriveKey(password, salt)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBytes(stored.ciphertext))
    return new TextDecoder().decode(plaintext)
  } catch {
    throw new Error('DECRYPT_FAILED')
  }
}

export function clearStoredGeminiKey(storage: Storage = localStorage): void {
  storage.removeItem(GEMINI_KEY_STORAGE)
}

function safeGoogleErrorMessage(value: unknown, apiKey: string): string | null {
  if (!value || typeof value !== 'object') return null
  const error = (value as { error?: unknown }).error
  if (!error || typeof error !== 'object') return null
  const message = (error as { message?: unknown }).message
  if (typeof message !== 'string' || !message.trim()) return null
  return message
    .replaceAll(apiKey, '[已隐藏]')
    .replace(/(?:key|api[_ -]?key)\s*[=:]\s*[^\s,;]+/gi, 'API Key=[已隐藏]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ERROR_DETAIL_LENGTH)
}

async function parseHttpError(response: Response, apiKey: string, model: string): Promise<GeminiRequestError> {
  let detail: string | null = null
  try {
    detail = safeGoogleErrorMessage(await response.json(), apiKey)
  } catch {
    // Do not expose an unstructured response body because it may echo request data.
  }
  const statusLabel = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
  return new GeminiRequestError(
    'http',
    `${model} 请求失败（HTTP ${statusLabel}）${detail ? `：${detail}` : ''}`,
    response.status,
  )
}

async function requestModel(
  endpoint: string,
  model: string,
  apiKey: string,
  body: string,
): Promise<GeminiInterpretationResult> {
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body,
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw new GeminiRequestError('connection', '浏览器连接被拦截，请检查 CORS、CSP、网络或浏览器扩展后重试')
  }

  if (!response.ok) throw await parseHttpError(response, apiKey, model)

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new GeminiRequestError('response', 'Gemini 响应结构异常：返回内容不是有效 JSON')
  }
  const parts = (data as { candidates?: Array<{ content?: { parts?: unknown } }> })?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) throw new GeminiRequestError('response', 'Gemini 响应结构异常：缺少候选内容')
  const text = parts
    .filter((part): part is { text: string } => Boolean(part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string'))
    .map((part) => part.text)
    .join('')
    .trim()
  if (!text) throw new GeminiRequestError('response', 'Gemini 响应结构异常：候选内容中没有文本')
  return { text, model }
}

export async function requestGeminiInterpretation(
  apiKey: string,
  context: GeminiDivinationContext,
  history: readonly GeminiChatMessage[],
  prompt: string,
): Promise<GeminiInterpretationResult> {
  const contextText = JSON.stringify({
    用户问题: context.question,
    起课体系: context.systemName,
    起课方式: context.inputMethod,
    原始输入: context.originalInput,
    三传: context.passes.map((pass, index) => ({
      阶段: ['初传', '中传', '末传'][index],
      宫位: pass.name,
      五行: pass.element,
      方位: pass.direction || '未设定',
      象义: pass.keywords,
    })),
  })
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES)
  const historyText = recentHistory
    .map((message) => `${message.role === 'user' ? '用户' : 'Gemini'}：${message.text}`)
    .join('\n')
  const requestText = [
    SYSTEM_INSTRUCTION,
    `以下是程序已经确定的排盘上下文，不得修改：\n${contextText}`,
    historyText ? `同一排盘的最近对话：\n${historyText}` : '',
    `本次问题：\n${prompt}`,
  ].filter(Boolean).join('\n\n')

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: requestText }] }],
  })

  try {
    return await requestModel(GEMINI_ENDPOINT, GEMINI_PRIMARY_MODEL, apiKey, body)
  } catch (primaryError) {
    if (!(primaryError instanceof GeminiRequestError)
      || primaryError.kind !== 'http'
      || (primaryError.status !== 429 && primaryError.status !== 503)) throw primaryError

    try {
      return await requestModel(GEMINI_FALLBACK_ENDPOINT, GEMINI_FALLBACK_MODEL, apiKey, body)
    } catch (fallbackError) {
      const fallbackSummary = fallbackError instanceof GeminiRequestError
        ? fallbackError.message
        : `${GEMINI_FALLBACK_MODEL} 请求失败（未知错误）`
      throw new GeminiRequestError(
        fallbackError instanceof GeminiRequestError ? fallbackError.kind : 'response',
        `Gemini 主备模型均请求失败：${primaryError.message}；${fallbackSummary}`,
        fallbackError instanceof GeminiRequestError ? fallbackError.status : undefined,
      )
    }
  }
}
