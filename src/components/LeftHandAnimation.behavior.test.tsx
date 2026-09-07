import { fireEvent, render, screen, act } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateThreePasses, classicSixRules, xunNineRules } from '../rules'
import { getAnimationPath, getAnimationTiming, LEFT_PALM_IMAGE, LeftHandAnimation } from './LeftHandAnimation'

const result = calculateThreePasses(classicSixRules, [1n, 2n, 3n])
const props = { steps: result.steps, passes: [result.first, result.second, result.third] as const, palaceCount: 6 }

describe('左手掐诀播放控制', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('finishes at the engine result within the calculated duration', () => {
    vi.useFakeTimers()
    const onCompleteChange = vi.fn()
    const timing = getAnimationTiming(props.steps, props.palaceCount)
    const { container } = render(<LeftHandAnimation {...props} onCompleteChange={onCompleteChange} />)
    expect(container.querySelector('img.hand-image')?.getAttribute('src')).toBe(LEFT_PALM_IMAGE)
    expect(container.querySelector('img.hand-image')?.getAttribute('alt')).toContain('左手掌心')
    expect(container.querySelectorAll('.palace-point')).toHaveLength(6)
    expect(container.querySelector('.hand-stage')).toBeInTheDocument()
    expect(screen.getByText('初传').nextSibling).toHaveTextContent('待落宫')
    expect(screen.getByRole('button', { name: /中传\s*待落宫/ })).toBeDisabled()
    act(() => { vi.advanceTimersByTime(timing.totalDurationMs - 1) })
    expect(onCompleteChange).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.getByRole('button', { name: /初传\s*大安/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /中传\s*留连/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /末传\s*赤口/ })).toBeInTheDocument()
    expect(container.querySelectorAll('.active-marker')).toHaveLength(1)
    expect(container.querySelectorAll('.active-marker-trail')).toHaveLength(0)
    expect(onCompleteChange).toHaveBeenLastCalledWith(true)
  })

  it('skips and replays the animation', () => {
    vi.useFakeTimers()
    const onCompleteChange = vi.fn()
    render(<LeftHandAnimation {...props} onCompleteChange={onCompleteChange} />)
    fireEvent.click(screen.getByRole('button', { name: '跳过动画' }))
    expect(screen.getByRole('button', { name: /初传\s*大安/ })).toBeInTheDocument()
    expect(onCompleteChange).toHaveBeenLastCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: '重新播放' }))
    expect(screen.getAllByText('待落宫')).toHaveLength(3)
    expect(onCompleteChange).toHaveBeenLastCalledWith(false)
    act(() => { vi.advanceTimersByTime(getAnimationTiming(props.steps, props.palaceCount).totalDurationMs) })
    expect(screen.getByRole('button', { name: /末传\s*赤口/ })).toBeInTheDocument()
    expect(onCompleteChange).toHaveBeenLastCalledWith(true)
  })

  it('shows all results immediately when reduced motion is preferred', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    render(<LeftHandAnimation {...props} />)
    expect(screen.getByRole('img', { name: /掐诀动画已跳过/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /末传\s*赤口/ })).toBeInTheDocument()
  })

  it('keeps the documented nine-palace 7, 2, 12 path anchored at each landing', () => {
    const nine = calculateThreePasses(xunNineRules, [7n, 2n, 12n])
    expect([nine.first.name, nine.second.name, nine.third.name]).toEqual(['病符', '桃花', '大安'])
    expect(getAnimationPath(nine.steps[1], 9)).toEqual([6, 7])
    expect(getAnimationPath(nine.steps[2], 9)).toEqual([7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0])
    expect(getAnimationPath(nine.steps[2], 9).at(-1)).toBe(nine.steps[2].endIndex)
  })
})
