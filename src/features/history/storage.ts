import { RECORD_SCHEMA_VERSION, RECORD_STORAGE_KEY, type DivinationRecord, type RecordEnvelope } from './types'

export interface LoadRecordsResult {
  readonly records: DivinationRecord[]
  readonly error?: string
}

const isString = (value: unknown): value is string => typeof value === 'string'
const isNonEmptyString = (value: unknown): value is string => isString(value) && value.length > 0
const isOptionalString = (value: unknown): value is string | undefined => value === undefined || isString(value)
const isPositiveNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)
const isIsoDate = (value: unknown): value is string => isString(value) && !Number.isNaN(Date.parse(value))
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every((key) => keys.includes(key))

function isPalace(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const palace = value as Record<string, unknown>
  return hasOnlyKeys(palace, ['index', 'name', 'element', 'direction', 'deity', 'keywords'])
    && Number.isInteger(palace.index) && isString(palace.name) && ['木', '火', '土', '金', '水'].includes(String(palace.element))
    && isOptionalString(palace.direction) && isOptionalString(palace.deity) && isStringArray(palace.keywords)
}

function isStep(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const step = value as Record<string, unknown>
  return hasOnlyKeys(step, ['startIndex', 'input', 'rounds', 'remainder', 'endIndex'])
    && Number.isInteger(step.startIndex) && Number.isInteger(step.endIndex)
    && isString(step.input) && isString(step.rounds) && isString(step.remainder)
}

function isCharacter(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return hasOnlyKeys(entry, ['original', 'traditional', 'dataStrokeCount', 'finalStrokeCount', 'manualStrokeCount'])
    && isString(entry.original) && isString(entry.traditional)
    && (entry.dataStrokeCount === undefined || isPositiveNumber(entry.dataStrokeCount))
    && (entry.finalStrokeCount === undefined || isPositiveNumber(entry.finalStrokeCount))
    && (entry.manualStrokeCount === undefined || isPositiveNumber(entry.manualStrokeCount))
}

function isTime(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const time = value as Record<string, unknown>
  return hasOnlyKeys(time, ['solarText', 'lunarText', 'lunarYear', 'lunarMonth', 'lunarDay', 'leapMonth', 'shichenName', 'shichenIndex'])
    && isString(time.solarText) && isString(time.lunarText) && isPositiveNumber(time.lunarYear) && isPositiveNumber(time.lunarMonth)
    && isPositiveNumber(time.lunarDay) && typeof time.leapMonth === 'boolean'
    && isString(time.shichenName) && isPositiveNumber(time.shichenIndex)
}

function isInterpretation(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const result = value as Record<string, unknown>
  return hasOnlyKeys(result, ['summary', 'passReadings', 'turningPoints', 'advice', 'evidence'])
    && isString(result.summary) && isStringArray(result.passReadings) && result.passReadings.length === 3
    && isStringArray(result.turningPoints) && result.turningPoints.length === 2
    && isString(result.advice) && isStringArray(result.evidence)
}

export function isDivinationRecord(value: unknown): value is DivinationRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const methods = ['number', 'character', 'random', 'time']
  const statuses = ['未验证', '较符合', '部分符合', '不符合']
  const directions = ['综合', '感情', '工作/事业', '财运', '健康', '出行', '寻物', '学业']
  const intents = ['outcome', 'timing', 'advice', 'trend']
  const allowedKeys = ['id', 'runId', 'createdAt', 'question', 'ruleSystemId', 'systemName', 'method', 'originalInput', 'inputs', 'characters', 'time', 'passes', 'steps', 'ruleVersion', 'direction', 'intent', 'interpretation', 'verificationStatus', 'actualResult', 'reviewNotes', 'updatedAt']
  const hasMethodDetails = record.method === 'character' ? Array.isArray(record.characters) && record.characters.length === 3 && record.characters.every(isCharacter)
    : record.method === 'time' ? isTime(record.time)
      : true
  return hasOnlyKeys(record, allowedKeys) && isNonEmptyString(record.id) && isNonEmptyString(record.runId) && isIsoDate(record.createdAt) && isIsoDate(record.updatedAt)
    && isString(record.question) && ['classic-six', 'xun-nine'].includes(String(record.ruleSystemId))
    && isString(record.systemName) && methods.includes(String(record.method)) && isString(record.originalInput)
    && Array.isArray(record.inputs) && record.inputs.length === 3 && record.inputs.every((input) => isString(input) && /^[1-9][0-9]*$/.test(input))
    && (record.characters === undefined || (Array.isArray(record.characters) && record.characters.length === 3 && record.characters.every(isCharacter)))
    && (record.time === undefined || isTime(record.time))
    && Array.isArray(record.passes) && record.passes.length === 3 && record.passes.every(isPalace)
    && Array.isArray(record.steps) && record.steps.length === 3 && record.steps.every(isStep)
    && isString(record.ruleVersion) && directions.includes(String(record.direction)) && intents.includes(String(record.intent))
    && isInterpretation(record.interpretation) && statuses.includes(String(record.verificationStatus))
    && isString(record.actualResult) && isString(record.reviewNotes) && hasMethodDetails
}

export function parseRecordEnvelope(value: unknown): RecordEnvelope {
  if (!value || typeof value !== 'object') throw new Error('备份文件不是有效对象')
  const envelope = value as Record<string, unknown>
  if (!hasOnlyKeys(envelope, ['schemaVersion', 'records'])) throw new Error('备份文件包含不支持的字段')
  if (envelope.schemaVersion !== RECORD_SCHEMA_VERSION) throw new Error(`不支持的记录版本：${String(envelope.schemaVersion)}`)
  if (!Array.isArray(envelope.records) || !envelope.records.every(isDivinationRecord)) throw new Error('备份文件中的记录结构无效')
  return { schemaVersion: RECORD_SCHEMA_VERSION, records: envelope.records }
}

export function loadRecords(storage: Storage = localStorage): LoadRecordsResult {
  let raw: string | null
  try {
    raw = storage.getItem(RECORD_STORAGE_KEY)
  } catch {
    return { records: [], error: '无法读取本地记录，请检查浏览器存储或隐私设置。' }
  }
  if (!raw) return { records: [] }
  try {
    const envelope = parseRecordEnvelope(JSON.parse(raw) as unknown)
    return { records: [...envelope.records].sort((left, right) => right.createdAt.localeCompare(left.createdAt)) }
  } catch {
    return { records: [], error: '本地记录数据已损坏，暂未读取。你可以导入有效备份恢复；现有损坏数据不会自动删除。' }
  }
}

export function saveRecords(records: readonly DivinationRecord[], storage: Storage = localStorage): void {
  const envelope: RecordEnvelope = { schemaVersion: RECORD_SCHEMA_VERSION, records }
  try {
    storage.setItem(RECORD_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    throw new Error('记录保存失败，请检查浏览器存储空间或隐私设置。')
  }
}

export function saveRecordOnce(record: DivinationRecord, storage: Storage = localStorage): { records: DivinationRecord[]; added: boolean; warning?: string } {
  const loaded = loadRecords(storage)
  if (loaded.error) throw new Error(`${loaded.error} 为避免覆盖原数据，本次记录未保存。`)
  const existing = loaded.records.find((item) => item.runId === record.runId)
  if (existing) return { records: loaded.records, added: false, warning: loaded.error }
  const records = [record, ...loaded.records]
  saveRecords(records, storage)
  return { records, added: true, warning: loaded.error }
}
