import type { Palace, RuleSystem } from './model'

const classicSixPalaces: readonly Palace[] = [
  { index: 0, name: '大安', element: '木', keywords: ['安定', '持续', '缓慢'] },
  { index: 1, name: '留连', element: '土', keywords: ['拖延', '反复', '纠缠'] },
  { index: 2, name: '速喜', element: '火', keywords: ['快速', '喜讯', '突然'] },
  { index: 3, name: '赤口', element: '金', keywords: ['口舌', '争执', '伤害'] },
  { index: 4, name: '小吉', element: '水', keywords: ['小成', '和合', '尚可'] },
  { index: 5, name: '空亡', element: '土', keywords: ['落空', '失去', '虚无'] },
]

const xunNinePalaces: readonly Palace[] = [
  { index: 0, name: '大安', element: '木', direction: '正东', deity: '三清', keywords: ['长期', '缓慢', '稳定'] },
  { index: 1, name: '留连', element: '木', direction: '东南', deity: '文昌', keywords: ['停止', '反复', '复杂'] },
  { index: 2, name: '速喜', element: '火', direction: '正南', deity: '雷祖', keywords: ['惊喜', '快速', '突然'] },
  { index: 3, name: '赤口', element: '金', direction: '正西', deity: '将帅', keywords: ['争斗', '凶恶', '伤害'] },
  { index: 4, name: '小吉', element: '水', direction: '正北', deity: '真武', keywords: ['起步', '不多', '尚可'] },
  { index: 5, name: '空亡', element: '土', direction: '中央／内', deity: '玉皇', keywords: ['失去', '虚伪', '空想'] },
  { index: 6, name: '病符', element: '土', direction: '西南', deity: '后土', keywords: ['病态', '异常', '治疗'] },
  { index: 7, name: '桃花', element: '土', direction: '东北', deity: '城隍', keywords: ['欲望', '牵绊', '异性'] },
  { index: 8, name: '天德', element: '金', direction: '西北', deity: '紫微', keywords: ['贵人', '上司', '高远'] },
]

const freezePalaces = (palaces: readonly Palace[]): readonly Palace[] =>
  Object.freeze(palaces.map((palace) => Object.freeze({ ...palace, keywords: Object.freeze([...palace.keywords]) })))

export const classicSixRules: RuleSystem = Object.freeze({
  id: 'classic-six',
  name: '六宫小六壬',
  ruleVersion: '0.1.0',
  palaces: freezePalaces(classicSixPalaces),
})

export const xunNineRules: RuleSystem = Object.freeze({
  id: 'xun-nine',
  name: '九宫小六壬（荀爽体系）',
  ruleVersion: '0.1.0',
  palaces: freezePalaces(xunNinePalaces),
})

export const ruleSystems = Object.freeze({
  'classic-six': classicSixRules,
  'xun-nine': xunNineRules,
})
