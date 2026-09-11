import { sixPalaceKnowledge, sixSpecificTopics, type SixPalaceName, type SixSpecificTopic } from './sixPalaceKnowledge'

export const DAY_HOUR_SOURCE_URL = 'https://www.processon.com/view/61de55ce5653bb06cbbc5beb'
export type DayHourPairSourceType = 'traditional' | 'derived'
export interface DayHourPairMeaning {
  readonly dayPalace: SixPalaceName
  readonly hourPalace: SixPalaceName
  readonly sourceVerse?: string
  readonly modernMeaning: string
  readonly topicHints: Readonly<Partial<Record<SixSpecificTopic, string>>>
  readonly sourceType: DayHourPairSourceType
  readonly sourceUrl?: string
  readonly traditionalHint?: string
}

const names = Object.keys(sixPalaceKnowledge) as SixPalaceName[]
const topicHints = (text: string): Readonly<Partial<Record<SixSpecificTopic, string>>> =>
  Object.fromEntries(sixSpecificTopics.map((topic) => [topic, text])) as Readonly<Partial<Record<SixSpecificTopic, string>>>

const verses = [
  ['办事不周全，失物西北去，婚姻晚几天', '由大安进入留连，基础仍在但推进会被等待和反复牵制。'], ['事事自己起，失物当日见，婚姻自己提', '由大安进入速喜，主动行动更容易带来较快消息或进展。'], ['办事不顺手，失物不用找，婚姻两分手', '由大安进入赤口，后续阻力和沟通摩擦上升，应先处理争议。'], ['事事从己及，失物不出门，婚姻成就地', '由大安进入小吉，熟悉条件和他人协作有助于事情延续。'], ['病人要上床，失物无踪影，事事不顺情', '由大安进入空亡，原有条件暂时不足，需重新核实事实和安排。'],
  ['办事两分张，婚姻有喜事，先苦后来甜', '由留连回到大安，经过拖延后可回到较稳定的处理节奏。'], ['事事由自己，婚姻有成意，失物三天里', '由留连进入速喜，主动推进可能带来阶段性回应，但仍需确认细节。'], ['病者死人口，失物准丢失，婚姻两分手', '由留连进入赤口，反复问题转为明显冲突，应控制风险并保留证据。'], ['事事不用提，失物东南去，病者出人齐', '由留连进入小吉，牵扯可借助沟通与他人协作逐步化解。'], ['病人准死亡，失物不见面，婚姻两分张', '由留连进入空亡，线索和条件偏弱；健康事项必须以医生意见处理。'],
  ['自己往外走，失物往正北，婚姻得勤走', '由速喜进入赤口，快速变化伴随压力，行动前先核对信息和边界。'], ['婚姻有人提，病人当天好，失物在家里', '由速喜进入小吉，消息和协作较顺，现实结果仍要以核实为准。'], ['婚姻有分张，病者积极治，失物不久见', '由速喜进入空亡，预期可能落空，及时补足条件并跟进信息。'], ['事事都平安，婚姻成全了，占病都相安', '由速喜回到大安，快速变化逐渐沉淀为稳定安排。'], ['婚姻不可言，失物无信息，病人有仙缘', '由速喜进入留连，推进转为等待和反复，避免仅凭预期下结论。'],
  ['办事自己提，婚姻不能成，失物无信息', '由赤口进入小吉，冲突后需要借助协商和第三方沟通。'], ['无病也上床，失物不用找，婚姻不能成', '由赤口进入空亡，争议可能留下信息缺口，应先核实事实。'], ['办事险和难，失物东北找，婚姻指定难', '由赤口进入大安，压力仍在，按规则和证据处理更稳妥。'], ['办事有困难，行人在外走，失物不回还', '由赤口进入留连，外部牵制和延迟增加，应持续跟进并调整方案。'], ['婚姻在自己，失物有着落，办事官事起', '由赤口进入速喜，可能出现较快回应，但程序和言辞风险需控制。'],
  ['病人不妥当，失物正东找，婚姻再想想', '由小吉进入空亡，协作线索减弱，先补足信息再决定。'], ['事事两周全，婚姻当日定，失物自己损', '由小吉进入大安，合作可沉淀为稳定安排，但仍需检查物品和细节。'], ['事事有反还，婚姻有人破，失物上西南', '由小吉进入留连，协作中出现反复，需明确责任和期限。'], ['事事从头起，婚姻能成就，失物在院里', '由小吉进入速喜，借助他人可较快获得新线索或推进。'], ['办事往外走，婚姻有难处，失物丢了手', '由小吉进入赤口，外部沟通压力上升，及时留存交接记录。'],
  ['事事不周全，婚姻从和好，失物反复间', '由空亡进入大安，重新确认条件后有机会恢复稳定节奏。'], ['办事处处难，婚姻重新定，失物永不还', '由空亡进入留连，信息缺口导致反复，应扩大范围并及时挂失。'], ['事事怨自己，婚姻有一定，失物在家里', '由空亡进入速喜，补充事实后可能较快出现消息或线索。'], ['事事官非有，婚姻难定准，失物往远走', '由空亡进入赤口，争议性增强，优先处理程序、证据和现实风险。'], ['事事有猜疑，婚姻有喜事，失物回家里', '由空亡进入小吉，借助沟通和他人协助可能重新获得线索。'],
] as const

const pairModernTopic = (text: string) => topicHints(text)
export const traditionalPairs: readonly DayHourPairMeaning[] = verses.map(([sourceVerse, modernMeaning], index) => {
  const dayIndex = Math.floor(index / 5)
  const hour = [[1, 2, 3, 4, 5], [0, 2, 3, 4, 5], [3, 4, 5, 0, 1], [4, 5, 0, 1, 2], [5, 0, 1, 2, 3], [0, 1, 2, 3, 4]][dayIndex][index % 5]
  return { dayPalace: names[dayIndex], hourPalace: names[hour], sourceVerse, modernMeaning, topicHints: pairModernTopic(modernMeaning), sourceType: 'traditional', sourceUrl: DAY_HOUR_SOURCE_URL, traditionalHint: '口诀中的方位、时效仅作传统类象参考，不作确定判断。' }
})

const derivedTexts = ['安定和持续特征加强，发展较慢，适合保持原有节奏', '拖延、反复和牵扯特征加强，需要主动寻找卡点', '消息与推进速度加强，同时注意急躁和细节遗漏', '冲突与压力特征加强，应避免正面升级并保留证据', '合作与协调特征加强，适合借助他人和现有关系', '信息缺失和方向不明特征加强，应先确认事实和条件']
export const derivedSamePairs: readonly DayHourPairMeaning[] = names.map((name, index) => ({ dayPalace: name, hourPalace: name, modernMeaning: derivedTexts[index], topicHints: pairModernTopic(derivedTexts[index]), sourceType: 'derived' }))
export const dayHourPairs = [...traditionalPairs, ...derivedSamePairs] as readonly DayHourPairMeaning[]
export function getDayHourPair(dayPalace: SixPalaceName, hourPalace: SixPalaceName): DayHourPairMeaning | undefined {
  return dayHourPairs.find((pair) => pair.dayPalace === dayPalace && pair.hourPalace === hourPalace)
}
