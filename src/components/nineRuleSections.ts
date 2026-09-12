export const NINE_RULE_SECTIONS = [
  { id: 'nine-overview', title: '九宫体系说明' },
  { id: 'nine-palaces', title: '九宫配置' },
  { id: 'nine-counting', title: '连续计数' },
  { id: 'nine-methods', title: '起课方式' },
  { id: 'nine-transmissions', title: '三传说明' },
  { id: 'nine-five-elements', title: '五行关系' },
  { id: 'nine-interpretation', title: '解说逻辑' },
  { id: 'nine-history', title: '版本与记录' },
  { id: 'nine-notices', title: '流派与使用说明' },
] as const

export type NineRuleSectionId = typeof NINE_RULE_SECTIONS[number]['id']
