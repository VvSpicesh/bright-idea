import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { RECORD_STORAGE_KEY } from '../features/history/types'

function enterNumbers(values: string[]) {
  values.forEach((value, index) => {
    fireEvent.click(screen.getByLabelText(`第${index + 1}数`))
    for (const digit of value) fireEvent.click(screen.getByRole('button', { name: `输入${digit}` }))
    if (index < values.length - 1) fireEvent.click(screen.getByRole('button', { name: '下一项' }))
  })
}

describe('三数起课应用流程', () => {
  beforeEach(() => localStorage.clear())
  it('uses the in-app keypad for multi-digit values and editing', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('第1数'))
    fireEvent.click(screen.getByRole('button', { name: '输入7' }))
    fireEvent.click(screen.getByRole('button', { name: '输入2' }))
    expect(screen.getByLabelText('第1数')).toHaveValue('72')
    fireEvent.click(screen.getByRole('button', { name: '退格' }))
    expect(screen.getByLabelText('第1数')).toHaveValue('7')
    fireEvent.click(screen.getByRole('button', { name: '清空' }))
    expect(screen.getByLabelText('第1数')).toHaveValue('')
    expect(screen.getByLabelText('第1数')).toHaveAttribute('readonly')
  })

  it('switches between both rule systems', () => {
    render(<App />)
    const nine = screen.getByRole('radio', { name: '九宫小六壬（荀爽体系）' })
    fireEvent.click(nine)
    expect(nine).toBeChecked()
    expect(screen.getByRole('radio', { name: '六宫小六壬' })).not.toBeChecked()
  })

  it('shows a six-palace result and keeps inputs when returning', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('所问事项 （可选）'), { target: { value: '测试事项' } })
    enterNumbers(['1', '1', '1'])
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))

    expect(screen.getByRole('heading', { name: '测试事项' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '大安' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '一句话结论' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getAllByRole('heading', { name: '大安' })).toHaveLength(3)
    expect(screen.getByRole('heading', { name: '一句话结论' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI辅助解读' })).toBeInTheDocument()
    expect(screen.queryByText('查看详细解读')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '发展过程' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '关键转折' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '行动建议' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '判断依据' })).toBeInTheDocument()
    expect(screen.getByText(/规则版本\s*0\.1\.0/)).toBeInTheDocument()
    expect(screen.queryByText('计算轨迹')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: /左手掐诀动画/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重新起课' }))
    expect(screen.getByLabelText('所问事项 （可选）')).toHaveValue('测试事项')
    expect(screen.getByLabelText('第1数')).toHaveValue('1')
  })

  it('shows a nine-palace result and rejects invalid fields', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '九宫小六壬（荀爽体系）' }))
    enterNumbers(['1', '12', '6'])
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))

    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByRole('heading', { name: '大安' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '速喜' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '桃花' })).toBeInTheDocument()
    expect(screen.getByText('病符')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重新起课' }))
    fireEvent.click(screen.getByLabelText('第1数'))
    fireEvent.click(screen.getByRole('button', { name: '清空' }))
    fireEvent.click(screen.getByRole('button', { name: '下一项' }))
    expect(screen.getByRole('button', { name: '下一项' })).toBeInTheDocument()
  })

  it('passes the edited question into a newly generated six-palace interpretation', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('所问事项 （可选）'), { target: { value: '这次求职能成功吗' } })
    enterNumbers(['1', '2', '2'])
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByText(/工作基础较明确，适合按计划推进/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重新起课' }))
    fireEvent.change(screen.getByLabelText('所问事项 （可选）'), { target: { value: '这段感情会怎么样' } })
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByText(/关系倾向持续，但发展速度不快/)).toBeInTheDocument()
    expect(screen.getByText(/针对“感情”所问/)).toBeInTheDocument()
  })

  it('starts a random divination and exposes a compact change-set action', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '随机起课' }))
    fireEvent.click(screen.getByRole('button', { name: '随机起课' }))
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))

    const source = screen.getByText(/随机三数：/)
    const values = source.textContent?.match(/\d+/g)?.map(Number) ?? []
    expect(values).toHaveLength(3)
    values.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(18)
    })
    expect(screen.getByRole('button', { name: '换一组' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重新起课' }))
    expect(screen.getByText(/当前数字：/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '沿用当前三数起课' })).toBeInTheDocument()
  })

  it('uses the selected local time for six- and nine-palace divination', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '时间起课' }))
    fireEvent.change(screen.getByLabelText('公历日期时间'), { target: { value: '2024-02-10T23:00' } })
    fireEvent.click(screen.getByRole('button', { name: '按此时间起课' }))
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByText(/公历时间：2024-02-10 23:00/)).toBeInTheDocument()
    expect(screen.getByText(/农历日期：2024年1月1日/)).toBeInTheDocument()
    expect(screen.getByText(/时辰：子/)).toBeInTheDocument()
    expect(screen.getByText(/原始数字：1、1、1/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重新起课' }))
    fireEvent.click(screen.getByRole('radio', { name: '九宫小六壬（荀爽体系）' }))
    expect(screen.getByLabelText('公历日期时间')).toHaveValue('2024-02-10T23:00')
    fireEvent.click(screen.getByRole('button', { name: '按此时间起课' }))
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByText(/九宫小六壬\s*（荀爽体系）/)).toBeInTheDocument()
  })

  it('clears mode-specific inputs and errors when switching methods', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '任意三字' }))
    fireEvent.change(screen.getByLabelText('三个汉字'), { target: { value: '天1地' } })
    fireEvent.click(screen.getByRole('button', { name: '转换并确认笔画' }))
    expect(screen.getByText('仅允许汉字和空格，标点及其他内容不能使用')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: '随机起课' }))
    expect(screen.queryByText('仅允许汉字和空格，标点及其他内容不能使用')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: '时间起课' }))
    expect(screen.queryByText('仅允许汉字和空格，标点及其他内容不能使用')).not.toBeInTheDocument()
  })

  it('opens the completed records and rules sections', () => {
    render(<App />)
    expect(screen.getByText('传统文化研究与娱乐用途，不构成现实领域的专业建议。').closest('header')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '主要导航' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '记录' }))
    expect(screen.getByRole('heading', { name: '记录' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '还没有起课记录' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '规则' }))
    expect(screen.getByRole('heading', { name: '规则' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '宫位顺序与解说配置' })).toBeInTheDocument()
  })

  it('shows corrupt local storage as a recoverable records error instead of blanking the app', () => {
    localStorage.setItem(RECORD_STORAGE_KEY, '{broken')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '记录' }))
    expect(screen.getByRole('heading', { name: '记录' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('本地记录数据已损坏')
    expect(localStorage.getItem(RECORD_STORAGE_KEY)).toBe('{broken')
  })

  it('automatically saves one record per run across rerenders and animation replay', async () => {
    const view = render(<App />)
    fireEvent.change(screen.getByLabelText('所问事项 （可选）'), { target: { value: '工作是否顺利' } })
    enterNumbers(['1', '1', '1'])
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem(RECORD_STORAGE_KEY) || '{}').records).toHaveLength(1))
    view.rerender(<App />)
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    fireEvent.click(screen.getByRole('button', { name: '重新播放' }))
    expect(JSON.parse(localStorage.getItem(RECORD_STORAGE_KEY) || '{}').records).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '记录' }))
    expect(screen.getByText('工作是否顺利')).toBeInTheDocument()
    fireEvent.click(screen.getByText('工作是否顺利'))
    expect(screen.getByText('0.1.0')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '当时的解读' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '按当前规则重新起课' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem(RECORD_STORAGE_KEY) || '{}').records).toHaveLength(2))
  })

  it('confirms three characters, uses manual strokes, and keeps confirmation on return', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '任意三字' }))
    fireEvent.change(screen.getByLabelText('三个汉字'), { target: { value: '发展顺' } })
    fireEvent.click(screen.getByRole('button', { name: '转换并确认笔画' }))

    await waitFor(() => expect(screen.getAllByLabelText('繁体字')[0]).toHaveValue('發'), { timeout: 3000 })
    expect(screen.getAllByLabelText('繁体字')[1]).toHaveValue('展')
    expect(screen.getAllByLabelText('繁体字')[2]).toHaveValue('順')
    expect(screen.getAllByText(/数据笔画/).map((element) => element.textContent)).toEqual([
      '数据笔画：12', '数据笔画：10', '数据笔画：12',
    ])
    const strokeInputs = screen.getAllByLabelText('最终笔画')
    fireEvent.change(strokeInputs[0], { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: '确认并开始起课' }))

    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(document.querySelector('.source-line')).toHaveTextContent('发展顺')
    expect(document.querySelector('.source-line')).toHaveTextContent('發展順')
    expect(screen.getAllByText(/数据 12，最终 1/)).toHaveLength(2)
    expect(screen.getByRole('heading', { name: '大安' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '重新起课' }))
    expect(screen.getByLabelText('三个汉字')).toHaveValue('发展顺')
    expect(screen.getAllByLabelText('最终笔画')[0]).toHaveValue('1')
  })

  it('completes three-character divination with the nine-palace system', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '九宫小六壬（荀爽体系）' }))
    fireEvent.click(screen.getByRole('tab', { name: '任意三字' }))
    fireEvent.change(screen.getByLabelText('三个汉字'), { target: { value: '天地人' } })
    fireEvent.click(screen.getByRole('button', { name: '转换并确认笔画' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '确认并开始起课' })).toBeEnabled(), { timeout: 3000 })
    fireEvent.click(screen.getByRole('button', { name: '确认并开始起课' }))
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByText(/九宫小六壬\s*（荀爽体系）/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '天德' })).toBeInTheDocument()
  })

  it('blocks invalid three-character content', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '任意三字' }))
    fireEvent.change(screen.getByLabelText('三个汉字'), { target: { value: '天1地' } })
    fireEvent.click(screen.getByRole('button', { name: '转换并确认笔画' }))
    expect(screen.getByText('仅允许汉字和空格，标点及其他内容不能使用')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '确认并开始起课' })).not.toBeInTheDocument()
  })
})
