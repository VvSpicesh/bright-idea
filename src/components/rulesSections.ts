export const RULE_SECTIONS = [
  { id: 'palace-config', title: '宫位顺序与解说配置' },
  { id: 'counting-rules', title: '连续起数规则' },
  { id: 'methods', title: '四种起课方式' },
  { id: 'five-elements', title: '五行关系' },
  { id: 'six-palace-verses', title: '六宫口诀与事项细断' },
  { id: 'day-hour-pairs', title: '日时双宫' },
  { id: 'interpretation-logic', title: '解说逻辑' },
  { id: 'version-history', title: '版本与历史快照' },
] as const

export type RuleSectionId = typeof RULE_SECTIONS[number]['id']
