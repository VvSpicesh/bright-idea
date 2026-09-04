import { describe, expect, it } from 'vitest'
import { getAnimationPath, getHandPoints, getPalaceJoint, NINE_HAND_POINTS, SIX_HAND_POINTS } from './LeftHandAnimation'

describe('左手掌诀映射与轨迹压缩', () => {
  it('maps all nine palaces to the specified finger joints', () => {
    expect(Object.fromEntries(Object.entries(NINE_HAND_POINTS).map(([name, point]) => [name, `${point.finger}${point.section}`]))).toEqual({
      大安: '食指中节', 留连: '食指上节', 速喜: '中指上节', 赤口: '无名指中节', 小吉: '中指下节', 空亡: '中指中节', 病符: '无名指上节', 桃花: '食指下节', 天德: '无名指下节',
    })
  })

  it('keeps every palace on the three intended fingers and away from the palm', () => {
    expect(Object.values(NINE_HAND_POINTS).every((point) => ['食指', '中指', '无名指'].includes(point.finger))).toBe(true)
    expect(Object.values(NINE_HAND_POINTS).every((point) => point.y < 210 && point.x > 100 && point.x < 230)).toBe(true)
  })

  it('uses a separate six-point ring without middle finger joints', () => {
    expect(getHandPoints(6)).toBe(SIX_HAND_POINTS)
    expect(Object.keys(SIX_HAND_POINTS)).toEqual(['大安', '留连', '速喜', '赤口', '小吉', '空亡'])
    expect(Object.values(SIX_HAND_POINTS).map((point) => point.section)).not.toContain('中节' as never)
  })

  it('starts each remainder path at the previous landing palace', () => {
    expect(getAnimationPath({ startIndex: 2, input: '5', rounds: '0', remainder: '4', endIndex: 0 }, 6)).toEqual([2, 3, 4, 5, 0])
    expect(getPalaceJoint('天德')?.finger).toBe('无名指')
  })

  it('compresses huge full circles to one remainder path', () => {
    const huge = '900719925474099312345678901234567890'
    expect(getAnimationPath({ startIndex: 0, input: huge, rounds: '150119987579016552057613116872093981', remainder: '5', endIndex: 5 }, 6)).toHaveLength(12)
  })

  it('plays every count for ordinary numbers and lands on the engine end index', () => {
    const step = { startIndex: 7, input: '12', rounds: '1', remainder: '2', endIndex: 0 }
    const path = getAnimationPath(step, 9)
    expect(path).toHaveLength(12)
    expect(path[0]).toBe(7)
    expect(path.at(-1)).toBe(step.endIndex)
  })
})