export const interpretationDirections = ['综合', '感情', '工作/事业', '财运', '健康', '出行', '寻物', '学业'] as const
export type InterpretationDirection = typeof interpretationDirections[number]
export type Topic = '综合' | '感情' | '工作' | '财运' | '健康' | '出行' | '寻物' | '学业'
export type Intent = 'outcome' | 'timing' | 'advice' | 'trend'
export interface QuestionContext { question: string; topic: Topic; intent: Intent }

const directionRules: readonly [InterpretationDirection, RegExp][] = [
  ['寻物', /寻物|找回|丢失|丢了|遗失|失物|不见|找不到/],
  ['健康', /健康|身体|生病|病情|症状|医院|检查|治疗|手术|疼|痛|康复/],
  ['感情', /感情|恋爱|结婚|婚姻|复合|分手|对象|伴侣|喜欢|表白|相亲|关系/],
  ['学业', /学业|学习|考试|考研|考公|升学|成绩|论文|学校/],
  ['财运', /财运|投资|股票|基金|理财|赚钱|收入|回款|收益|借钱|还款|债务/],
  ['工作/事业', /工作|事业|求职|岗位|职位|面试|待遇|升职|跳槽|创业|项目|客户|同事|老板|公司/],
  ['出行', /出行|旅行|旅游|出差|行程|航班|车票|远行/],
]

export function detectInterpretationDirection(question: string): InterpretationDirection {
  return directionRules.find(([, pattern]) => pattern.test(question))?.[0] ?? '综合'
}

// 显式选择优先；未选择时按问题识别。多意图时优先回答时间、方法，再回答是否。
export function parseQuestion(question = '', direction?: InterpretationDirection): QuestionContext {
  const normalized = question.trim()
  const selected = direction ?? detectInterpretationDirection(normalized)
  const topic = selected === '工作/事业' ? '工作' : selected
  const intent: Intent = /什么时候|何时|多久/.test(normalized) ? 'timing'
    : /怎么|如何|怎么办/.test(normalized) ? 'advice'
      : /是否|能否|会不会|可以吗|成功吗/.test(normalized) ? 'outcome'
        : 'trend'
  return { question: normalized, topic, intent }
}

export interface TopicLanguage {
  subject: string
  foundation: string
  feedback: string
  continuity: string
  verify: string
  condition: string
  action: string
}

const languages: Record<Topic, TopicLanguage> = {
  综合: { subject: '事情的发展', foundation: '现有条件和安排', feedback: '实际进展', continuity: '后续执行', verify: '已有信息是否可靠、必要条件是否到位', condition: '计划有实际资源支持，并能持续执行', action: '把目前已确认和待确认的条件分开记录，优先处理影响下一步的一项。' },
  感情: { subject: '关系发展', foundation: '联系状况和关系基础', feedback: '联系与回应', continuity: '相处的稳定程度', verify: '联系是否有回应、双方表达的期待是否一致', condition: '双方愿意持续沟通，且行动与承诺相符', action: '可以表达一次具体的沟通需求，尊重对方回应和边界，再决定是否继续投入。' },
  工作: { subject: '工作推进', foundation: '任务条件和职责安排', feedback: '沟通与交付进展', continuity: '工作落实的持续性', verify: '任务范围、负责人和可用资源是否清楚', condition: '职责与资源明确，后续安排得到实际执行', action: '可以把负责人、交付内容和期限写清，先确认一项能验收的成果。' },
  财运: { subject: '资金变化', foundation: '收入来源和回款条件', feedback: '到账或小额收益的实际记录', continuity: '收入的持续性', verify: '收入是否到账、费用和回款约定是否有凭据', condition: '资金来源真实、回款能够核实且支出可承受', action: '先核对收支及费用，设置可承受的投入上限；不能凭宫象判断投资收益。' },
  健康: { subject: '恢复过程', foundation: '症状记录和检查信息', feedback: '检查结果与治疗反馈', continuity: '恢复情况的持续变化', verify: '症状持续多久、是否变化，以及医生如何解释检查结果', condition: '医生评估支持这一判断，且症状与复查信息相互印证', action: '记录症状和治疗反馈，按医生安排检查或复诊；本解读不能代替医生诊断，也不能据此调整治疗。' },
  出行: { subject: '行程推进', foundation: '交通、预约和出发条件', feedback: '订票、预约与路况的确认信息', continuity: '各段行程的衔接', verify: '票务、开放时间和天气是否已有可靠信息', condition: '交通与预约得到确认，并为变动留出余量', action: '出发前再次查验票务与目的地通知，准备可替换的路线和时间余量。' },
  寻物: { subject: '寻找进展', foundation: '最后见到物品的位置与线索', feedback: '排查结果和可核实的新线索', continuity: '线索的连贯性', verify: '最后一次见到物品的时间、地点能否确认', condition: '线索能被逐一验证，并有实物确认', action: '按最后使用顺序分区排查，标记已查区域并联系相关场所；不能据宫象确定位置或保证找回。' },
  学业: { subject: '学习进展', foundation: '知识基础和备考安排', feedback: '练习、测验与错题反馈', continuity: '学习效果的保持', verify: '独立完成练习的正确率与主要错因是否清楚', condition: '练习反馈能重复验证，复习安排能够坚持', action: '选一个薄弱点练习，记录错因，隔一段时间再用不同题目检查掌握程度。' },
}

export function topicLanguage(context: QuestionContext): TopicLanguage {
  if (context.topic === '工作' && /求职|岗位|职位|面试|待遇|跳槽|找工作/.test(context.question)) {
    return { ...languages.工作, subject: '求职进展', foundation: '职位信息、岗位条件和待遇', feedback: '沟通、面试或录用条件的确认', continuity: '岗位落实的稳定程度', verify: '岗位是否真实、待遇与录用条件是否明确', condition: '岗位和待遇得到确认，录用安排有可核实的依据' }
  }
  return languages[context.topic]
}
