import { fireEvent, render, screen } from '@testing-library/react'
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
})
