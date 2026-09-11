export type RuleSection = { id: string; title: string }
export type RuleSectionGroup = { id: 'six' | 'nine' | 'common'; title: string; sections: readonly RuleSection[] }

export const RULE_SECTION_GROUPS: readonly RuleSectionGroup[] = [
  { id: 'six', title: '六宫小六壬', sections: [
    { id: 'six-overview', title: '六宫基础规则' },
    { id: 'six-palaces', title: '宫位顺序与解说配置' },
    { id: 'six-verses', title: '六宫口诀与事项细断' },
    { id: 'six-day-hour', title: '日时双宫' },
  ] },
  { id: 'nine', title: '九宫小六壬（荀爽体系）', sections: [
    { id: 'nine-overview', title: '九宫基础规则' },
    { id: 'nine-palaces', title: '宫位顺序与解说配置' },
    { id: 'nine-counting', title: '九宫起数规则' },
    { id: 'nine-interpretation', title: '九宫解说逻辑' },
  ] },
  { id: 'common', title: '通用规则', sections: [
    { id: 'common-methods', title: '起课方式' },
    { id: 'common-five-elements', title: '五行关系' },
    { id: 'common-interpretation', title: '解说逻辑' },
    { id: 'common-history', title: '版本与历史快照' },
    { id: 'common-notices', title: '流派与使用说明' },
  ] },
]

export const RULE_SECTIONS = RULE_SECTION_GROUPS.flatMap((group) => group.sections)
export type RuleSectionId = typeof RULE_SECTIONS[number]['id']
