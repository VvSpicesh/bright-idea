import { describe, expect, it } from 'vitest'
import { derivedSamePairs, getDayHourPair, traditionalPairs } from './dayHourPairs'
import { sixPalaceKnowledge } from './sixPalaceKnowledge'

describe('六宫日时双宫', () => {
  it('contains 30 ordered traditional pairs and six derived same pairs', () => {
    expect(traditionalPairs).toHaveLength(30)
    expect(new Set(traditionalPairs.map((pair) => `${pair.dayPalace}+${pair.hourPalace}`)).size).toBe(30)
    expect(derivedSamePairs).toHaveLength(6)
    expect(derivedSamePairs.every((pair) => pair.sourceType === 'derived' && pair.dayPalace === pair.hourPalace)).toBe(true)
  })

  it('keeps order and does not provide pairs outside the six-palace set', () => {
    const names = Object.keys(sixPalaceKnowledge)
    expect(getDayHourPair(names[0] as keyof typeof sixPalaceKnowledge, names[1] as keyof typeof sixPalaceKnowledge)?.hourPalace).toBe(names[1])
    expect(getDayHourPair(names[1] as keyof typeof sixPalaceKnowledge, names[0] as keyof typeof sixPalaceKnowledge)?.dayPalace).toBe(names[1])
  })
})
