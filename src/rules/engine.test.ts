import { describe, expect, it } from 'vitest'
import { classicSixRules, xunNineRules } from './configs'
import { calculateThreePasses } from './engine'

const names = (result: ReturnType<typeof calculateThreePasses>) =>
  [result.first.name, result.second.name, result.third.name]

describe('规则配置', () => {
  it('keeps the independent six-palace order and metadata', () => {
    expect(classicSixRules.palaces.map((palace) => palace.name)).toEqual([
      '大安', '留连', '速喜', '赤口', '小吉', '空亡',
    ])
    expect(classicSixRules.palaces.map((palace) => palace.element)).toEqual([
      '木', '土', '火', '金', '水', '土',
    ])
    expect(classicSixRules.palaces.every((palace) => palace.direction === undefined)).toBe(true)
  })

  it('keeps the independent nine-palace order and metadata', () => {
    expect(xunNineRules.palaces.map((palace) => palace.name)).toEqual([
      '大安', '留连', '速喜', '赤口', '小吉', '空亡', '病符', '桃花', '天德',
    ])
    expect(xunNineRules.palaces.map((palace) => palace.direction)).toEqual([
      '正东', '东南', '正南', '正西', '正北', '中央／内', '西南', '东北', '西北',
    ])
    expect(xunNineRules.palaces.map((palace) => palace.deity)).toEqual([
      '三清', '文昌', '雷祖', '将帅', '真武', '玉皇', '后土', '城隍', '紫微',
    ])
  })
})

describe('通用三传计算引擎', () => {
  it.each([
    [classicSixRules, [1n, 1n, 1n], ['大安', '大安', '大安']],
    [classicSixRules, [6n, 6n, 6n], ['空亡', '小吉', '赤口']],
    [classicSixRules, [7n, 1n, 1n], ['大安', '大安', '大安']],
    [xunNineRules, [1n, 12n, 6n], ['大安', '速喜', '桃花']],
    [xunNineRules, [9n, 9n, 9n], ['天德', '桃花', '病符']],
    [xunNineRules, [10n, 1n, 1n], ['大安', '大安', '大安']],
  ])('calculates documented sample %o', (ruleSystem, inputs, expected) => {
    expect(names(calculateThreePasses(ruleSystem, inputs as [bigint, bigint, bigint]))).toEqual(expected)
  })

  it('records each step with its start, input, rounds, remainder, and landing index', () => {
    const result = calculateThreePasses(classicSixRules, [8n, 2n, 7n])

    expect(result.steps).toEqual([
      { startIndex: 0, input: '8', rounds: '1', remainder: '1', endIndex: 1 },
      { startIndex: 1, input: '2', rounds: '0', remainder: '1', endIndex: 2 },
      { startIndex: 2, input: '7', rounds: '1', remainder: '0', endIndex: 2 },
    ])
    expect(result.inputs).toEqual(['8', '2', '7'])
    expect(result.ruleVersion).toBe('0.2.0')
  })

  it('uses modulo boundaries without iterative counting', () => {
    expect(names(calculateThreePasses(classicSixRules, [1n, 6n, 6n]))).toEqual(['大安', '空亡', '小吉'])
    expect(names(calculateThreePasses(classicSixRules, [7n, 1n, 1n]))).toEqual(['大安', '大安', '大安'])
    expect(names(calculateThreePasses(xunNineRules, [9n, 9n, 9n]))).toEqual(['天德', '桃花', '病符'])
  })

  it('supports very large integers and serializes them as decimal strings', () => {
    const huge = 900719925474099312345678901234567890n
    const result = calculateThreePasses(classicSixRules, [huge, 1n, 1n])

    expect(result.inputs[0]).toBe(huge.toString())
    expect(result.steps[0].input).toBe(huge.toString())
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it.each([0n, -1n])('rejects non-positive input %s', (input) => {
    expect(() => calculateThreePasses(classicSixRules, [input, 1n, 1n])).toThrow(RangeError)
  })
})
