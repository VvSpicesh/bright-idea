import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('应用壳', () => {
  it('renders the product shell without fabricated divination results', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'bright-idea' })).toBeInTheDocument()
    expect(screen.getByText('传统文化研究与娱乐用途，不构成现实领域的专业建议。')).toBeInTheDocument()
    expect(screen.queryByText('初传')).not.toBeInTheDocument()
  })

  it('exposes accessible labels for bottom navigation', () => {
    render(<App />)

    expect(screen.getByRole('navigation', { name: '主要导航' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '起课' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '记录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '规则' })).toBeInTheDocument()
  })
})
