import { fireEvent, render, screen, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateThreePasses, classicSixRules } from '../rules'
import { LeftHandAnimation } from './LeftHandAnimation'

const result = calculateThreePasses(classicSixRules, [1n, 2n, 3n])
const props = { steps: result.steps, passes: [result.first, result.second, result.third] as const, palaceCount: 6 }

describe('左手掐诀播放控制', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('plays the three passes in order and moves through multiple configured coordinates', () => {
    vi.useFakeTimers()
    const { container } = render(<LeftHandAnimation {...props} />)
    expect(screen.getByText('初传').nextSibling).toHaveTextContent('待落宫')
    act(() => { vi.advanceTimersByTime(1500) })
    expect(screen.getByRole('button', { name: /初传\s*大安/ })).toBeInTheDocument()
    expect(container.querySelectorAll('.active-marker')).toHaveLength(1)
    const firstTransform = container.querySelector('.active-marker')?.getAttribute('style')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('button', { name: /中传\s*留连/ })).toBeInTheDocument()
    expect(container.querySelector('.active-marker')?.getAttribute('style')).not.toBe(firstTransform)
    act(() => { vi.advanceTimersByTime(1300) })
    expect(screen.getByRole('button', { name: /末传\s*赤口/ })).toBeInTheDocument()
  })

  it('skips and replays the animation', () => {
    vi.useFakeTimers()
    render(<LeftHandAnimation {...props} />)
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByRole('button', { name: /初传\s*大安/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重新播放' }))
    expect(screen.getAllByText('待落宫')).toHaveLength(3)
  })

  it('shows all results immediately when reduced motion is preferred', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    render(<LeftHandAnimation {...props} />)
    expect(screen.getByRole('img', { name: /掐诀动画已跳过/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /末传\s*赤口/ })).toBeInTheDocument()
  })
})