import { webcrypto } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredGeminiKey,
  GEMINI_ENDPOINT,
  GEMINI_KEY_STORAGE,
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

    expect(result).toBe('象义解读')
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(GEMINI_ENDPOINT)
    expect((options?.headers as Record<string, string>)['x-goog-api-key']).toBe('gemini-secret-key')
    const body = String(options?.body)
    expect(body).not.toContain('gemini-secret-key')
    expect(body).toContain('合作是否适合继续？')
    expect(body).toContain('六宫小六壬')
    expect(body).toContain('三数起课')
    expect(body).toContain('大安')
    expect(body).toContain('上一条追问')
    expect(body).toContain('不得作确定性的死亡、医疗、法律或投资结论')
  })
})
