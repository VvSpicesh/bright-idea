import { NINE_RULE_SECTIONS } from './nineRuleSections'
import { SIX_RULE_SECTIONS } from './sixRuleSections'

export type RuleSection = { id: string; title: string }
export type RuleSectionGroup = { id: 'six' | 'nine'; title: string; sections: readonly RuleSection[] }

export const RULE_SECTION_GROUPS: readonly RuleSectionGroup[] = [
  { id: 'six', title: '六宫小六壬', sections: SIX_RULE_SECTIONS },
  { id: 'nine', title: '九宫小六壬（荀爽体系）', sections: NINE_RULE_SECTIONS },
]

export const RULE_SECTIONS = [...SIX_RULE_SECTIONS, ...NINE_RULE_SECTIONS] as const
export type RuleSectionId = typeof RULE_SECTIONS[number]['id']
