import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import health from './health'
import interpret from './interpret'

const origin = 'https://vvspicesh.github.io'
const validBody = {
  password: 'test-password',
  question: '这件事接下来应注意什么？',
  divinationResult: {
    systemName: '六宫小六壬',
    numbers: ['1', '2', '3'],
    passes: [
      { name: '大安', element: '木', keywords: ['安定', '持续'] },
      { name: '留连', element: '土', keywords: ['拖延', '反复'] },
      { name: '赤口', element: '金', keywords: ['口舌', '争执'] },
    ],
    relations: ['木→土：相克', '土→金：相生'],
  },
  history: [{ role: 'user', content: '这是关于合作的事情。' }],
}

function request(path: string, method: string, body?: unknown, requestOrigin = origin): Request {
  return new Request(`https://api.example.test${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      Origin: requestOrigin,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('Vercel AI API', () => {
  beforeEach(() => {
    vi.stubEnv('AI_API_KEY', 'test-api-key')
    vi.stubEnv('APP_PASSWORD', 'test-password')
    vi.stubEnv('AI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/openai')
    vi.stubEnv('AI_MODEL', 'gemini-test-model')
    vi.stubEnv('ALLOWED_ORIGIN', origin)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns health status and model without exposing secrets', async () => {
    const response = await health.fetch(request('/api/health', 'GET'))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toEqual({ status: 'ok', model: 'gemini-test-model' })
    expect(JSON.stringify(payload)).not.toContain('test-api-key')
  })

  it('handles allowed preflight and rejects other origins', async () => {
    const preflight = await interpret.fetch(request('/api/interpret', 'OPTIONS'))
    const rejected = await interpret.fetch(request('/api/interpret', 'POST', validBody, 'https://example.com'))

    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(rejected.status).toBe(403)
  })

  it('returns 401 for a missing password without calling Gemini', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const withoutPassword = Object.fromEntries(Object.entries(validBody).filter(([key]) => key !== 'password'))
    const response = await interpret.fetch(request('/api/interpret', 'POST', withoutPassword))

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('validates request parameters after authentication', async () => {
    const response = await interpret.fetch(request('/api/interpret', 'POST', {
      ...validBody,
      divinationResult: { ...validBody.divinationResult, passes: [] },
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request parameters' })
  })

  it('calls the Gemini OpenAI-compatible endpoint and returns only text', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      choices: [{ message: { content: '象意解读内容' } }],
    }))
    const response = await interpret.fetch(request('/api/interpret', 'POST', validBody))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload).toEqual({ text: '象意解读内容' })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    )
    const upstreamBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { messages: Array<{ content: string }> }
    expect(upstreamBody.messages[0].content).toContain('不得修改、质疑或重新计算排盘及三传结果')
    expect(JSON.stringify(payload)).not.toContain('test-api-key')
  })
})
