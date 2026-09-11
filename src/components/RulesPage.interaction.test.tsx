import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RulesPage } from './RulesPage'
import { RULE_SECTIONS } from './rulesSections'

describe('规则页折叠卡片', () => {
  it('renders six cards with only the first open and grouped day-hour cards closed', () => {
    render(<RulesPage />)
    const cards = document.querySelectorAll('.six-verse-card')
    expect(cards).toHaveLength(6)
    expect(document.querySelector('.six-verse-grid')).toHaveClass('six-verse-grid')
    expect(document.querySelector('.day-hour-groups')).toHaveClass('day-hour-groups')
    expect([...cards].filter((card) => card.hasAttribute('open'))).toHaveLength(1)
    expect(screen.getByText('大安起首 · 5组传统组合')).toBeInTheDocument()
    expect(document.querySelectorAll('.day-hour-group')).toHaveLength(7)
    expect(document.querySelectorAll('.day-hour-group[open]')).toHaveLength(0)
    expect(screen.getByText('日时双宫仅用于六宫时间起课。传统口诀存在流派差异，方位、时效和结果只作传统文化参考，不作确定判断。')).toHaveClass('error-text')
    expect(screen.getByText('健康类内容不能用于疾病诊断、疗效判断或生死预测，请以医生和实际检查结果为准。')).toHaveClass('error-text')
    expect(screen.getAllByText('寻物').length).toBeGreaterThan(0)
    expect(screen.getAllByText('行人消息').length).toBeGreaterThan(0)
    expect(screen.getAllByText('求财').length).toBeGreaterThan(0)
    expect(screen.getAllByText('纠纷官事').length).toBeGreaterThan(0)
    expect(screen.getAllByText('婚恋合作').length).toBeGreaterThan(0)
    expect(screen.getAllByText('健康').length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/lostProperty|travelerMessage|wealth|dispute|relationship|health|traditional|derived/)
    fireEvent.click(within(cards[1] as HTMLElement).getByText('留连'))
    expect(cards[1]).toHaveAttribute('open')
    expect(document.querySelector('summary::-webkit-details-marker')).toBeNull()
  })

  it('renders a navigable directory for every configured section', () => {
    const scrollIntoView = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    render(<RulesPage />)
    const items = document.querySelectorAll('.rules-desktop-toc .rules-toc-list button')
    expect(items).toHaveLength(4)
    RULE_SECTIONS.forEach(({ id }) => expect(document.getElementById(id)).toBeInTheDocument())
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id).filter(Boolean)
    expect(new Set(ids).size).toBe(ids.length)
    fireEvent.click(items[1])
    expect(scrollIntoView).toHaveBeenCalled()
    expect(window.location.hash).toBe(`#${RULE_SECTIONS[1].id}`)
    expect(items[1]).toHaveClass('is-active')
  })

  it('supports the mobile directory and hash entry point', async () => {
    const scrollIntoView = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    window.history.replaceState(null, '', `#${RULE_SECTIONS[3].id}`)
    render(<RulesPage />)
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
    const nav = document.querySelector('.rules-mobile-toc .rules-toc') as HTMLElement
    const toggle = nav.querySelector('.rules-toc-toggle') as HTMLButtonElement
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(nav.querySelectorAll('.rules-toc-list button')[2])
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    window.history.replaceState(null, '', '/')
  })
})
