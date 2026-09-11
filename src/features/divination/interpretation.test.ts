import { describe, expect, it } from 'vitest'
import { classicSixRules, xunNineRules, type Palace } from '../../rules'
import { buildAiInterpretationPrompt } from '../ai/aiPrompt'
import { createDivinationInterpretation, describeElementRelation, generateStageInterpretations, parseQuestion, synthesizeOverallTrend } from './interpretation'
import { classifySixQuestion, interpretationDirections } from './questionContext'

const passes = [classicSixRules.palaces[5], classicSixRules.palaces[4], classicSixRules.palaces[0]] as const
const sentences = (text: string) => text.split(/[。！？]/).map((part) => part.trim()).filter(Boolean)

describe('问题驱动的三传解说', () => {
  it('generates contextual six-palace readings without changing nine-palace narration', () => {
    const [stable, delay, fast] = classicSixRules.palaces
    const work = createDivinationInterpretation([stable, delay, fast], undefined, '这次求职能成功吗？', 'classic-six')
    const love = createDivinationInterpretation([stable, delay, fast], undefined, '这段感情会复合吗？', 'classic-six')
    const nine = createDivinationInterpretation([xunNineRules.palaces[0], xunNineRules.palaces[1], xunNineRules.palaces[2]], undefined, '这次求职能成功吗？', 'xun-nine')
    expect(work.passReadings[0]).toContain('工作基础较明确')
    expect(love.passReadings[0]).toContain('关系倾向持续')
    expect(work.passReadings).not.toEqual(love.passReadings)
    expect(nine.passReadings[0]).toContain('前期：')
  })

  it('uses the exact question to distinguish work, relationship, and money readings for 大安→留连→速喜', () => {
    const [stable, delay, fast] = classicSixRules.palaces
    const questions = [
      ['这次求职能成功吗', '事业', '工作基础较明确'],
      ['这段感情会怎么样', '感情', '关系倾向持续'],
      ['这笔钱什么时候能收回来', '财运', '已有资源可以保留'],
    ] as const
    const readings = questions.map(([question]) => createDivinationInterpretation([stable, delay, fast], undefined, question, 'classic-six'))
    questions.forEach(([, domain, topicMeaning], index) => {
      expect(readings[index].summary).toContain(`针对“${domain}”所问`)
      expect(readings[index].passReadings[0]).toContain(topicMeaning)
      expect(readings[index].evidence).toContain(`识别到的问题领域：${domain}。`)
    })
    expect(new Set(readings.map((reading) => reading.passReadings.join(''))).size).toBe(3)
  })

  it('uses distinct stage roles, an independent conclusion, and actionable six-palace advice', () => {
    const [stable, delay, fast] = classicSixRules.palaces
    const reading = createDivinationInterpretation([stable, delay, fast], undefined, '这次求职能成功吗？', 'classic-six')
    expect(reading.passReadings[0]).toContain('初传')
    expect(reading.passReadings[1]).toContain('中传')
    expect(reading.passReadings[2]).toContain('末传')
    expect(reading.summary).not.toBe(reading.passReadings.join(''))
    expect(reading.advice.split('\n')).toHaveLength(2)
  })

  it('classifies element relations and falls back to generic six-palace explanation', () => {
    expect(describeElementRelation('木', '火').relation).toBe('相生')
    expect(describeElementRelation('火', '木').relation).toBe('受生')
    expect(describeElementRelation('木', '土').relation).toBe('相克')
    expect(describeElementRelation('土', '木').relation).toBe('受克')
    expect(describeElementRelation('木', '木').relation).toBe('同类')
    const reading = createDivinationInterpretation([classicSixRules.palaces[0], classicSixRules.palaces[1], classicSixRules.palaces[2]], undefined, '', 'classic-six')
    expect(reading.summary).toContain('未填写具体问题')
    expect(reading.evidence).toContain('识别到的问题领域：通用。')
    expect(classifySixQuestion('求职面试收入').domain).toBe('事业')
    expect(classifySixQuestion('求职面试收入').auxiliaryDomains).toContain('财运')
  })

  it('keeps health readings non-diagnostic and grounded in medical care', () => {
    const reading = createDivinationInterpretation(passes, undefined, '手术后身体恢复怎么样', 'classic-six')
    const output = [reading.summary, ...reading.passReadings, reading.advice, ...reading.evidence].join('')
    expect(output).toContain('医生')
    expect(output).not.toMatch(/癌症|生死|保证治愈|必然好转/)
  })

  it('retains all five directional element relationships and their plain explanations', () => {
    expect(describeElementRelation('木', '火')).toMatchObject({ relation: '相生', description: expect.stringContaining('前一阶段可能推动后一阶段') })
    expect(describeElementRelation('火', '木')).toMatchObject({ relation: '受生', description: expect.stringContaining('后续条件可能对前面形成补充') })
    expect(describeElementRelation('木', '土')).toMatchObject({ relation: '相克', description: expect.stringContaining('前期因素可能压制后续发展') })
    expect(describeElementRelation('土', '木')).toMatchObject({ relation: '受克', description: expect.stringContaining('后续变化可能反制原有状态') })
    expect(describeElementRelation('金', '金')).toMatchObject({ relation: '同类', description: expect.stringContaining('趋势可能延续或加强') })
  })

  it('parses topic and intent, respects manual overrides, and falls back for empty or unknown questions', () => {
    expect(parseQuestion('  ')).toEqual({ question: '', topic: '综合', intent: 'trend' })
    expect(parseQuestion('xyz')).toMatchObject({ topic: '综合', intent: 'trend' })
    expect(parseQuestion('何时找到工作')).toMatchObject({ topic: '工作', intent: 'timing' })
    expect(parseQuestion('能否找到工作', '感情')).toMatchObject({ topic: '感情', intent: 'outcome' })
    expect(parseQuestion('能否找到工作', '综合')).toMatchObject({ topic: '综合', intent: 'outcome' })
    expect(parseQuestion('未来感情走势')).toMatchObject({ topic: '感情', intent: 'trend' })
    for (const word of ['什么时候', '何时', '多久']) expect(parseQuestion(`${word}有结果`).intent).toBe('timing')
    for (const word of ['是否', '能否', '会不会', '可以吗', '成功吗']) expect(parseQuestion(word).intent).toBe('outcome')
    for (const word of ['怎么', '如何', '怎么办']) expect(parseQuestion(word).intent).toBe('advice')
    expect(parseQuestion('是否能成功，何时有结果').intent).toBe('timing')
  })

  it('synthesizes a short overall trajectory instead of joining stages', () => {
    const reading = createDivinationInterpretation(passes, undefined, '找工作是否成功')
    expect(reading.summary).toContain('先虚后实、由小到稳')
    expect(reading.summary).toContain('起初的条件仍可能限制中途推进')
    expect(reading.summary).toContain('中途状态可能推动收尾走向')
    expect(reading.summary).toContain('岗位和待遇得到确认')
    expect(sentences(reading.summary)).toHaveLength(2)
    expect(reading.summary).not.toBe(reading.passReadings.join(''))
    for (const stage of reading.passReadings) {
      expect(sentences(stage)).toHaveLength(3)
      for (const sentence of sentences(stage)) expect(reading.summary).not.toContain(sentence)
    }
    expect(synthesizeOverallTrend(passes, reading.transitions, reading.context)).toBe(reading.summary)
    expect(generateStageInterpretations(passes, reading.transitions, reading.context)).toEqual(reading.passReadings)
  })

  it('uses work and relationship context in every stage of 空亡→小吉→大安', () => {
    const work = createDivinationInterpretation(passes, undefined, '找工作是否成功')
    const love = createDivinationInterpretation(passes, undefined, '感情是否有进展')
    expect(work.passReadings[0]).toContain('岗位条件和待遇')
    expect(work.passReadings[1]).toContain('面试')
    expect(work.passReadings[2]).toContain('岗位落实的稳定程度')
    expect(love.passReadings[0]).toContain('关系基础')
    expect(love.passReadings[1]).toContain('联系与回应')
    expect(love.passReadings[2]).toContain('相处的稳定程度')
    work.passReadings.forEach((stage, index) => expect(stage).not.toBe(love.passReadings[index]))
    expect(work.transitions).toEqual(love.transitions)
    expect(work.evidence).toEqual(love.evidence)
    expect(createDivinationInterpretation(passes, undefined, '工作项目走势').passReadings.join('')).not.toContain('面试')
  })

  it('answers outcome, timing and advice from different angles without absolute predictions or dates', () => {
    const outcome = createDivinationInterpretation(passes, undefined, '是否能找到工作')
    const timing = createDivinationInterpretation(passes, undefined, '何时能找到工作')
    const advice = createDivinationInterpretation(passes, undefined, '如何找到工作')
    expect(outcome.summary).toContain('若问能否达成')
    expect(outcome.passReadings[2]).toContain('为条件，不能直接断定能或不能')
    expect(timing.summary).toContain('不能据此推断具体日期')
    expect(timing.passReadings[2]).toContain('偏慢')
    expect(timing.summary).not.toBe(outcome.summary)
    expect(timing.passReadings).not.toEqual(outcome.passReadings)
    expect(advice.summary).toContain('处理上宜先核实')
    expect(advice.passReadings[1]).toContain('继续、调整或暂停')
    expect(timing.summary + timing.passReadings.join('')).not.toMatch(/\d+[年月日天周]/)
  })

  it('explains repeated palaces as continuation and reinforcement', () => {
    const [stable, delay, fast] = classicSixRules.palaces
    expect(createDivinationInterpretation([stable, stable, fast]).passReadings[1]).toContain('前期状态延续')
    expect(createDivinationInterpretation([fast, delay, delay]).passReadings[2]).toContain('中途状态延续到后期')
    const all = createDivinationInterpretation([delay, delay, delay])
    expect(all.summary).toContain('同一主题持续强化')
    expect(all.passReadings[2]).toContain('主题持续且被明显强化')
    expect(new Set(all.passReadings).size).toBe(3)
    expect(all.evidence.filter((item) => item.startsWith('宫义关键词'))[0]).toBe('宫义关键词：留连：拖延、反复、纠缠。')
  })

  it('keeps complete sentences unique across sections for every built-in palace combination', () => {
    for (const first of xunNineRules.palaces) for (const middle of xunNineRules.palaces) for (const last of xunNineRules.palaces) {
      const reading = createDivinationInterpretation([first, middle, last])
      const blocks = [reading.summary, ...reading.passReadings, ...reading.turningPoints, reading.advice, reading.evidence.join('')]
      const seen = new Set<string>()
      for (const block of blocks) {
        for (const sentence of new Set(sentences(block))) {
          expect(seen.has(sentence), `${first.name}→${middle.name}→${last.name}: ${sentence}`).toBe(false)
          seen.add(sentence)
        }
        expect(block).not.toContain('undefined')
      }
      expect(reading.summary).not.toContain('关键词')
      expect(reading.passReadings.join('')).not.toContain('关键词')
    }
  })

  it('uses actual system elements and keeps direction changes out of the evidence', () => {
    const readings = [classicSixRules, xunNineRules].map((rules) => createDivinationInterpretation([rules.palaces[0], rules.palaces[1], rules.palaces[3]]))
    expect(readings[0].transitions[0].relation).toBe('相克')
    expect(readings[1].transitions[0].relation).toBe('同类')
    expect(readings[0].summary).not.toBe(readings[1].summary)
    expect(readings[0].turningPoints[1]).toContain('若纠缠的问题没有及时处理')
    const original = JSON.stringify(passes)
    for (const direction of interpretationDirections) {
      expect(createDivinationInterpretation(passes, direction, '未来如何').evidence).toEqual(createDivinationInterpretation(passes).evidence)
    }
    expect(JSON.stringify(passes)).toBe(original)
    expect(createDivinationInterpretation(passes, '健康', '何时恢复').advice).toContain('不能代替医生')
    expect(createDivinationInterpretation(passes, '财运', '能否有收益').advice).toContain('不能凭宫象判断投资收益')
  })

  it('changes the conclusion for a changed middle pass or final tendency', () => {
    const alter = (middle: Palace, last: Palace) => createDivinationInterpretation([passes[0], middle, last]).summary
    expect(alter(passes[1], passes[2])).not.toBe(alter(classicSixRules.palaces[1], passes[2]))
    expect(alter(passes[1], passes[2])).not.toBe(alter(passes[1], classicSixRules.palaces[3]))
  })

  it('exports topic and intent from the original question and retains the editable question as a supplement', () => {
    const prompt = buildAiInterpretationPrompt({ question: '何时能找到工作', interpretationDirection: '财运', systemName: '六宫', inputMethod: '三数', originalInput: '6、6、3', passes }, '重点解释行动建议')
    expect(prompt).toContain('原始所问事项：何时能找到工作')
    expect(prompt).toContain('用户问题：重点解释行动建议')
    expect(prompt).toContain('topic：财运')
    expect(prompt).toContain('intent：timing')
    expect(prompt).toContain('请以原始所问事项为主')
    expect(prompt).toContain('初传：空亡；五行：土')
    expect(prompt).toContain('不得修改、质疑或重新计算程序计算出的卦象')
  })
})
