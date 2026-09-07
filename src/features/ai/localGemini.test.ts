import { webcrypto } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredGeminiKey,
  GEMINI_ENDPOINT,
  GEMINI_FALLBACK_ENDPOINT,
  GEMINI_FALLBACK_MODEL,
  GEMINI_KEY_STORAGE,
  GEMINI_PRIMARY_MODEL,
  requestGeminiInterpretation,
  storeEncryptedGeminiKey,
  unlockGeminiKey,
} from './localGemini'

const context = {
  question: '合作是否适合继续？',
  systemName: '六宫小六壬',
  inputMethod: '三数起课',
  originalInput: '1、2、3',
  passes: [
    { name: '大安', element: '木', keywords: ['安定'], direction: '正东' },
    { name: '留连', element: '土', keywords: ['拖延'] },
    { name: '赤口', element: '金', keywords: ['口舌'] },
  ],
}

describe('本机 Gemini 密钥与请求', () => {
  beforeAll(() => vi.stubGlobal('crypto', webcrypto as unknown as Crypto))
  afterAll(() => vi.unstubAllGlobals())
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('only stores versioned AES-GCM ciphertext metadata and decrypts in memory', async () => {
    await storeEncryptedGeminiKey('gemini-secret-key', 'local-password')

    const raw = localStorage.getItem(GEMINI_KEY_STORAGE) || ''
    const stored = JSON.parse(raw) as Record<string, unknown>
    expect(Object.keys(stored).sort()).toEqual(['ciphertext', 'iv', 'salt', 'version'])
    expect(raw).not.toContain('gemini-secret-key')
    expect(raw).not.toContain('local-password')
    await expect(unlockGeminiKey('local-password')).resolves.toBe('gemini-secret-key')
    await expect(unlockGeminiKey('wrong-password')).rejects.toThrow('DECRYPT_FAILED')

    clearStoredGeminiKey()
    expect(localStorage.getItem(GEMINI_KEY_STORAGE)).toBeNull()
  })

  it('calls Gemini directly with the key only in its header and includes the current session context', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      candidates: [{ content: { parts: [{ text: '象义解读' }] } }],
    }))
    const result = await requestGeminiInterpretation(
      'gemini-secret-key',
      context,
      [{ role: 'user', text: '上一条追问' }, { role: 'model', text: '上一条回答' }],
      '请继续说明',
    )

    expect(result).toEqual({ text: '象义解读', model: GEMINI_PRIMARY_MODEL })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(GEMINI_ENDPOINT)
    expect(options?.method).toBe('POST')
    expect((options?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect((options?.headers as Record<string, string>)['x-goog-api-key']).toBe('gemini-secret-key')
    const body = String(options?.body)
    const parsedBody = JSON.parse(body) as Record<string, unknown>
    expect(Object.keys(parsedBody)).toEqual(['contents'])
    expect(parsedBody).toMatchObject({ contents: [{ role: 'user', parts: [{ text: expect.any(String) }] }] })
    expect(body).not.toContain('gemini-secret-key')
    expect(body).toContain('合作是否适合继续？')
    expect(body).toContain('六宫小六壬')
    expect(body).toContain('三数起课')
    expect(body).toContain('大安')
    expect(body).toContain('上一条追问')
    expect(body).toContain('不得作确定性的死亡、医疗、法律或投资结论')
  })

  it('joins text from all candidate parts', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      candidates: [{ content: { parts: [{ text: '第一段' }, { inlineData: {} }, { text: '第二段' }] } }],
    }))

    await expect(requestGeminiInterpretation('secret', context, [], '解读'))
      .resolves.toEqual({ text: '第一段第二段', model: GEMINI_PRIMARY_MODEL })
  })

  it('reports HTTP status and a safe Google error without exposing the key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      error: { message: 'API key=gemini-secret-key is invalid' },
    }, { status: 400, statusText: 'Bad Request' }))

    const request = requestGeminiInterpretation('gemini-secret-key', context, [], '解读')
    await expect(request).rejects.toThrow(`${GEMINI_PRIMARY_MODEL} 请求失败（HTTP 400 Bad Request）：API Key=[已隐藏] is invalid`)
    await expect(request).rejects.not.toThrow('gemini-secret-key')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('classifies fetch failures as a blocked browser connection', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(requestGeminiInterpretation('secret', context, [], '解读'))
      .rejects.toThrow('浏览器连接被拦截')
  })

  it('reports an unexpected response structure separately', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ candidates: [] }))

    await expect(requestGeminiInterpretation('secret', context, [], '解读'))
      .rejects.toThrow('Gemini 响应结构异常：缺少候选内容')
  })

  it.each([429, 503])('uses the fallback model once when the primary returns HTTP %s', async (status) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ error: { message: 'Primary unavailable' } }, { status }))
      .mockResolvedValueOnce(Response.json({ candidates: [{ content: { parts: [{ text: '备用结果' }] } }] }))

    await expect(requestGeminiInterpretation('secret', context, [], '解读'))
      .resolves.toEqual({ text: '备用结果', model: GEMINI_FALLBACK_MODEL })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toBe(GEMINI_ENDPOINT)
    expect(fetchMock.mock.calls[1][0]).toBe(GEMINI_FALLBACK_ENDPOINT)
  })

  it('reports both safe HTTP failures without exposing the API key or request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({
        error: { message: 'Quota exhausted for API key=gemini-secret-key' },
      }, { status: 429 }))
      .mockResolvedValueOnce(Response.json({
        error: { message: 'Service unavailable for API key=gemini-secret-key' },
      }, { status: 503 }))

    const request = requestGeminiInterpretation('gemini-secret-key', context, [], '完整私密问题')
    await expect(request).rejects.toThrow('HTTP 429')
    await expect(request).rejects.toThrow('HTTP 503')
    await expect(request).rejects.not.toThrow('gemini-secret-key')
    await expect(request).rejects.not.toThrow('完整私密问题')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
