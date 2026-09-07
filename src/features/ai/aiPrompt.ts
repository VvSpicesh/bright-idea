export interface AiPromptContext {
  question: string
  systemName: string
  inputMethod: string
  originalInput: string
  passes: ReadonlyArray<{
    name: string
    element: string
    direction?: string
    keywords: readonly string[]
  }>
}

export function buildAiInterpretationPrompt(context: AiPromptContext, focusQuestion: string): string {
  const passLabels = ['初传', '中传', '末传']
  const passText = context.passes.map((pass, index) => [
    `${passLabels[index]}：${pass.name}`,
    `五行：${pass.element}`,
    `方位：${pass.direction || '未设定'}`,
    `关键词：${pass.keywords.join('、') || '未设定'}`,
  ].join('；')).join('\n')
  const focus = focusQuestion.trim() || '请综合解读整个卦象。'

  return `请辅助解读以下由程序计算完成的小六壬排盘。\n\n用户问题：${context.question}\n起课体系：${context.systemName}\n起课方式：${context.inputMethod}\n原始输入：${context.originalInput}\n\n${passText}\n\n本次希望重点询问：${focus}\n\n请分析前期、过程、结果，以及初传、中传、末传之间的关系，并说明判断依据。不得修改、质疑或重新计算程序计算出的卦象。请明确区分传统象义和现实事实，传统象义不能替代事实核验或专业意见。不得给出确定性的死亡、医疗、法律或投资结论。`
}
