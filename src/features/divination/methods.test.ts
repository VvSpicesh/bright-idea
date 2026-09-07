import { describe, expect, it } from 'vitest'
import { convertTimeDivination, getShichen, generateRandomInputs, parseDateTimeLocal } from './methods'

describe('随机与时间起课取数', () => {
  it('generates three secure-range values', () => {
    const values = generateRandomInputs()
    expect(values).toHaveLength(3)
    values.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(18)
    })
  })

  it.each([
    [0, '子', 1], [1, '丑', 2], [2, '丑', 2], [3, '寅', 3], [12, '午', 7], [21, '亥', 12], [22, '亥', 12], [23, '子', 1],
  ])('maps %s:00 to %s%s', (hour, name, index) => {
    expect(getShichen(hour)).toEqual({ name, index })
  })

  it('keeps the device date for the 23:00 boundary', () => {
    const beforeMidnight = convertTimeDivination('2024-02-10T22:59')
    const atEleven = convertTimeDivination('2024-02-10T23:00')
    const afterMidnight = convertTimeDivination('2024-02-11T00:59')
    expect(beforeMidnight.inputs).toEqual([1, 1, 12])
    expect(atEleven.inputs).toEqual([1, 1, 1])
    expect(afterMidnight.inputs).toEqual([1, 2, 1])
    expect(atEleven.lunarText).toContain('2024年1月1日')
  })

  it('retains the leap-month marker while using its ordinary month number', () => {
    const result = convertTimeDivination('2023-03-22T12:00')
    expect(result.leapMonth).toBe(true)
    expect(result.lunarMonth).toBe(2)
    expect(result.lunarDay).toBe(1)
    expect(result.lunarText).toBe('2023年闰2月1日')
    expect(result.inputs).toEqual([2, 1, 7])
  })

  it('parses datetime-local values in local time and rejects overflow dates', () => {
    const date = parseDateTimeLocal('2025-12-31T23:59')
    expect([date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2025, 12, 31, 23, 59])
    expect(() => parseDateTimeLocal('2025-02-30T12:00')).toThrow('有效')
  })
})
