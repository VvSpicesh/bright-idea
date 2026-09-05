import type { Element, Palace } from '../../rules'

export type ElementRelation = '同类' | '相生' | '相克' | '受生' | '受克'

export interface ElementTransition {
  readonly from: Element
  readonly to: Element
  readonly relation: ElementRelation
  readonly description: string
}

export interface DivinationInterpretation {
  readonly summary: readonly string[]
  readonly passReadings: readonly string[]
  readonly transitions: readonly [ElementTransition, ElementTransition]
  readonly advice: string
  readonly evidence: readonly string[]
}

const generates: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const controls: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

export function describeElementRelation(from: Element, to: Element): ElementTransition {
  if (from === to) return { from, to, relation: '同类', description: `${from}→${to}：同类` }
  if (generates[from] === to) return { from, to, relation: '相生', description: `${from}→${to}：相生（${from}生${to}）` }
  if (controls[from] === to) return { from, to, relation: '相克', description: `${from}→${to}：相克（${from}克${to}）` }
  if (generates[to] === from) return { from, to, relation: '受生', description: `${from}→${to}：受生（${to}生${from}）` }
  return { from, to, relation: '受克', description: `${from}→${to}：受克（${to}克${from}）` }
}

export function createDivinationInterpretation(passes: readonly [Palace, Palace, Palace]): DivinationInterpretation {
  const [first, second, third] = passes
  const transitions = [
    describeElementRelation(first.element, second.element),
    describeElementRelation(second.element, third.element),
  ] as const
  const firstKeywords = first.keywords.slice(0, 2).join('、')
  const secondKeywords = second.keywords.slice(0, 2).join('、')
  const thirdKeywords = third.keywords.slice(0, 2).join('、')

  return {
    summary: [
      `末传落在${third.name}，整体结果更可能围绕“${thirdKeywords}”展开。`,
      `三传由${first.name}经${second.name}至${third.name}，事情可能从“${firstKeywords}”逐步转向“${secondKeywords}”。`,
      `结合五行流转，宜把末传提示作为主要观察方向，并随实际进展调整判断。`,
    ],
    passReadings: [
      `初传（开端）：${first.name}，关键词为${first.keywords.join('、')}。`,
      `中传（发展）：${second.name}，关键词为${second.keywords.join('、')}。`,
      `末传（结果）：${third.name}，关键词为${third.keywords.join('、')}。`,
    ],
    transitions,
    advice: `可优先留意“${thirdKeywords}”相关迹象，并结合“${secondKeywords}”所示过程审慎行动；若现实条件变化，建议及时复核，不宜据此作绝对判断。`,
    evidence: [
      `宫位：初传${first.name}（${first.element}）、中传${second.name}（${second.element}）、末传${third.name}（${third.element}）`,
      `五行：${transitions[0].description}；${transitions[1].description}`,
    ],
  }
}
