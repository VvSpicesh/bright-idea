import type { Element, RuleSystemId } from '../../rules'
import { palaceSemantics } from './palaceSemantics'
import { classifySixQuestion, parseQuestion, topicLanguage, type InterpretationDirection } from './questionContext'
import { generateStageInterpretations, generateTurningPoints, synthesizeOverallTrend, type Passes } from './interpretationNarrative'
import { createSixPalaceInterpretation } from './sixPalaceInterpretation'
import { getDayHourPair } from './dayHourPairs'
import type { DivinationMethod } from './methods'

export { detectInterpretationDirection, interpretationDirections, parseQuestion } from './questionContext'
export type { InterpretationDirection } from './questionContext'
export { generateStageInterpretations, synthesizeOverallTrend } from './interpretationNarrative'

export type ElementRelation = '同类' | '相生' | '相克' | '受生' | '受克'
export interface ElementTransition {
  readonly from: Element
  readonly to: Element
  readonly relation: ElementRelation
  readonly description: string
}
export const elementGenerates: Readonly<Record<Element, Element>> = Object.freeze({ 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' })
export const elementControls: Readonly<Record<Element, Element>> = Object.freeze({ 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' })

export function describeElementRelation(from: Element, to: Element): ElementTransition {
  if (from === to) return { from, to, relation: '同类', description: `同属${from}：趋势可能延续或加强，并不一定代表变好` }
  if (elementGenerates[from] === to) return { from, to, relation: '相生', description: `${from}生${to}：前一阶段可能推动后一阶段，也可能让原有问题继续发展` }
  if (elementControls[from] === to) return { from, to, relation: '相克', description: `${from}克${to}：前期因素可能压制后续发展，使下一步不易展开` }
  if (elementGenerates[to] === from) return { from, to, relation: '受生', description: `${to}生${from}：后续条件可能对前面形成补充，让原有状态得到支撑` }
  return { from, to, relation: '受克', description: `${to}克${from}：后续变化可能反制原有状态，原来的安排可能需要调整` }
}

export function createDivinationInterpretation(passes: Passes, direction?: InterpretationDirection, question = '', ruleSystemId?: RuleSystemId, method?: DivinationMethod) {
  const context = parseQuestion(question, direction)
  const [first, second, third] = passes
  const transitions = [describeElementRelation(first.element, second.element), describeElementRelation(second.element, third.element)] as const
  if (ruleSystemId === 'classic-six') {
    const pair = method === 'time' ? getDayHourPair(second.name as keyof typeof import('./sixPalaceKnowledge').sixPalaceKnowledge, third.name as keyof typeof import('./sixPalaceKnowledge').sixPalaceKnowledge) : undefined
    return { context, transitions, ...createSixPalaceInterpretation(passes, transitions, classifySixQuestion(question, direction), pair) }
  }
  const advicePalaces = [...new Map([second, third].map((palace) => [palace.name, palace])).values()]
  const uniquePalaces = [...new Map(passes.map((palace) => [palace.name, palace])).values()]
  return {
    context,
    summary: synthesizeOverallTrend(passes, transitions, context),
    passReadings: generateStageInterpretations(passes, transitions, context),
    transitions,
    turningPoints: generateTurningPoints(passes, transitions),
    advice: advicePalaces.map((palace) => palaceSemantics[palace.name as keyof typeof palaceSemantics].advice).join('') + topicLanguage(context).action,
    traditionalHints: [],
    evidence: [
      `宫位：初传${first.name}（${first.element}）、中传${second.name}（${second.element}）、末传${third.name}（${third.element}）。`,
      `宫义关键词：${uniquePalaces.map((palace) => `${palace.name}：${palace.keywords.join('、')}`).join('；')}。`,
      `五行：初→中 ${transitions[0].description}；中→末 ${transitions[1].description}。`,
      '以上为传统象义的解释，不代表现实因果；涉及健康、法律、投资时，需依据事实和专业意见作判断。',
    ],
  }
}
