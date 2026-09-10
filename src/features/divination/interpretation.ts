import type { Element, Palace } from '../../rules'
import { palaceSemantics } from './palaceSemantics'

export const interpretationDirections = ['综合', '感情', '工作/事业', '财运', '健康', '出行', '寻物', '学业'] as const
export type InterpretationDirection = typeof interpretationDirections[number]

const directionRules: readonly [InterpretationDirection, RegExp][] = [
  ['寻物', /寻物|找回|丢失|丢了|遗失|失物|不见|找不到/],
  ['健康', /健康|身体|生病|病情|症状|医院|治疗|手术|疼|痛|康复/],
  ['感情', /感情|恋爱|结婚|婚姻|复合|分手|对象|伴侣|喜欢|表白|相亲/],
  ['学业', /学业|学习|考试|考研|考公|升学|成绩|论文|学校/],
  ['财运', /财运|投资|股票|基金|理财|赚钱|收益|借钱|还款|债务/],
  ['工作/事业', /工作|事业|求职|面试|升职|跳槽|创业|项目|客户|同事|老板|公司/],
  ['出行', /出行|旅行|旅游|出差|行程|航班|车票|远行/],
]

export function detectInterpretationDirection(question: string): InterpretationDirection {
  return directionRules.find(([, pattern]) => pattern.test(question))?.[0] ?? '综合'
}

const contexts: Record<InterpretationDirection, { subject: string; advice: string }> = {
  综合: { subject: '这件事', advice: '可以把预期与现实进展对照，再决定下一步。' },
  感情: { subject: '关系发展', advice: '可以约一次平静的沟通，问清彼此期待，观察实际行动。' },
  '工作/事业': { subject: '工作推进', advice: '可以确认负责人、交付内容和期限，先推进可完成的一项。' },
  财运: { subject: '资金安排', advice: '可以先核对收支、费用和可承受损失；不宜仅凭解读作投资决定，也无法据此预测收益。' },
  健康: { subject: '健康相关安排', advice: '可以记录不适、持续时间和变化，向医生说明；宫象不能诊断疾病或预测康复，有不适应及时就医。' },
  出行: { subject: '行程安排', advice: '可以出发前核实交通、天气和预约，预留缓冲时间与备用路线。' },
  寻物: { subject: '寻找过程', advice: '可以从最后确认物品的位置回溯，分区查找并联系相关场所；宫象不能确定物品位置或保证找回。' },
  学业: { subject: '学习与备考', advice: '可以选一个薄弱知识点练习，记录错因并安排复习。' },
}

export type ElementRelation = '同类' | '相生' | '相克' | '受生' | '受克'
export interface ElementTransition {
  readonly from: Element
  readonly to: Element
  readonly relation: ElementRelation
  readonly description: string
}
const generates: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const controls: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

export function describeElementRelation(from: Element, to: Element): ElementTransition {
  if (from === to) return { from, to, relation: '同类', description: `同属${from}：趋势可能延续或加强，并不一定代表变好` }
  if (generates[from] === to) return { from, to, relation: '相生', description: `${from}生${to}：前一阶段可能推动后一阶段，也可能让原有问题继续发展` }
  if (controls[from] === to) return { from, to, relation: '相克', description: `${from}克${to}：前期因素可能压制后续发展，使下一步不易展开` }
  if (generates[to] === from) return { from, to, relation: '受生', description: `${to}生${from}：后续条件可能对前面形成补充，让原有状态得到支撑` }
  return { from, to, relation: '受克', description: `${to}克${from}：后续变化可能反制原有状态，原来的安排可能需要调整` }
}

export function createDivinationInterpretation(passes: readonly [Palace, Palace, Palace], direction: InterpretationDirection = '综合') {
  const [first, second, third] = passes
  const meanings = passes.map((palace) => palaceSemantics[palace.name as keyof typeof palaceSemantics])
  const [start, middle, end] = meanings
  const sameFirst = first.name === second.name
  const sameLast = second.name === third.name
  const allSame = sameFirst && sameLast
  const transitions = [describeElementRelation(first.element, second.element), describeElementRelation(second.element, third.element)] as const
  const summary = allSame
    ? `${start.first}，这一主题贯穿三传且被明显强化；${end.last}。`
    : `${start.first}；${sameFirst ? '这一状态延续到中途' : middle.middle}；${sameLast ? `后期仍延续这一状态，${end.last}` : end.last}。`
  const turningPoints = transitions.map((transition, index) => {
    const from = passes[index]
    const to = passes[index + 1]
    const label = index === 0 ? '初→中' : '中→末'
    const change = from.name === to.name
      ? `${from.name}连续出现，${allSame && index === 1 ? '主题持续且被明显强化' : '说明该状态延续，未出现新的宫义转向'}`
      : `${from.name}转为${to.name}，${index === 0 ? middle.middle : end.last}`
    const link = from.name === '留连' && to.name === '赤口'
      ? '若纠缠的问题没有及时处理，拖延可能积累为不满，进而引发争执。'
      : '这表示关注点随阶段变化，具体是否发生仍需核对现实情况。'
    return `${label}：${change}。${transition.description}。${from.name === to.name ? '' : link}`
  })
  return {
    summary: `${contexts[direction].subject}：${summary}`,
    passReadings: [
      `前期：${start.first}。`,
      `过程：${sameFirst ? '前期状态延续，暂未出现新的宫义转向，可检查原来的安排是否仍有效' : middle.middle}。`,
      `结果：${allSame ? '同一主题持续且被明显强化，其影响可能更突出' : sameLast ? '中途状态延续到后期，收尾仍需处理同一类问题' : end.last}。`,
    ],
    transitions,
    turningPoints,
    advice: [...new Set([middle.advice, end.advice]), contexts[direction].advice].join(''),
    evidence: [
      `宫位：初传${first.name}（${first.element}）、中传${second.name}（${second.element}）、末传${third.name}（${third.element}）。`,
      `五行：初→中 ${transitions[0].description}；中→末 ${transitions[1].description}。`,
      '以上是传统象义的阶段性解释，不代表现实因果；涉及健康、法律、投资时需依据事实和专业意见判断。',
    ],
  }
}
