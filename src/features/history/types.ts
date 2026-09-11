import type { DivinationMethod } from '../divination/methods'
import type { Intent, InterpretationDirection } from '../divination/questionContext'
import type { CalculationStep, Element, RuleSystemId } from '../../rules'

export const RECORD_SCHEMA_VERSION = 1 as const
export const RECORD_STORAGE_KEY = 'bright-idea:divination-records'

export const verificationStatuses = ['未验证', '较符合', '部分符合', '不符合'] as const
export type VerificationStatus = typeof verificationStatuses[number]

export interface PalaceSnapshot {
  readonly index: number
  readonly name: string
  readonly element: Element
  readonly direction?: string
  readonly deity?: string
  readonly keywords: readonly string[]
}

export interface CharacterInputSnapshot {
  readonly original: string
  readonly traditional: string
  readonly dataStrokeCount?: number
  readonly finalStrokeCount?: number
  readonly manualStrokeCount?: number
}

export interface TimeInputSnapshot {
  readonly solarText: string
  readonly lunarText: string
  readonly lunarYear: number
  readonly lunarMonth: number
  readonly lunarDay: number
  readonly leapMonth: boolean
  readonly shichenName: string
  readonly shichenIndex: number
}

export interface InterpretationSnapshot {
  readonly summary: string
  readonly passReadings: readonly string[]
  readonly turningPoints: readonly string[]
  readonly advice: string
  readonly evidence: readonly string[]
}

export interface DivinationRecord {
  readonly id: string
  readonly runId: string
  readonly createdAt: string
  readonly question: string
  readonly ruleSystemId: RuleSystemId
  readonly systemName: string
  readonly method: DivinationMethod
  readonly originalInput: string
  readonly inputs: readonly [string, string, string]
  readonly characters?: readonly CharacterInputSnapshot[]
  readonly time?: TimeInputSnapshot
  readonly passes: readonly [PalaceSnapshot, PalaceSnapshot, PalaceSnapshot]
  readonly steps: readonly [CalculationStep, CalculationStep, CalculationStep]
  readonly ruleVersion: string
  readonly direction: InterpretationDirection
  readonly intent: Intent
  readonly interpretation: InterpretationSnapshot
  readonly verificationStatus: VerificationStatus
  readonly actualResult: string
  readonly reviewNotes: string
  readonly updatedAt: string
}

export interface RecordEnvelope {
  readonly schemaVersion: typeof RECORD_SCHEMA_VERSION
  readonly records: readonly DivinationRecord[]
}
