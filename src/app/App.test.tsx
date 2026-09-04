import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('三数起课应用流程', () => {
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
    fireEvent.change(screen.getByLabelText('第1数'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('第2数'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('第3数'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))

    expect(screen.getByRole('heading', { name: '测试事项' })).toBeInTheDocument()
    expect(screen.getAllByText('大安')).toHaveLength(3)
    expect(screen.getByText(/规则版本\s*0\.1\.0/)).toBeInTheDocument()
    expect(screen.getAllByText(/从1号宫起数，输入 1/)).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: '返回修改' }))
    expect(screen.getByLabelText('所问事项 （可选）')).toHaveValue('测试事项')
    expect(screen.getByLabelText('第1数')).toHaveValue('1')
  })

  it('shows a nine-palace result and rejects invalid fields', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '九宫小六壬（荀爽体系）' }))
    fireEvent.change(screen.getByLabelText('第1数'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('第2数'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('第3数'), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))

    expect(screen.getAllByText('大安')).toHaveLength(1)
    expect(screen.getByText('速喜')).toBeInTheDocument()
    expect(screen.getByText('桃花')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回修改' }))
    fireEvent.change(screen.getByLabelText('第1数'), { target: { value: '-1' } })
    fireEvent.change(screen.getByLabelText('第2数'), { target: { value: '1.2' } })
    fireEvent.change(screen.getByLabelText('第3数'), { target: { value: '1e3' } })
    fireEvent.click(screen.getByRole('button', { name: '开始起课' }))
    expect(screen.getAllByText('仅支持正整数，不含小数或符号')).toHaveLength(3)
  })

  it('allows navigation to unfinished sections', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: '主要导航' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '记录' }))
    expect(screen.getByText('记录功能后续开放。')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '规则' }))
    expect(screen.getByText('规则说明后续开放。')).toBeInTheDocument()
  })

  it('confirms three characters, uses manual strokes, and keeps confirmation on return', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: '任意三字' }))
    fireEvent.change(screen.getByLabelText('三个汉字'), { target: { value: '发展顺' } })
    fireEvent.click(screen.getByRole('button', { name: '转换并确认笔画' }))

    await waitFor(() => expect(screen.getAllByLabelText('繁体字')[0]).toHaveValue('發'))
    expect(screen.getAllByLabelText('繁体字')[1]).toHaveValue('展')
    expect(screen.getAllByLabelText('繁体字')[2]).toHaveValue('順')
    expect(screen.getAllByText(/数据笔画/).map((element) => element.textContent)).toEqual([
      '数据笔画：12', '数据笔画：10', '数据笔画：12',
    ])
    const strokeInputs = screen.getAllByLabelText('最终笔画')
    fireEvent.change(strokeInputs[0], { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: '确认并开始起课' }))

    expect(document.querySelector('.source-line')).toHaveTextContent('发展顺')
    expect(document.querySelector('.source-line')).toHaveTextContent('發展順')
    expect(screen.getAllByText(/数据 12，最终 1/)).toHaveLength(2)
    expect(screen.getAllByText('大安')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '返回修改' }))
    expect(screen.getByLabelText('三个汉字')).toHaveValue('发展顺')
    expect(screen.getAllByLabelText('最终笔画')[0]).toHaveValue('1')
  })

  it('completes three-character divination with the nine-palace system', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: '九宫小六壬（荀爽体系）' }))
    fireEvent.click(screen.getByRole('tab', { name: '任意三字' }))
    fireEvent.change(screen.getByLabelText('三个汉字'), { target: { value: '天地人' } })
    fireEvent.click(screen.getByRole('button', { name: '转换并确认笔画' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '确认并开始起课' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: '确认并开始起课' }))
    expect(screen.getByText(/九宫小六壬\s*（荀爽体系）/)).toBeInTheDocument()
    expect(screen.getByText('天德')).toBeInTheDocument()
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
