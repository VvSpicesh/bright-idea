import type { ElementRelation, ElementTransition } from './interpretation'
import type { Passes, Transitions } from './interpretationNarrative'
import { sixPalaceKnowledge, type SixPalaceKnowledge, type SixPalaceName, type SixQuestionDomain } from './sixPalaceKnowledge'
import type { SixQuestionContext } from './questionContext'

const stages = ['初传', '中传', '末传'] as const

function knowledgeFor(name: string): SixPalaceKnowledge {
  return sixPalaceKnowledge[name as SixPalaceName]
}

function domainMeaning(knowledge: SixPalaceKnowledge, domain: SixQuestionDomain): string {
  if (domain === '人物') return `问人时多表现为${knowledge.personalityMeaning}`
  if (domain === '纠纷') return `${knowledge.generalMeaning}，需把争点和责任分开确认`
  return (domain === '通用' ? undefined : knowledge.topicMeanings[domain]) ?? knowledge.generalMeaning
}

function relationMeaning(relation: ElementRelation): string {
  return {
    同类: '同五行，原有主题延续，顺处与难处都会被加强',
    相生: '前宫生后宫，前一阶段为后一阶段提供条件，事情较容易延续',
    受生: '后宫生前宫，后一阶段需要反过来投入资源，可能出现消耗或补救',
    相克: '前宫克后宫，前期条件限制后续发展',
    受克: '后宫克前宫，后续变化会推翻或纠正前面的状态',
  }[relation]
}

function polarityMeaning(from: SixPalaceKnowledge, to: SixPalaceKnowledge): string {
  const key = `${from.polarity}→${to.polarity}`
  return {
    '阳→阳': '发展较直接',
    '阳→阴': '由明确转向迟缓、隐藏或反复',
    '阴→阳': '由停滞转向行动或出现明确信息',
    '阴→阴': '问题可能继续积压，需要外部行动打破',
  }[key]!
}

function concreteAction(domain: SixQuestionDomain, finalName: string): string {
  const domainActions: Record<SixQuestionDomain, string> = {
    事业: '把岗位、负责人或交付条件写成清单，在下一次沟通前逐项确认。',
    财运: '核对合同、账目和到账节点，只对能凭据确认的部分安排资金。',
    感情: '提出一次具体而可回应的沟通安排，以实际行动而非猜测判断关系。',
    学业: '把当前目标拆成一周计划，用练习结果校正下一轮复习重点。',
    健康: '按医生安排完成检查或复诊，记录症状与检查结果的实际变化，不据此自行调整治疗。',
    出行: '重新确认票务、时间和备用路线，把可能变动的环节提前留出余量。',
    纠纷: '保留沟通、时间和费用记录，先厘清争点；需要时咨询相应专业人士。',
    寻物: '按最后使用的时间顺序分区排查，并标记已经核实的位置。',
    人物: '用一件小而可验证的合作事项观察对方的回应、边界和兑现情况。',
    通用: '列出下一步必需的事实、资源和期限，只推进其中已经确认的一项。',
  }
  const finalActions: Record<string, string> = {
    留连: '为未决事项设定明确截止时间，过期后改用备用方案。',
    赤口: '把关键约定改为书面确认，避免在情绪高涨时作出承诺。',
    空亡: '先补齐缺失的信息和必要条件，再决定是否继续投入。',
    速喜: '收到消息后当日核验条件与责任人，避免只停留在口头推进。',
  }
  return finalActions[finalName] ?? domainActions[domain]
}

function stageReading(passes: Passes, transitions: Transitions, context: SixQuestionContext, index: 0 | 1 | 2): string {
  const palace = passes[index]
  const current = knowledgeFor(palace.name)
  const subject = context.domain === '通用' ? '事情的发展' : context.domain === '人物' ? '所问之人的表现' : `${context.domain}问题`
  const base = `“${palace.name}”主${current.generalMeaning}`
  const topic = domainMeaning(current, context.domain)
  if (index === 0) return `${stages[index]}：${subject}的起点以${base}为背景；${topic}。这说明当前状态为何形成：条件较好时${current.positiveExpression}，条件不利时则${current.negativeExpression}。`
  if (index === 1) {
    const before = knowledgeFor(passes[0].name)
    return `${stages[index]}：${subject}进入${base}的变化阶段；${topic}。${relationMeaning(transitions[0].relation)}，阴阳由${before.polarity}转${current.polarity}，${polarityMeaning(before, current)}，因此重点在于辨认推动力或卡点。`
  }
  const before = knowledgeFor(passes[1].name)
  return `${stages[index]}：后续更可能落在${base}的状态；${topic}。${relationMeaning(transitions[1].relation)}，阴阳由${before.polarity}转${current.polarity}，${polarityMeaning(before, current)}；只有在${current.positiveExpression}时，这一倾向才更容易成立。`
}

function turningPoint(passes: Passes, transitions: Transitions, index: 0 | 1): string {
  const from = knowledgeFor(passes[index].name)
  const to = knowledgeFor(passes[index + 1].name)
  const theme = passes[index].name === passes[index + 1].name || transitions[index].relation === '同类'
    ? '整体主题延续'
    : `宫义由${from.generalMeaning}转向${to.generalMeaning}`
  return `${index === 0 ? '初→中' : '中→末'}（${passes[index].name}→${passes[index + 1].name}）：${theme}；${relationMeaning(transitions[index].relation)}。阴阳${from.polarity}→${to.polarity}，${polarityMeaning(from, to)}。`
}

export function createSixPalaceInterpretation(passes: Passes, transitions: Transitions, context: SixQuestionContext) {
  const finalKnowledge = knowledgeFor(passes[2].name)
  const finalMeaning = domainMeaning(finalKnowledge, context.domain)
  const summary = context.hasQuestion
    ? `针对“${context.domain}”所问，末传${passes[2].name}显示${finalMeaning}；结合前两传变化，更适合以${finalKnowledge.advice}来判断后续能否落实。`
    : `本次三传最终落在${passes[2].name}，整体以${finalKnowledge.generalMeaning}为主要倾向。未填写具体问题，补充对象后可获得更有针对性的说明。`
  const advice = [
    `围绕末传：${finalKnowledge.advice}。`,
    `针对${context.domain}：${concreteAction(context.domain, passes[2].name)}`,
    context.auxiliaryDomains.length ? `辅助领域${context.auxiliaryDomains.join('、')}仅作背景核对，不替代主领域“${context.domain}”的判断。` : undefined,
  ].filter(Boolean).join('\n')
  const healthNote = context.domain === '健康'
    ? '健康类内容仅作传统文化研究与娱乐用途，不作生命风险预测、不判断具体疾病、不承诺治疗结果；请以医生、检查结果和实际病情变化为准。'
    : '以上为传统文化研究与娱乐用途，不代表现实因果。'
  return {
    summary,
    passReadings: [stageReading(passes, transitions, context, 0), stageReading(passes, transitions, context, 1), stageReading(passes, transitions, context, 2)],
    turningPoints: [turningPoint(passes, transitions, 0), turningPoint(passes, transitions, 1)],
    advice,
    evidence: [
      `三传宫位：${passes.map((palace) => palace.name).join(' → ')}。`,
      `五行关系：初→中 ${transitions[0].from}${transitions[0].relation}${transitions[0].to}；中→末 ${transitions[1].from}${transitions[1].relation}${transitions[1].to}。`,
      `识别到的问题领域：${context.domain}${context.auxiliaryDomains.length ? `；辅助：${context.auxiliaryDomains.join('、')}` : ''}。`,
      healthNote,
    ],
  }
}
