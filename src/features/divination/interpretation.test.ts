import { describe, expect, it } from 'vitest'
import { classicSixRules, xunNineRules } from '../../rules'
import { buildAiInterpretationPrompt } from '../ai/aiPrompt'
import { createDivinationInterpretation, describeElementRelation, detectInterpretationDirection, interpretationDirections } from './interpretation'
import { palaceSemantics } from './palaceSemantics'

describe('白话三传解说', () => {
  it('explains all five directional element relationships', () => {
    expect(describeElementRelation('木', '火')).toMatchObject({ relation: '相生', description: expect.stringContaining('前一阶段可能推动后一阶段') })
    expect(describeElementRelation('火', '木')).toMatchObject({ relation: '受生', description: expect.stringContaining('后续条件可能对前面形成补充') })
    expect(describeElementRelation('木', '土')).toMatchObject({ relation: '相克', description: expect.stringContaining('前期因素可能压制后续发展') })
    expect(describeElementRelation('土', '木')).toMatchObject({ relation: '受克', description: expect.stringContaining('后续变化可能反制原有状态') })
    expect(describeElementRelation('金', '金')).toMatchObject({ relation: '同类', description: expect.stringContaining('趋势可能延续或加强') })
  })

  it('connects 大安→留连→赤口 and preserves actual system elements', () => {
    const readings = [classicSixRules, xunNineRules].map((rules) => createDivinationInterpretation([rules.palaces[0], rules.palaces[1], rules.palaces[3]]))
    for (const reading of readings) {
      expect(reading.summary).toContain('开始有一定基础')
      expect(reading.summary).toContain('中途容易拖延和反复')
      expect(reading.summary).toContain('争执或关系紧张')
      expect(reading.turningPoints[1]).toContain('若纠缠的问题没有及时处理')
      expect(reading.passReadings).toHaveLength(3)
      expect(JSON.stringify(reading)).not.toContain('关键词为')
    }
    expect(readings[0].transitions[0].relation).toBe('相克')
    expect(readings[1].transitions[0].relation).toBe('同类')
  })

  it('handles consecutive identical palaces without repeating stage meanings', () => {
    const [stable, delay, fast] = classicSixRules.palaces
    expect(createDivinationInterpretation([stable, stable, fast]).passReadings[1]).toContain('前期状态延续')
    expect(createDivinationInterpretation([fast, delay, delay]).passReadings[2]).toContain('中途状态延续到后期')
    const all = createDivinationInterpretation([delay, delay, delay])
    expect(all.summary).toContain('主题贯穿三传且被明显强化')
    expect(all.passReadings[2]).toContain('主题持续且被明显强化')
    expect(all.passReadings.join('')).not.toContain(palaceSemantics.留连.middle)
    expect(createDivinationInterpretation([stable, fast, stable]).summary).not.toContain('贯穿三传')
  })

  it('covers nine palaces and keeps meanings and evidence independent of direction', () => {
    expect(Object.keys(palaceSemantics)).toHaveLength(9)
    for (const palace of xunNineRules.palaces) {
      const passes = [palace, palace, palace] as const
      const general = createDivinationInterpretation(passes)
      for (const direction of interpretationDirections) {
        const reading = createDivinationInterpretation(passes, direction)
        expect(reading.passReadings).toEqual(general.passReadings)
        expect(reading.evidence).toEqual(general.evidence)
        expect(reading.turningPoints).toEqual(general.turningPoints)
        expect(reading.summary).not.toContain('undefined')
        expect(reading.advice).toContain(palaceSemantics[palace.name as keyof typeof palaceSemantics].advice)
      }
    }
    const passes = [xunNineRules.palaces[6], xunNineRules.palaces[7], xunNineRules.palaces[8]] as const
    expect(createDivinationInterpretation(passes, '健康').advice).toContain('不能诊断疾病或预测康复')
    expect(createDivinationInterpretation(passes, '财运').advice).toContain('无法据此预测收益')
  })

  it('detects directions and exports selection alongside computed results', () => {
    const questions = ['今天怎么样', '能否复合', '工作项目进度', '投资收益', '身体康复', '旅行顺利吗', '丢失的钥匙', '考试成绩']
    expect(questions.map(detectInterpretationDirection)).toEqual(interpretationDirections)
    expect(detectInterpretationDirection('')).toBe('综合')
    const prompt = buildAiInterpretationPrompt({ question: '工作如何', interpretationDirection: '财运', systemName: '六宫', inputMethod: '三数', originalInput: '1、2、3', passes: classicSixRules.palaces.slice(0, 3) }, '工作如何')
    expect(prompt).toContain('当前解读方向：财运')
    expect(prompt).toContain('初传：大安；五行：木')
    expect(prompt).toContain('不得修改、质疑或重新计算程序计算出的卦象')
  })
})
