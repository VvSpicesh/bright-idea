import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { classicSixRules, xunNineRules } from '../rules'
import { palaceSemantics } from '../features/divination/palaceSemantics'
import { RulesPage } from './RulesPage'

describe('规则页面', () => {
  it('reads both current rule systems and interpretation configuration', () => {
    render(<RulesPage />)
    expect(screen.getByText('版本 0.1.0')).toBeInTheDocument()
    let cards = document.querySelectorAll('.palace-rule-card')
    expect(cards).toHaveLength(classicSixRules.palaces.length)
    expect(within(cards[0] as HTMLElement).getByText(classicSixRules.palaces[0].keywords.join('、'))).toBeInTheDocument()
    expect(within(cards[0] as HTMLElement).getByText(palaceSemantics.大安.first)).toBeInTheDocument()
    expect(within(cards[0] as HTMLElement).getByText('未设定')).toBeInTheDocument()
    expect(screen.getByText('结果：空亡 → 小吉 → 赤口')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '九宫小六壬（荀爽体系）' }))
    cards = document.querySelectorAll('.palace-rule-card')
    expect(cards).toHaveLength(xunNineRules.palaces.length)
    expect(within(cards[6] as HTMLElement).getByRole('heading', { name: '病符' })).toBeInTheDocument()
    expect(within(cards[6] as HTMLElement).getByText(palaceSemantics.病符.advice)).toBeInTheDocument()
    expect(screen.getByText('结果：大安 → 速喜 → 桃花')).toBeInTheDocument()
  })
})
