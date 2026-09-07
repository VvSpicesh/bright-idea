import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env } from '../src/index'

const env: Env = {
  APP_PASSWORD: 'test-password',
  AI_API_KEY: 'test-api-key',
  AI_BASE_URL: 'https://ai.example.test/v1',
  AI_MODEL: 'test-model',
  ALLOWED_ORIGIN: 'https://vvspicesh.github.io',
}

const validBody = {
  question: '这件事接下来应注意什么？',
  systemName: '六宫小六壬',
  numbers: ['1', '2', '3'],
  passes: [
    { name: '大安', element: '木', keywords: ['安定', '持续'] },
    { name: '留连', element: '土', keywords: ['拖延', '反复'] },
    { name: '赤口', element: '金', keywords: ['口舌', '争执'] },
  ],
  relations: ['木→土：相克', '土→金：相生'],
  history: [{ role: 'user', content: '这是关于合作的事情。' }],
}

function interpretRequest(body: unknown, password?: string): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: 'https://vvspicesh.github.io',
  }
  if (password) headers['X-App-Password'] = password
  return new Request('https://worker.example.test/interpret', { method: 'POST', headers, body: JSON.stringify(body) })
}

describe('AI Worker', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns 401 without the app password and does not call upstream', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const response = await worker.fetch(interpretRequest(validBody), env)

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects invalid request parameters', async () => {
    const response = await worker.fetch(interpretRequest({ ...validBody, passes: [] }, env.APP_PASSWORD), env)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request parameters' })
  })

  it('accepts valid parameters and returns only the generated text', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      choices: [{ message: { content: '象意解读内容' } }],
    }))
    const response = await worker.fetch(interpretRequest(validBody, env.APP_PASSWORD), env)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ text: '象意解读内容' })
    expect(fetchMock).toHaveBeenCalledOnce()
    const upstreamBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { messages: Array<{ content: string }> }
    expect(upstreamBody.messages[0].content).toContain('不得修改、质疑或重新计算三传结果')
  })
})
