import { describe, expect, it } from 'vitest'
import { classicSixRules } from '../../rules'
import { createDivinationInterpretation, describeElementRelation } from './interpretation'

describe('通用三传解说', () => {
  it('describes directional generating and controlling relationships', () => {
    expect(describeElementRelation('木', '火').relation).toBe('相生')
    expect(describeElementRelation('火', '木').relation).toBe('受生')
    expect(describeElementRelation('木', '土').relation).toBe('相克')
    expect(describeElementRelation('土', '木').relation).toBe('受克')
    expect(describeElementRelation('金', '金').relation).toBe('同类')
  })

  it('uses the third pass as the main conclusion and records its evidence', () => {
    const passes = [classicSixRules.palaces[0], classicSixRules.palaces[2], classicSixRules.palaces[3]] as const
    const interpretation = createDivinationInterpretation(passes)

    expect(interpretation.summary).toHaveLength(3)
    expect(interpretation.summary[0]).toContain('末传落在赤口')
    expect(interpretation.passReadings).toEqual(expect.arrayContaining([
      expect.stringContaining('初传（开端）'),
      expect.stringContaining('中传（发展）'),
      expect.stringContaining('末传（结果）'),
    ]))
    expect(interpretation.evidence.join('；')).toContain('木→火：相生')
    expect(interpretation.advice).toContain('不宜据此作绝对判断')
  })
})
