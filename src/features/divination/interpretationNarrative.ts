import type { Palace } from '../../rules'
import type { ElementRelation, ElementTransition } from './interpretation'
import { palaceSemantics } from './palaceSemantics'
import { topicLanguage, type QuestionContext } from './questionContext'

export type Passes = readonly [Palace, Palace, Palace]
export type Transitions = readonly [ElementTransition, ElementTransition]
type PalaceName = keyof typeof palaceSemantics

// 只描述宫义的走势特征，不赋予新的吉凶分数或修改五行。
const outlook: Record<PalaceName, { state: string; ending: string; pace: string; kind: 'support' | 'difficulty' | 'mixed' }> = {
  大安: { state: '基础逐步稳固', ending: '较有可能缓慢落实并保持稳定', pace: '偏慢，需要逐步确认和积累', kind: 'support' },
  留连: { state: '进度受到牵制', ending: '更偏向继续等待和处理遗留问题', pace: '容易拖延，可能需要多轮确认', kind: 'difficulty' },
  速喜: { state: '反馈突然加快', ending: '较有机会出现积极消息，但消息不等于完成', pace: '反馈可能偏快，落实仍需另行确认', kind: 'support' },
  赤口: { state: '分歧逐渐突出', ending: '更需防范摩擦升级，落实可能受沟通影响', pace: '可能被分歧打断，难以按原计划完成', kind: 'difficulty' },
  小吉: { state: '小进展开始出现', ending: '偏向有限进展，不宜放大预期', pace: '更可能分阶段出现小进展', kind: 'support' },
  空亡: { state: '条件尚未落实', ending: '仍有落空的可能，暂不宜把期待当作结果', pace: '缺少落地条件，暂难判断何时落实', kind: 'difficulty' },
  病符: { state: '薄弱处需要修整', ending: '更可能进入持续排查与修复的阶段', pace: '修整可能拉长过程，需要根据反馈调整节奏', kind: 'difficulty' },
  桃花: { state: '牵挂影响判断', ending: '可能仍受人情与期待牵动，需要厘清边界', pace: '容易受牵挂和选择影响，节奏可能不一', kind: 'mixed' },
  天德: { state: '外部支持增多', ending: '有望借助支持改善处境，但仍要落实到行动', pace: '取决于支持何时到位，宜分阶段确认', kind: 'support' },
}

function profile(palace: Palace) { return outlook[palace.name as PalaceName] }
function meaning(palace: Palace) { return palaceSemantics[palace.name as PalaceName] }

export function describeOverallTrajectory(passes: Passes): string {
  const [first, middle, last] = passes
  if (first.name === middle.name && middle.name === last.name) return `同一主题持续强化，${profile(last).state}`
  if (first.name === middle.name) return `前段状态延续，随后转向${profile(last).state}`
  if (middle.name === last.name) return `前段发生变化，后段持续表现为${profile(last).state}`
  if (first.name === '空亡' && middle.name === '小吉' && last.name === '大安') return '先虚后实、由小到稳'
  if (first.name === '大安' && middle.name === '留连' && last.name === '赤口') return '由稳转滞，积压的问题可能转成分歧'
  if (first.name === '速喜' && (middle.name === '留连' || last.name === '大安')) return '先快后慢，早期反馈与最终落实存在间隔'
  if (middle.name === '留连' && last.name === '大安') return '反复后有望落定'
  if (profile(first).kind === 'difficulty' && profile(last).kind === 'support') {
    return profile(middle).kind === 'support' ? '先难后易，中途出现的机会有望逐步接续' : '前中段仍有阻力，后段才有改善空间'
  }
  if (profile(first).kind === 'support' && profile(last).kind === 'difficulty') {
    return profile(middle).kind === 'difficulty' ? '起初可推进，中途受阻后收尾压力增加' : '前段尚有进展，收尾时更需防范受阻'
  }
  if (first.name === last.name) return `中途虽有${profile(middle).state}的变化，收尾仍可能回到原有主题`
  if (profile(middle).kind === 'difficulty' && profile(last).kind === 'support') return '推进中有波折，处理阻力后仍有接续进展的空间'
  if (profile(first).kind === 'support' && profile(middle).kind === 'support' && profile(last).kind === 'support') return '有利条件逐段衔接，小步落实比一次到位更可期待'
  if (profile(first).kind === 'difficulty' && profile(middle).kind === 'difficulty' && profile(last).kind === 'difficulty') return '困难可能接续出现，尚缺少明确的缓解环节'
  if (profile(middle).kind === 'support') return '中途虽有改善窗口，仍需防止短暂进展被后续牵制'
  return '推进与牵绊交错，需要先理清影响执行的条件再判断能走多远'
}

const summaryLinks: Record<ElementRelation, readonly [string, string]> = {
  同类: ['前段倾向延续', '后段会放大已有趋势'],
  相生: ['前段会给中途变化提供推力', '中途状态可能推动收尾走向'],
  相克: ['起初的条件仍可能限制中途推进', '中途因素仍可能压住后续发展'],
  受生: ['中途条件可能补足前期基础', '后续条件可能反过来支撑中途安排'],
  受克: ['中途变化可能迫使原先安排调整', '后续变化可能反过来改变中途状态'],
}

