import { webcrypto } from 'node:crypto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { storeEncryptedGeminiKey } from '../features/ai/localGemini'
import { LocalGeminiInterpretation } from './LocalGeminiInterpretation'

const context = {
  question: '测试事项',
  systemName: '六宫小六壬',
  inputMethod: '三数起课',
  originalInput: '1、2、3',
  passes: [
    { name: '大安', element: '木', keywords: ['安定'] },
    { name: '留连', element: '土', keywords: ['拖延'] },
    { name: '赤口', element: '金', keywords: ['口舌'] },
  ],
}

describe('本机 AI 配置界面', () => {
  beforeAll(() => vi.stubGlobal('crypto', webcrypto as unknown as Crypto))
  afterAll(() => vi.unstubAllGlobals())
  beforeEach(() => localStorage.clear())

  it('sets up encrypted storage and can clear the device configuration', async () => {
    render(<LocalGeminiInterpretation context={context} />)
    fireEvent.click(screen.getByRole('button', { name: 'AI解读' }))
    fireEvent.change(screen.getByLabelText('Gemini API Key'), { target: { value: 'gemini-secret-key' } })
    fireEvent.change(screen.getByLabelText('本地解锁密码'), { target: { value: 'local-password' } })
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'local-password' } })
    fireEvent.click(screen.getByRole('button', { name: '保存并解锁' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '生成AI解读' })).toBeInTheDocument())
    expect(localStorage.getItem('bright-idea:gemini-key')).not.toContain('gemini-secret-key')
    fireEvent.click(screen.getByRole('button', { name: '清除本机AI配置' }))
    expect(localStorage.getItem('bright-idea:gemini-key')).toBeNull()
  })

  it('shows a clear error when the unlock password is wrong', async () => {
    await storeEncryptedGeminiKey('gemini-secret-key', 'local-password')
    render(<LocalGeminiInterpretation context={context} />)
    fireEvent.click(screen.getByRole('button', { name: 'AI解读' }))
    fireEvent.change(screen.getByLabelText('本地解锁密码'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: '解锁AI解读' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('密码错误，无法解锁本机 AI 配置'))
  })

  it('keeps encrypted configuration when a Gemini request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    render(<LocalGeminiInterpretation context={context} />)
    fireEvent.click(screen.getByRole('button', { name: 'AI解读' }))
    fireEvent.change(screen.getByLabelText('Gemini API Key'), { target: { value: 'gemini-secret-key' } })
    fireEvent.change(screen.getByLabelText('本地解锁密码'), { target: { value: 'local-password' } })
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'local-password' } })
    fireEvent.click(screen.getByRole('button', { name: '保存并解锁' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '生成AI解读' })).toBeInTheDocument())

    const encryptedConfiguration = localStorage.getItem('bright-idea:gemini-key')
    fireEvent.click(screen.getByRole('button', { name: '生成AI解读' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('浏览器连接被拦截'))
    expect(localStorage.getItem('bright-idea:gemini-key')).toBe(encryptedConfiguration)
  })

  it('shows the model used for a successful interpretation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({
      candidates: [{ content: { parts: [{ text: '测试解读' }] } }],
    }))
    render(<LocalGeminiInterpretation context={context} />)
    fireEvent.click(screen.getByRole('button', { name: 'AI解读' }))
    fireEvent.change(screen.getByLabelText('Gemini API Key'), { target: { value: 'gemini-secret-key' } })
    fireEvent.change(screen.getByLabelText('本地解锁密码'), { target: { value: 'local-password' } })
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'local-password' } })
    fireEvent.click(screen.getByRole('button', { name: '保存并解锁' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '生成AI解读' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '生成AI解读' }))

    await waitFor(() => expect(screen.getByText('使用模型：gemini-2.5-flash')).toBeInTheDocument())
  })
})
