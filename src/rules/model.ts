export type RuleSystemId = 'classic-six' | 'xun-nine'
export type Element = '木' | '火' | '土' | '金' | '水'

export interface Palace {
  readonly index: number
  readonly name: string
  readonly element: Element
  readonly direction?: string
  readonly deity?: string
  readonly keywords: readonly string[]
}

export interface RuleSystem {
  readonly id: RuleSystemId
  readonly name: string
  readonly ruleVersion: '0.1.0'
  readonly palaces: readonly Palace[]
}

export interface CalculationStep {
  readonly startIndex: number
  readonly input: string
  readonly rounds: string
  readonly remainder: string
  readonly endIndex: number
}

export interface DivinationResult {
  readonly ruleSystemId: RuleSystemId
  readonly ruleVersion: RuleSystem['ruleVersion']
  readonly inputs: readonly [string, string, string]
  readonly first: Palace
  readonly second: Palace
  readonly third: Palace
  readonly steps: readonly [CalculationStep, CalculationStep, CalculationStep]
}