// 结论独立合成：整体形态 + 意图下的末传倾向 + 两段关系 + 现实条件。
export function synthesizeOverallTrend(passes: Passes, transitions: Transitions, context: QuestionContext): string {
  const language = topicLanguage(context)
  const end = profile(passes[2])
  const response = context.intent === 'timing' ? `节奏${end.pace}，不能据此推断具体日期`
    : context.intent === 'outcome' ? `若问能否达成，目前${end.ending}`
      : context.intent === 'advice' ? `处理上宜先核实${language.foundation}，再争取下一步`
        : `后续${end.ending}`
  const intentEnding = context.intent === 'advice' ? `，最终${end.ending}` : ''
  return `就${language.subject}而言，整体呈现${describeOverallTrajectory(passes)}，${response}${intentEnding}。关键转折在于${summaryLinks[transitions[0].relation][0]}，而${summaryLinks[transitions[1].relation][1]}；这一倾向是否落实，还要看${language.condition}。`
}

const stageLinks: Record<ElementRelation, readonly [string, string]> = {
  同类: ['初中同五行，原有趋势可能继续，变化的幅度未必很大', '中末同五行，收尾可能继续承接中途状态，顺处与难处都可能加强'],
  相生: ['初传生中传，前一阶段积累的条件可能带动这次变化，推动的也可能是问题', '中传生末传，中途积累可能促成这一倾向，但不等于结果必然有利'],
  相克: ['初传克中传，起初未解决的因素可能限制新进展，出现反馈也未必能顺利推进', '中传克末传，中途留下的限制可能使收尾不易展开，需要先处理阻力'],
  受生: ['中传生初传，新条件可能先用于补足原来的基础，未必立刻体现为向前推进', '末传生中传，后续条件可能先支持原来的安排，再逐渐体现结果'],
  受克: ['中传克初传，新的变化可能反制旧状态，需要重新检查原来的做法', '末传克中传，后续变化可能要求调整中途安排，原来的办法未必能直接用到最后'],
}

function manifestation(palace: Palace, context: QuestionContext): string {
  const { foundation, feedback, continuity } = topicLanguage(context)
  const forms: Record<PalaceName, string> = {
    大安: `${foundation}有相对可依循的部分，但${continuity}还需观察`,
    留连: `${feedback}迟迟未定，或同一个环节需要反复确认`,
    速喜: `${feedback}较快出现，尚需分清消息与实际落实`,
    赤口: `对${foundation}的判断出现分歧，或推进时遇到沟通阻力`,
    小吉: `${feedback}有少量可验证的改善，但范围可能有限`,
    空亡: `${foundation}的信息不完整，或预期缺少实际依据`,
    病符: `${foundation}中存在需要排查的异常，额外消耗了时间和精力`,
    桃花: `对${feedback}抱有较多期待，需要区分主观愿望与已确认的信息`,
    天德: `${foundation}得到指点或协助，但${continuity}仍取决于执行`,
  }
  return forms[palace.name as PalaceName]
}

export function generateStageInterpretations(passes: Passes, transitions: Transitions, context: QuestionContext): readonly string[] {
  const [first, middle, last] = passes
  const language = topicLanguage(context)
  const sameFirst = first.name === middle.name
  const sameLast = middle.name === last.name
  const observation = context.intent === 'timing' ? `留意${language.feedback}是一次性出现、持续出现，还是反复等待，不据此换算天数`
    : context.intent === 'outcome' ? `观察${language.feedback}是否足以支持所期待的结果，而非只听到口头说法`
      : context.intent === 'advice' ? `可以先检查${language.feedback}，据此决定继续、调整或暂停当前步骤`
        : `应观察${language.feedback}是否连续出现，避免把一次波动当成长期变化`
  const resultCondition = context.intent === 'timing' ? `时间上${profile(last).pace}，具体进度需等${language.feedback}得到确认`
    : context.intent === 'outcome' ? `能否达到预期仍以${language.condition}为条件，不能直接断定能或不能`
      : context.intent === 'advice' ? `下一步可以围绕${language.continuity}复查安排，只有${language.condition}时才有继续推进的依据`
        : `这一走向需要${language.condition}才有现实依据，否则还应重新评估`
  return [
    `前期：${meaning(first).first}。结合${language.subject}，可能体现为${manifestation(first, context)}。需要核实${language.verify}。`,
    `过程：${sameFirst ? '前期状态延续，中途更应检查同一条件是否仍在起作用' : meaning(middle).middle}；在本问题中，可能表现为${manifestation(middle, context)}。${stageLinks[transitions[0].relation][0]}。${observation}。`,
    `结果：${sameFirst && sameLast ? `主题持续且被明显强化，${language.continuity}更受这一状态影响` : sameLast ? `中途状态延续到后期，${language.continuity}仍需面对同类条件` : `就${language.continuity}看，${meaning(last).last}`}。${stageLinks[transitions[1].relation][1]}。${resultCondition}。`,
  ]
}

const turningLinks: Record<ElementRelation, string> = {
  同类: '不是自动转好，而是原有影响可能继续累积',
  相生: '前段给后段提供助力，应分清被推动的是机会还是隐患',
  相克: '前段对后段有约束，突破点在于找出并处理限制条件',
  受生: '补充作用来自后段，应检查新资源是否真正补上旧缺口',
  受克: '制约作用来自后段，重点是旧安排能否适应新变化',
}

export function generateTurningPoints(passes: Passes, transitions: Transitions): readonly string[] {
  return transitions.map((transition, index) => {
    const from = passes[index]
    const to = passes[index + 1]
    const continuity = from.name === to.name ? '同宫相接，没有新的宫义转向' : `${profile(from).state}转向${profile(to).state}`
    const specific = from.name === '留连' && to.name === '赤口' ? '，若纠缠的问题没有及时处理，不满可能从等待积累为争执' : ''
    return `${index === 0 ? '初→中' : '中→末'}（${from.name}→${to.name}）：${continuity}；${turningLinks[transition.relation]}${specific}。`
  })
}
