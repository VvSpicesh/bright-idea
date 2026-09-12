export const SIX_RULE_SECTIONS = [
  { id: 'six-overview', title: '六宫体系说明' },
  { id: 'six-palaces', title: '六宫配置' },
  { id: 'six-counting', title: '连续计数' },
  { id: 'six-methods', title: '起课方式' },
  { id: 'six-transmissions', title: '三传说明' },
  { id: 'six-five-elements', title: '五行关系' },
  { id: 'six-interpretation', title: '解说逻辑' },
  { id: 'six-verses', title: '口诀与事项细断' },
  { id: 'six-day-hour', title: '日时双宫' },
  { id: 'six-history', title: '版本与记录' },
  { id: 'six-notices', title: '流派与使用说明' },
] as const

export type SixRuleSectionId = typeof SIX_RULE_SECTIONS[number]['id']
