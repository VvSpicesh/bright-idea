import type { CharacterEntry } from '../divination/characterInput'
import { createDivinationInterpretation, detectInterpretationDirection } from '../divination/interpretation'
import type { TimeDivinationValues } from '../divination/methods'
import type { DivinationResult, RuleSystem } from '../../rules'
import type { DivinationRecord } from './types'

export type SnapshotSource =
  | { method: 'number' }
  | { method: 'character'; entries: readonly CharacterEntry[] }
  | { method: 'random' }
  | { method: 'time'; values: TimeDivinationValues }

export interface CreateRecordSnapshotInput {
  readonly id: string
  readonly runId: string
  readonly createdAt: string
  readonly question: string
  readonly ruleSystem: RuleSystem
  readonly result: DivinationResult
  readonly source: SnapshotSource
}

export function createRecordSnapshot(input: CreateRecordSnapshotInput): DivinationRecord {
  const { id, runId, createdAt, question, ruleSystem, result, source } = input
  const direction = detectInterpretationDirection(question)
  const generated = createDivinationInterpretation([result.first, result.second, result.third], direction, question)
  const originalInput = source.method === 'character' ? source.entries.map((entry) => entry.original).join('')
    : source.method === 'time' ? source.values.solarText
      : result.inputs.join('、')
  return {
    id,
    runId,
    createdAt,
    question,
    ruleSystemId: result.ruleSystemId,
    systemName: ruleSystem.name,
    method: source.method,
    originalInput,
    inputs: [...result.inputs],
    characters: source.method === 'character' ? source.entries.map((entry) => ({ ...entry })) : undefined,
    time: source.method === 'time' ? {
      solarText: source.values.solarText,
      lunarText: source.values.lunarText,
      lunarYear: source.values.lunarYear,
      lunarMonth: source.values.lunarMonth,
      lunarDay: source.values.lunarDay,
      leapMonth: source.values.leapMonth,
      shichenName: source.values.shichenName,
      shichenIndex: source.values.shichenIndex,
    } : undefined,
    passes: [{ ...result.first, keywords: [...result.first.keywords] }, { ...result.second, keywords: [...result.second.keywords] }, { ...result.third, keywords: [...result.third.keywords] }],
    steps: result.steps.map((step) => ({ ...step })) as unknown as DivinationRecord['steps'],
    ruleVersion: result.ruleVersion,
    direction,
    intent: generated.context.intent,
    interpretation: {
      summary: generated.summary,
      passReadings: [...generated.passReadings],
      turningPoints: [...generated.turningPoints],
      advice: generated.advice,
      evidence: [...generated.evidence],
    },
    verificationStatus: '未验证',
    actualResult: '',
    reviewNotes: '',
    updatedAt: createdAt,
  }
}
