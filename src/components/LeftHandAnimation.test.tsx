import { describe, expect, it } from 'vitest'
import { getCompressedPath, getPalaceJoint, PALACE_JOINTS } from './LeftHandAnimation'

describe('左手掌诀映射与轨迹压缩', () => {
  it('maps all nine palaces to the specified finger joints', () => {
    expect(Object.fromEntries(Object.entries(PALACE_JOINTS).map(([name, point]) => [name, `${point.finger}${point.section}`]))).toEqual({
      大安: '食指中节', 留连: '食指上节', 速喜: '中指上节', 赤口: '无名指中节', 小吉: '中指下节', 空亡: '中指中节', 病符: '无名指上节', 桃花: '食指下节', 天德: '无名指下节',
    })
  })

  it('starts each remainder path at the previous landing palace', () => {
    expect(getCompressedPath({ startIndex: 2, input: '5', rounds: '0', remainder: '4', endIndex: 0 }, 6)).toEqual([2, 3, 4, 5, 0])
    expect(getPalaceJoint('天德')?.finger).toBe('无名指')
  })

  it('compresses huge full circles to one remainder path', () => {
    const huge = '900719925474099312345678901234567890'
    expect(getCompressedPath({ startIndex: 0, input: huge, rounds: '150119987579016552057613116872093981', remainder: '5', endIndex: 5 }, 6)).toHaveLength(6)
  })
})