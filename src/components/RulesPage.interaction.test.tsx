import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RulesPage } from './RulesPage'

describe('规则页折叠卡片', () => {
  it('renders six cards with only the first open and grouped day-hour cards closed', () => {
    render(<RulesPage />)
    const cards = document.querySelectorAll('.six-verse-card')
    expect(cards).toHaveLength(6)
    expect([...cards].filter((card) => card.hasAttribute('open'))).toHaveLength(1)
    expect(screen.getByText('大安起首 · 5组传统组合')).toBeInTheDocument()
    expect(document.querySelectorAll('.day-hour-group')).toHaveLength(7)
    expect(document.querySelectorAll('.day-hour-group[open]')).toHaveLength(0)
    fireEvent.click(within(cards[1] as HTMLElement).getByText('留连'))
    expect(cards[1]).toHaveAttribute('open')
    expect(document.querySelector('summary::-webkit-details-marker')).toBeNull()
  })
})
