import { beforeEach, describe, expect, it } from 'vitest'
import { calculateThreePasses, classicSixRules } from '../../rules'
import { importRecordsJson, mergeRecords } from './backup'
import { deleteRecord, filterRecords, updateRecord } from './records'
import { createRecordSnapshot } from './snapshot'
import { loadRecords, saveRecordOnce, saveRecords } from './storage'
import { RECORD_STORAGE_KEY, type DivinationRecord } from './types'

function makeRecord(id: string, runId: string, question = '工作是否顺利', createdAt = '2026-09-11T10:00:00.000Z'): DivinationRecord {
  return createRecordSnapshot({
    id,
    runId,
    createdAt,
    question,
    ruleSystem: classicSixRules,
    result: calculateThreePasses(classicSixRules, [1n, 2n, 3n]),
    source: { method: 'number' },
  })
}

describe('本地记录仓库', () => {
  beforeEach(() => localStorage.clear())

  it('saves one record per runId and supports CRUD and filtering', () => {
    const first = makeRecord('record-1', 'run-1')
    expect(saveRecordOnce(first).added).toBe(true)
    expect(saveRecordOnce({ ...first, id: 'record-duplicate' }).added).toBe(false)
    const second = { ...makeRecord('record-2', 'run-2', '感情近况', '2026-09-11T11:00:00.000Z'), method: 'random' as const, verificationStatus: '较符合' as const }
    saveRecords([first, second])
    expect(loadRecords().records.map((record) => record.id)).toEqual(['record-2', 'record-1'])
    expect(filterRecords(loadRecords().records, { query: '感情', ruleSystemId: 'all', method: 'random', verificationStatus: '较符合' })).toEqual([second])
    const updated = updateRecord([first], first.id, { verificationStatus: '部分符合', actualResult: '实际完成一半', reviewNotes: '后续复查' }, '2026-09-11T12:00:00.000Z')[0]
    expect(updated).toMatchObject({ verificationStatus: '部分符合', actualResult: '实际完成一半', reviewNotes: '后续复查', updatedAt: '2026-09-11T12:00:00.000Z' })
    expect(deleteRecord([first, second], first.id)).toEqual([second])
  })

  it('validates imports transactionally and merges by id without overwriting', () => {
    const existing = makeRecord('same-id', 'run-1')
    const duplicate = { ...existing, question: '不应覆盖' }
    const fresh = makeRecord('new-id', 'run-2')
    const valid = JSON.stringify({ schemaVersion: 1, records: [duplicate, fresh] })
    const merged = mergeRecords([existing], importRecordsJson(valid))
    expect(merged).toMatchObject({ added: 1, skipped: 1 })
    expect(merged.records.find((record) => record.id === 'same-id')?.question).toBe(existing.question)
    expect(() => importRecordsJson('{bad')).toThrow('文件不是有效的 JSON')
    expect(() => importRecordsJson(JSON.stringify({ schemaVersion: 1, records: [{ id: 'partial' }] }))).toThrow('记录结构无效')
    expect(() => importRecordsJson(JSON.stringify({ schemaVersion: 2, records: [] }))).toThrow('不支持的记录版本')
    expect(() => importRecordsJson(JSON.stringify({ schemaVersion: 1, records: [{ ...fresh, apiKey: 'must-not-import' }] }))).toThrow('记录结构无效')
  })

  it('survives corrupt or inaccessible localStorage and never silently overwrites it', () => {
    localStorage.setItem(RECORD_STORAGE_KEY, '{broken')
    expect(loadRecords()).toMatchObject({ records: [], error: expect.stringContaining('已损坏') })
    expect(() => saveRecordOnce(makeRecord('record-1', 'run-1'))).toThrow('本次记录未保存')
    expect(localStorage.getItem(RECORD_STORAGE_KEY)).toBe('{broken')
    const inaccessible = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } } as unknown as Storage
    expect(loadRecords(inaccessible).error).toContain('无法读取')
    expect(() => saveRecords([], inaccessible)).toThrow('记录保存失败')
  })
})
