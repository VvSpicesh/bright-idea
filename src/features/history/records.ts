import type { DivinationMethod } from '../divination/methods'
import type { RuleSystemId } from '../../rules'
import type { DivinationRecord, VerificationStatus } from './types'

export interface RecordFilters {
  readonly query: string
  readonly ruleSystemId: RuleSystemId | 'all'
  readonly method: DivinationMethod | 'all'
  readonly verificationStatus: VerificationStatus | 'all'
}

export const emptyRecordFilters: RecordFilters = {
  query: '',
  ruleSystemId: 'all',
  method: 'all',
  verificationStatus: 'all',
}

export const methodLabels: Record<DivinationMethod, string> = {
  number: '数字',
  character: '文字',
  random: '随机',
  time: '时间',
}

export function filterRecords(records: readonly DivinationRecord[], filters: RecordFilters): DivinationRecord[] {
  const query = filters.query.trim().toLocaleLowerCase()
  return records
    .filter((record) => filters.ruleSystemId === 'all' || record.ruleSystemId === filters.ruleSystemId)
    .filter((record) => filters.method === 'all' || record.method === filters.method)
    .filter((record) => filters.verificationStatus === 'all' || record.verificationStatus === filters.verificationStatus)
    .filter((record) => !query || [record.question, record.originalInput, ...record.passes.map((pass) => pass.name), record.actualResult, record.reviewNotes]
      .join(' ').toLocaleLowerCase().includes(query))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function updateRecord(records: readonly DivinationRecord[], id: string, patch: Pick<DivinationRecord, 'verificationStatus' | 'actualResult' | 'reviewNotes'>, updatedAt = new Date().toISOString()): DivinationRecord[] {
  return records.map((record) => record.id === id ? { ...record, ...patch, updatedAt } : record)
}

export function deleteRecord(records: readonly DivinationRecord[], id: string): DivinationRecord[] {
  return records.filter((record) => record.id !== id)
}
