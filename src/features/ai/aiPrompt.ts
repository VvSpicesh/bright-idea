import { parseQuestion, type InterpretationDirection } from '../divination/questionContext'

export interface AiPromptContext {
  interpretationDirection?: InterpretationDirection
  question: string
  systemName: string
  inputMethod: string
  originalInput: string
  sourceDetails?: string
  passes: ReadonlyArray<{
    name: string
    element: string
    direction?: string
    keywords: readonly string[]
  }>
}

export function buildAiInterpretationPrompt(context: AiPromptContext, aiQuestion: string): string {
  const passLabels = ['初传', '中传', '末传']
  const passText = context.passes.map((pass, index) => [
    `${passLabels[index]}：${pass.name}`,
    `五行：${pass.element}`,
    `方位：${pass.direction || '未设定'}`,
    `关键词：${pass.keywords.join('、') || '未设定'}`,
  ].join('；')).join('\n')
  const question = aiQuestion.trim() || '未填写具体问题，请做综合卦象解读。'
  const parsed = parseQuestion(context.question, context.interpretationDirection)

  const sourceDetails = (context.sourceDetails ? `\n来源信息：${context.sourceDetails}` : '') + `\n原始所问事项：${context.question.trim() || '未填写'}\n当前解读方向：${context.interpretationDirection ?? parsed.topic}（只调整解释语境，不改变宫义和吉凶依据）\ntopic：${parsed.topic}\nintent：${parsed.intent}\n请以原始所问事项为主，用户问题作为补充关注点；topic 和 intent 只调整表达角度，不替代原始问题。时间类问题只说明偏快、拖延或分阶段出现，不推断具体日期；是否类问题使用倾向与成立条件，不作绝对预测。`
  return `请辅助解读以下由程序计算完成的小六壬排盘。\n\n用户问题：${question}\n起课体系：${context.systemName}\n起课方式：${context.inputMethod}\n原始输入：${context.originalInput}${sourceDetails}\n\n${passText}\n\n请分析前期、过程、结果，以及初传、中传、末传之间的关系，并说明判断依据。不得修改、质疑或重新计算程序计算出的卦象。请明确区分传统象义和现实事实，传统象义不能替代事实核验或专业意见。不得给出确定性的死亡、医疗、法律或投资结论。`
}
