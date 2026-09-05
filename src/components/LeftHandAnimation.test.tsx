import { describe, expect, it } from 'vitest'
import { getAnimationPath, getHandPoints, getPalaceJoint, NINE_HAND_POINTS, SIX_HAND_POINTS } from './LeftHandAnimation'

describe('左手掌诀映射与轨迹压缩', () => {
  it('maps all nine palaces to the specified finger joints', () => {
    expect(Object.fromEntries(Object.entries(NINE_HAND_POINTS).map(([name, point]) => [name, `${point.finger}.${point.segment}`]))).toEqual({
      大安: 'index.middle', 留连: 'index.upper', 速喜: 'middle.upper', 赤口: 'ring.middle', 小吉: 'middle.lower', 空亡: 'middle.middle', 病符: 'ring.upper', 桃花: 'index.lower', 天德: 'ring.lower',
    })
  })

  it('uses the current six-palace and nine-palace coordinates on the three intended fingers', () => {
    expect(Object.fromEntries(Object.entries(SIX_HAND_POINTS).map(([name, point]) => [name, [point.x, point.y]]))).toEqual({
      大安: [36, 41], 留连: [36, 22], 速喜: [53, 14], 赤口: [70, 22], 小吉: [70, 43], 空亡: [53, 40],
    })
    expect(Object.fromEntries(Object.entries(NINE_HAND_POINTS).map(([name, point]) => [name, [point.x, point.y]]))).toEqual({
      留连: [36, 22], 大安: [36, 31], 桃花: [36, 41], 速喜: [53, 14], 空亡: [53, 27], 小吉: [53, 40], 病符: [70, 22], 赤口: [70, 33], 天德: [70, 43],
    })
    expect(new Set([...Object.values(SIX_HAND_POINTS), ...Object.values(NINE_HAND_POINTS)].map((point) => point.finger))).toEqual(new Set(['index', 'middle', 'ring']))
  })

  it('uses a separate six-point ring without middle finger joints', () => {
    expect(getHandPoints(6)).toBe(SIX_HAND_POINTS)
    expect(Object.keys(SIX_HAND_POINTS)).toEqual(['大安', '留连', '速喜', '赤口', '小吉', '空亡'])
    expect(Object.values(SIX_HAND_POINTS).map((point) => point.segment)).not.toContain('middle' as never)
  })

  it('starts each remainder path at the previous landing palace', () => {
    expect(getAnimationPath({ startIndex: 2, input: '5', rounds: '0', remainder: '4', endIndex: 0 }, 6)).toEqual([2, 3, 4, 5, 0])
    expect(getPalaceJoint('天德')?.finger).toBe('ring')
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

  it('keeps the existing hand image and places no palace on the little finger', () => {
    expect(Object.values(NINE_HAND_POINTS).some((point) => (point.finger as string) === 'little')).toBe(false)
  })
})