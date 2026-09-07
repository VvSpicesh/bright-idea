import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAiInterpretationPrompt } from '../features/ai/aiPrompt'
import { LocalGeminiInterpretation } from './LocalGeminiInterpretation'

const context = {
  question: '合作是否适合继续？',
  systemName: '六宫小六壬',
  inputMethod: '三数起课',
  originalInput: '1、2、3',
  passes: [
    { name: '大安', element: '木', keywords: ['安定'], direction: '正东' },
    { name: '留连', element: '土', keywords: ['拖延'] },
    { name: '赤口', element: '金', keywords: ['口舌'], direction: '正西' },
  ],
}

describe('AI 提示词导出', () => {
  const writeText = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    writeText.mockReset()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
  })

  it('builds a complete prompt and uses the required text when its editable question is empty', () => {
    const prompt = buildAiInterpretationPrompt(context, '')

    expect(prompt).toContain('用户问题：未填写具体问题，请做综合卦象解读。')
    expect(prompt).toContain('起课体系：六宫小六壬')
    expect(prompt).toContain('起课方式：三数起课')
    expect(prompt).toContain('原始输入：1、2、3')
    expect(prompt).toContain('初传：大安；五行：木；方位：正东；关键词：安定')
    expect(prompt).toContain('中传：留连；五行：土；方位：未设定；关键词：拖延')
    expect(prompt).toContain('末传：赤口；五行：金；方位：正西；关键词：口舌')
    expect(prompt).toContain('分析前期、过程、结果，以及初传、中传、末传之间的关系')
    expect(prompt).toContain('不得修改、质疑或重新计算程序计算出的卦象')
    expect(prompt).toContain('区分传统象义和现实事实')
    expect(prompt).toContain('不得给出确定性的死亡、医疗、法律或投资结论')
  })

  it('prefills the editable question and resets it for a new divination', () => {
    const { rerender } = render(<LocalGeminiInterpretation context={context} />)
    const input = screen.getByLabelText('给AI的问题')
    expect(input).toHaveValue('合作是否适合继续？')

    fireEvent.change(input, { target: { value: '只关注短期风险' } })
    expect(input).toHaveValue('只关注短期风险')

    const nextContext = { ...context, question: '新项目是否适合启动？', originalInput: '4、5、6' }
    rerender(<LocalGeminiInterpretation context={nextContext} />)
    expect(screen.getByLabelText('给AI的问题')).toHaveValue('新项目是否适合启动？')

    rerender(<LocalGeminiInterpretation context={{ ...nextContext, question: '', originalInput: '7、8、9' }} />)
    expect(screen.getByLabelText('给AI的问题')).toHaveValue('')
  })

  it('copies the current prompt before opening the selected AI site', async () => {
    const calls: string[] = []
    writeText.mockImplementation(async () => { calls.push('copy') })
    const open = vi.spyOn(window, 'open').mockImplementation(() => { calls.push('open'); return null })
    render(<LocalGeminiInterpretation context={context} />)
    fireEvent.change(screen.getByLabelText('给AI的问题'), { target: { value: '重点看合作风险' } })

    fireEvent.click(screen.getByRole('button', { name: 'ChatGPT' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('提示词已复制，请在AI中粘贴发送'))
    expect(calls).toEqual(['copy', 'open'])
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('用户问题：重点看合作风险'))
    expect(open).toHaveBeenCalledWith('https://chatgpt.com/', '_blank', 'noopener,noreferrer')
  })

  it('shows the complete prompt for long-press copying when clipboard access fails', async () => {
    writeText.mockRejectedValue(new Error('Clipboard unavailable'))
    vi.spyOn(window, 'open').mockReturnValue(null)
    render(<LocalGeminiInterpretation context={context} />)

    fireEvent.click(screen.getByRole('button', { name: 'Gemini' }))

    const promptField = await screen.findByLabelText('可手动复制的提示词')
    expect(promptField).toHaveValue(buildAiInterpretationPrompt(context, context.question))
    expect(screen.getByRole('status')).toHaveTextContent('自动复制失败，请长按下方提示词手动复制')
    expect(window.open).toHaveBeenCalledWith('https://gemini.google.com/app', '_blank', 'noopener,noreferrer')
  })
})
