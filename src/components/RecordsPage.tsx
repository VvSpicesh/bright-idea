import { useMemo, useRef, useState } from 'react'
import { exportRecordsJson, importRecordsJson, mergeRecords } from '../features/history/backup'
import { emptyRecordFilters, filterRecords, methodLabels, type RecordFilters } from '../features/history/records'
import { verificationStatuses, type DivinationRecord, type VerificationStatus } from '../features/history/types'

export function RecordsPage({ records, notice, onReplace, onUpdate, onDelete, onClear, onRerun }: {
  records: readonly DivinationRecord[]
  notice?: string
  onReplace: (records: readonly DivinationRecord[], message: string) => boolean
  onUpdate: (id: string, patch: { verificationStatus: VerificationStatus; actualResult: string; reviewNotes: string }) => void
  onDelete: (id: string) => void
  onClear: () => void
  onRerun: (record: DivinationRecord) => void
}) {
  const [filters, setFilters] = useState<RecordFilters>(emptyRecordFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = records.find((record) => record.id === selectedId)
  const filtered = useMemo(() => filterRecords(records, filters), [records, filters])
  const setFilter = <K extends keyof RecordFilters>(key: K, value: RecordFilters[K]) => setFilters((current) => ({ ...current, [key]: value }))

  const exportAll = () => {
    const blob = new Blob([exportRecordsJson(records)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `bright-idea-records-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file?: File) => {
    if (!file) return
    try {
      const imported = importRecordsJson(await file.text())
      const merged = mergeRecords(records, imported)
      if (onReplace(merged.records, `导入完成：新增 ${merged.added} 条，跳过已有 ${merged.skipped} 条。`)) setMessage(`导入完成：新增 ${merged.added} 条，跳过已有 ${merged.skipped} 条。`)
    } catch (error) {
      setMessage(error instanceof Error ? `导入失败：${error.message}` : '导入失败：文件无效')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (selected) return <RecordDetail record={selected} notice={notice || message} onBack={() => setSelectedId(null)} onUpdate={onUpdate} onDelete={() => {
    if (window.confirm('确认删除这条记录？删除后无法恢复。')) { onDelete(selected.id); setSelectedId(null) }
  }} onRerun={() => onRerun(selected)} />

  return <section className="content-panel records-page" aria-labelledby="records-title">
    <div className="page-heading"><div><p className="eyebrow">本机数据</p><h2 id="records-title">记录</h2></div><span>{records.length} 条</span></div>
    {(message || notice) && <p className="page-notice" role="status">{message || notice}</p>}
    <div className="record-tools">
      <label>关键词<input value={filters.query} onChange={(event) => setFilter('query', event.target.value)} placeholder="问题、输入、三传或复盘" /></label>
      <label>体系<select value={filters.ruleSystemId} onChange={(event) => setFilter('ruleSystemId', event.target.value as RecordFilters['ruleSystemId'])}><option value="all">全部</option><option value="classic-six">六宫</option><option value="xun-nine">九宫</option></select></label>
      <label>方式<select value={filters.method} onChange={(event) => setFilter('method', event.target.value as RecordFilters['method'])}><option value="all">全部</option>{Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>验证<select value={filters.verificationStatus} onChange={(event) => setFilter('verificationStatus', event.target.value as RecordFilters['verificationStatus'])}><option value="all">全部</option>{verificationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
    </div>
    <div className="record-backup-actions">
      <button type="button" className="secondary-button" onClick={exportAll} disabled={!records.length}>导出全部</button>
      <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>导入备份</button>
      <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" aria-label="选择记录备份文件" onChange={(event) => void importFile(event.target.files?.[0])} />
      <button type="button" className="danger-button" disabled={!records.length} onClick={() => {
        if (window.confirm('第一次确认：要清空全部本地记录吗？') && window.confirm('第二次确认：清空后无法恢复，仍要继续吗？')) onClear()
      }}>清空全部</button>
    </div>
    {!records.length ? <div className="empty-state"><h3>还没有起课记录</h3><p>完成一次起课后会自动保存在当前浏览器。</p></div>
      : !filtered.length ? <div className="empty-state"><h3>没有符合条件的记录</h3><p>调整关键词或筛选条件后再试。</p></div>
        : <div className="record-list">{filtered.map((record) => <button type="button" className="record-card" key={record.id} onClick={() => setSelectedId(record.id)}>
          <span className="record-card-main"><strong>{record.question || '未填写事项'}</strong><small>{new Date(record.createdAt).toLocaleString()}</small></span>
          <span>{record.ruleSystemId === 'classic-six' ? '六宫' : '九宫'} · {methodLabels[record.method]} · {record.verificationStatus}</span>
          <span>三传：{record.passes.map((pass) => pass.name).join(' → ')}</span>
        </button>)}</div>}
  </section>
}

function RecordDetail({ record, notice, onBack, onUpdate, onDelete, onRerun }: {
  record: DivinationRecord
  notice?: string
  onBack: () => void
  onUpdate: RecordsPagePropsUpdate
  onDelete: () => void
  onRerun: () => void
}) {
  return <section className="content-panel record-detail" aria-labelledby="record-title">
    <div className="page-heading"><div><p className="eyebrow">历史快照</p><h2 id="record-title">{record.question || '未填写事项'}</h2></div><button type="button" className="text-button" onClick={onBack}>返回列表</button></div>
    {notice && <p className="page-notice" role="status">{notice}</p>}
    <dl className="record-metadata"><div><dt>起课时间</dt><dd>{new Date(record.createdAt).toLocaleString()}</dd></div><div><dt>体系</dt><dd>{record.systemName}</dd></div><div><dt>起课方式</dt><dd>{methodLabels[record.method]}</dd></div><div><dt>规则版本</dt><dd>{record.ruleVersion}</dd></div><div><dt>原始输入</dt><dd>{record.originalInput || '未填写'}</dd></div><div><dt>最终取数</dt><dd>{record.inputs.join('、')}</dd></div><div><dt>解读分类</dt><dd>{record.direction} · {record.intent}</dd></div><div><dt>最后修改</dt><dd>{new Date(record.updatedAt).toLocaleString()}</dd></div></dl>
    {record.characters && <section className="snapshot-section"><h3>文字输入</h3>{record.characters.map((entry, index) => <p key={`${entry.original}-${index}`}>{entry.original} → {entry.traditional}：数据笔画 {entry.dataStrokeCount ?? '未找到'}，最终笔画 {entry.finalStrokeCount ?? '未设定'}{entry.manualStrokeCount ? `（手工修正 ${entry.manualStrokeCount}）` : ''}</p>)}</section>}
    {record.time && <section className="snapshot-section"><h3>时间输入</h3><p>公历：{record.time.solarText}</p><p>农历：{record.time.lunarText}</p><p>时辰：{record.time.shichenName}（{record.time.shichenIndex}）</p></section>}
    <section className="snapshot-section"><h3>三传快照</h3><div className="snapshot-passes">{record.passes.map((pass, index) => <article key={`${index}-${pass.name}`}><small>{['初传', '中传', '末传'][index]}</small><strong>{pass.name}</strong><span>{pass.element} · {pass.direction || '未设定'}</span><span>{pass.keywords.join('、') || '未设定'}</span></article>)}</div></section>
    <section className="snapshot-section"><h3>当时的解读</h3><h4>一句话结论</h4><p>{record.interpretation.summary}</p><h4>发展过程</h4>{record.interpretation.passReadings.map((text) => <p key={text}>{text}</p>)}<h4>关键转折</h4>{record.interpretation.turningPoints.map((text) => <p key={text}>{text}</p>)}<h4>行动建议</h4><p>{record.interpretation.advice}</p><h4>判断依据</h4><ul>{record.interpretation.evidence.map((text) => <li key={text}>{text}</li>)}</ul></section>
    <section className="snapshot-section review-form"><h3>结果复盘</h3><label>验证状态<select value={record.verificationStatus} onChange={(event) => onUpdate(record.id, { verificationStatus: event.target.value as VerificationStatus, actualResult: record.actualResult, reviewNotes: record.reviewNotes })}>{verificationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>实际结果<textarea value={record.actualResult} onChange={(event) => onUpdate(record.id, { verificationStatus: record.verificationStatus, actualResult: event.target.value, reviewNotes: record.reviewNotes })} /></label><label>复盘备注<textarea value={record.reviewNotes} onChange={(event) => onUpdate(record.id, { verificationStatus: record.verificationStatus, actualResult: record.actualResult, reviewNotes: event.target.value })} /></label></section>
    <div className="detail-actions"><button type="button" className="primary-button" onClick={onRerun}>按当前规则重新起课</button><button type="button" className="danger-button" onClick={onDelete}>删除此记录</button></div>
  </section>
}

type RecordsPagePropsUpdate = (id: string, patch: { verificationStatus: VerificationStatus; actualResult: string; reviewNotes: string }) => void
