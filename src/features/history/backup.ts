import { parseRecordEnvelope } from './storage'
import { RECORD_SCHEMA_VERSION, type DivinationRecord, type RecordEnvelope } from './types'

export function exportRecordsJson(records: readonly DivinationRecord[]): string {
  const envelope: RecordEnvelope = { schemaVersion: RECORD_SCHEMA_VERSION, records }
  return JSON.stringify(envelope, null, 2)
}

export function importRecordsJson(text: string): DivinationRecord[] {
  let value: unknown
  try {
    value = JSON.parse(text) as unknown
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  return [...parseRecordEnvelope(value).records]
}

export function mergeRecords(existing: readonly DivinationRecord[], imported: readonly DivinationRecord[]): { records: DivinationRecord[]; added: number; skipped: number } {
  const ids = new Set(existing.map((record) => record.id))
  const additions = imported.filter((record) => !ids.has(record.id) && ids.add(record.id))
  return {
    records: [...existing, ...additions].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    added: additions.length,
    skipped: imported.length - additions.length,
  }
}
