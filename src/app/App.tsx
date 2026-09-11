import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { calculateThreePasses, classicSixRules, ruleSystems, xunNineRules } from '../rules'
import type { DivinationResult, RuleSystem } from '../rules'
import { isParsedNumber, parsePositiveInteger } from '../features/divination/numberInput'
import { createCharacterEntries, lookupStrokeCount, STROKE_DATA_SOURCE, STROKE_DATA_VERSION, validateCharacters } from '../features/divination/characterInput'
import type { CharacterEntry } from '../features/divination/characterInput'
import { convertTimeDivination, formatDateTimeLocal, generateRandomInputs } from '../features/divination/methods'
import type { DivinationMethod, TimeDivinationValues } from '../features/divination/methods'
import { LeftHandAnimation, PassResults } from '../components/LeftHandAnimation'
import { DivinationInterpretation } from '../components/DivinationInterpretation'
import { detectInterpretationDirection, type InterpretationDirection } from '../features/divination/interpretation'
import { LocalGeminiInterpretation } from '../components/LocalGeminiInterpretation'
import { RecordsPage } from '../components/RecordsPage'
import { RulesPage } from '../components/RulesPage'
import { createRecordSnapshot } from '../features/history/snapshot'
import { deleteRecord, updateRecord } from '../features/history/records'
import { loadRecords, saveRecords, saveRecordOnce } from '../features/history/storage'
import type { DivinationRecord } from '../features/history/types'

type Section = '起课' | '记录' | '规则'
type InputMode = DivinationMethod

type ResultSource =
  | { method: 'number' }
  | { method: 'character'; entries: CharacterEntry[] }
  | { method: 'random' }
  | { method: 'time'; values: TimeDivinationValues }

const sections: Section[] = ['起课', '记录', '规则']

function createUniqueId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
}

export function App() {
  const [activeSection, setActiveSection] = useState<Section>('起课')
  const [ruleSystem, setRuleSystem] = useState<RuleSystem>(classicSixRules)
  const [question, setQuestion] = useState('')
  const [inputs, setInputs] = useState(['', '', ''])
  const [retainedInputs, setRetainedInputs] = useState([false, false, false])
  const [errors, setErrors] = useState(['', '', ''])
  const [result, setResult] = useState<DivinationResult | null>(null)
  const [resultSource, setResultSource] = useState<ResultSource | null>(null)
  const [inputMode, setInputMode] = useState<InputMode>('number')
  const [characterInput, setCharacterInput] = useState('')
  const [characterEntries, setCharacterEntries] = useState<CharacterEntry[] | null>(null)
  const [characterError, setCharacterError] = useState('')
  const [selectedInput, setSelectedInput] = useState(0)
  const [randomInputs, setRandomInputs] = useState<[number, number, number] | null>(null)
  const [reuseRandomInputs, setReuseRandomInputs] = useState(false)
  const [timeInput, setTimeInput] = useState(() => formatDateTimeLocal(new Date()))
  const [timeError, setTimeError] = useState('')
  const [runId, setRunId] = useState('')
  const [runCreatedAt, setRunCreatedAt] = useState('')
  const [recordState, setRecordState] = useState<{ records: DivinationRecord[]; error?: string; message?: string }>(loadRecords)

  const publishResult = (nextResult: DivinationResult, source: ResultSource) => {
    setResult(nextResult)
    setResultSource(source)
    setRunId(createUniqueId('run'))
    setRunCreatedAt(new Date().toISOString())
  }

  useEffect(() => {
    if (!result || !resultSource || !runId || !runCreatedAt) return
    try {
      const record = createRecordSnapshot({ id: createUniqueId('record'), runId, createdAt: runCreatedAt, question, ruleSystem: ruleSystems[result.ruleSystemId], result, source: resultSource })
      const saved = saveRecordOnce(record)
      setRecordState({ records: saved.records, error: saved.warning, message: undefined })
    } catch (error) {
      setRecordState((current) => ({ ...current, error: error instanceof Error ? error.message : '记录保存失败。' }))
    }
  }, [question, result, resultSource, runCreatedAt, runId])

  const updateInput = (index: number, value: string) => {
    setInputs((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
    setRetainedInputs((current) => current.map((item, itemIndex) => itemIndex === index ? false : item))
    setErrors((current) => current.map((item, itemIndex) => itemIndex === index ? '' : item))
  }

  const startDivination = () => {
    if (inputMode === 'character') {
      if (!characterEntries || characterEntries.some((entry) => !entry.finalStrokeCount)) return
      publishResult(calculateThreePasses(ruleSystem, characterEntries.map((entry) => BigInt(entry.finalStrokeCount!)) as [bigint, bigint, bigint]), { method: 'character', entries: characterEntries })
      return
    }
    if (inputMode === 'random') {
      const nextInputs = reuseRandomInputs && randomInputs ? randomInputs : generateRandomInputs()
      setRandomInputs(nextInputs)
      setReuseRandomInputs(false)
      publishResult(calculateThreePasses(ruleSystem, nextInputs.map(BigInt) as [bigint, bigint, bigint]), { method: 'random' })
      return
    }
    if (inputMode === 'time') {
      try {
        const values = convertTimeDivination(timeInput)
        setTimeError('')
        publishResult(calculateThreePasses(ruleSystem, values.inputs.map(BigInt) as [bigint, bigint, bigint]), { method: 'time', values })
      } catch (error) {
        setTimeError(error instanceof Error ? error.message : '请输入有效的日期时间')
      }
      return
    }
    const parsed = inputs.map(parsePositiveInteger)
    const nextErrors = parsed.map((value) => {
      if (value === 'required') return '请输入正整数'
      if (value === 'positiveInteger') return '仅支持正整数，不含小数或符号'
      return ''
    })
    setErrors(nextErrors)
    if (!parsed.every(isParsedNumber)) return
    setRetainedInputs([true, true, true])
    publishResult(calculateThreePasses(ruleSystem, parsed as [bigint, bigint, bigint]), { method: 'number' })
  }

  const resetToForm = () => {
    setResult(null)
    setReuseRandomInputs(resultSource?.method === 'random')
  }

  const changeRandomSet = () => {
    const nextInputs = generateRandomInputs()
    setRandomInputs(nextInputs)
    publishResult(calculateThreePasses(ruleSystem, nextInputs.map(BigInt) as [bigint, bigint, bigint]), { method: 'random' })
  }

  const beginCharacterConfirmation = async () => {
    const error = validateCharacters(characterInput)
    if (error) {
      setCharacterError(error === 'required' ? '请输入三个汉字' : error === 'characterCount' ? '请输入恰好三个汉字，空格可忽略' : '仅允许汉字和空格，标点及其他内容不能使用')
      setCharacterEntries(null)
      return
    }
    setCharacterError('')
    setCharacterEntries(await createCharacterEntries(characterInput))
  }

  const switchInputMode = (mode: InputMode) => {
    setInputMode(mode)
    setResult(null)
    setResultSource(null)
    setInputs(['', '', ''])
    setRetainedInputs([false, false, false])
    setErrors(['', '', ''])
    setCharacterEntries(null)
    setCharacterInput('')
    setCharacterError('')
    setRandomInputs(null)
    setReuseRandomInputs(false)
    setTimeInput(formatDateTimeLocal(new Date()))
    setTimeError('')
    setSelectedInput(0)
  }

  const renderNavigationPage = () => {
    const replaceRecords = (nextRecords: readonly DivinationRecord[], message: string) => {
      try {
        saveRecords(nextRecords)
        setRecordState({ records: [...nextRecords], error: undefined, message })
        return true
      } catch (error) {
        setRecordState((current) => ({ ...current, error: error instanceof Error ? error.message : '记录保存失败。' }))
        return false
      }
    }
    const rerunRecord = (record: DivinationRecord) => {
      const system = ruleSystems[record.ruleSystemId]
      const nextResult = calculateThreePasses(system, record.inputs.map(BigInt) as [bigint, bigint, bigint])
      let source: ResultSource = { method: record.method === 'random' ? 'random' : 'number' }
      if (record.method === 'character' && record.characters) source = { method: 'character', entries: record.characters.map((entry) => ({ ...entry })) }
      if (record.method === 'time' && record.time) source = { method: 'time', values: { ...record.time, date: new Date(record.time.solarText.replace(' ', 'T')), inputs: record.inputs.map(Number) as [number, number, number] } }
      setRuleSystem(system)
      setQuestion(record.question)
      setInputMode(record.method)
      setInputs([...record.inputs])
      publishResult(nextResult, source)
      setActiveSection('起课')
    }
    if (activeSection === '记录') return <RecordsPage records={recordState.records} notice={recordState.error || recordState.message} onReplace={replaceRecords} onUpdate={(id, patch) => replaceRecords(updateRecord(recordState.records, id, patch), '复盘已保存。')} onDelete={(id) => replaceRecords(deleteRecord(recordState.records, id), '记录已删除。')} onClear={() => replaceRecords([], '全部记录已清空。')} onRerun={rerunRecord} />
    if (activeSection === '规则') return <RulesPage />
    return result ? <ResultView result={result} question={question} source={resultSource!} onBack={resetToForm} onRandomize={changeRandomSet} /> : <DivinationForm
      ruleSystem={ruleSystem} setRuleSystem={setRuleSystem} question={question} setQuestion={setQuestion}
      inputs={inputs} errors={errors} retainedInputs={retainedInputs} updateInput={updateInput} onSubmit={startDivination} selectedInput={selectedInput} setSelectedInput={setSelectedInput}
      inputMode={inputMode} setInputMode={switchInputMode} characterInput={characterInput} setCharacterInput={setCharacterInput}
      characterEntries={characterEntries} characterError={characterError} onConfirmCharacters={beginCharacterConfirmation}
      onCharacterEntriesChange={setCharacterEntries} randomInputs={randomInputs} reuseRandomInputs={reuseRandomInputs}
      timeInput={timeInput} setTimeInput={(value) => { setTimeInput(value); setTimeError('') }} timeError={timeError}
    />
  }

  return (
    <div className="app-shell">
      <main className={result && activeSection === '起课' ? 'main-content has-result' : activeSection !== '起课' ? 'main-content has-library' : 'main-content'}>
        <header className="brand-block">
          <p className="app-title">小六壬掌诀</p>
          <p className="disclaimer">传统文化研究与娱乐用途，不构成现实领域的专业建议。</p>
        </header>

        {recordState.error && activeSection !== '记录' && <p className="global-record-notice" role="alert">{recordState.error}</p>}

        {renderNavigationPage()}
      </main>

      <nav className="bottom-nav" aria-label="主要导航">
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            className={activeSection === section ? 'nav-item is-active' : 'nav-item'}
            aria-current={activeSection === section ? 'page' : undefined}
            onClick={() => setActiveSection(section)}
          >
            <span className="nav-icon" aria-hidden="true">{section === '起课' ? '起' : section === '记录' ? '簿' : '序'}</span>
            <span>{section}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function DivinationForm({ ruleSystem, setRuleSystem, question, setQuestion, inputs, errors, retainedInputs, updateInput, onSubmit, inputMode, setInputMode, characterInput, setCharacterInput, characterEntries, characterError, onConfirmCharacters, onCharacterEntriesChange, selectedInput, setSelectedInput, randomInputs, reuseRandomInputs, timeInput, setTimeInput, timeError }: {
  ruleSystem: RuleSystem; setRuleSystem: (value: RuleSystem) => void; question: string; setQuestion: (value: string) => void
  inputs: string[]; errors: string[]; retainedInputs: boolean[]; updateInput: (index: number, value: string) => void; onSubmit: () => void
  inputMode: InputMode; setInputMode: (mode: InputMode) => void; characterInput: string; setCharacterInput: (value: string) => void
  characterEntries: CharacterEntry[] | null; characterError: string; onConfirmCharacters: () => void
  onCharacterEntriesChange: (entries: CharacterEntry[] | null) => void; selectedInput: number; setSelectedInput: (value: number) => void
  randomInputs: [number, number, number] | null; reuseRandomInputs: boolean; timeInput: string; setTimeInput: (value: string) => void; timeError: string
}) {
  const handleNumberKey = (key: string) => {
    if (/^[0-9]$/.test(key)) updateInput(selectedInput, inputs[selectedInput] + key)
    if (key === 'backspace') updateInput(selectedInput, inputs[selectedInput].slice(0, -1))
    if (key === 'clear') updateInput(selectedInput, '')
    if (key === 'next') {
      if (selectedInput < 2) setSelectedInput(selectedInput + 1)
      else if (inputs.every((value) => /^[1-9][0-9]*$/.test(value))) onSubmit()
    }
  }
  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (/^[0-9]$/.test(event.key)) { event.preventDefault(); handleNumberKey(event.key) }
    if (event.key === 'Backspace') { event.preventDefault(); handleNumberKey('backspace') }
    if (event.key === 'Delete') { event.preventDefault(); handleNumberKey('clear') }
    if (event.key === 'Enter') { event.preventDefault(); handleNumberKey('next') }
  }
  return <section className="form-panel" aria-labelledby="form-title">
    <div className="section-heading"><span className="panel-mark" aria-hidden="true">卜</span><div><h2 id="form-title">任意三数起课</h2><p>输入三个正整数，查看三传落宫。</p></div></div>
    <fieldset className="system-choice"><legend>规则体系</legend>
      {[classicSixRules, xunNineRules].map((system) => <label className="choice" key={system.id}><input type="radio" name="rule-system" checked={ruleSystem.id === system.id} onChange={() => setRuleSystem(system)} /><span>{system.name}</span></label>)}
    </fieldset>
    <label className="field-label" htmlFor="question">所问事项 <span>（可选）</span></label>
    <input className="text-input" id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：今天适合推进这件事吗？" />
    <div className="mode-tabs" role="tablist" aria-label="起课方式"><button type="button" role="tab" aria-selected={inputMode === 'number'} className={inputMode === 'number' ? 'mode-tab is-active' : 'mode-tab'} onClick={() => setInputMode('number')}>任意三数</button><button type="button" role="tab" aria-selected={inputMode === 'character'} className={inputMode === 'character' ? 'mode-tab is-active' : 'mode-tab'} onClick={() => setInputMode('character')}>任意三字</button><button type="button" role="tab" aria-selected={inputMode === 'random'} className={inputMode === 'random' ? 'mode-tab is-active' : 'mode-tab'} onClick={() => setInputMode('random')}>随机起课</button><button type="button" role="tab" aria-selected={inputMode === 'time'} className={inputMode === 'time' ? 'mode-tab is-active' : 'mode-tab'} onClick={() => setInputMode('time')}>时间起课</button></div>
    {inputMode === 'number' ? <><div className="numbers-grid">{inputs.map((value, index) => <div className={selectedInput === index ? 'number-field is-selected' : 'number-field'} key={index}><label className="field-label" htmlFor={`number-${index}`}>第{index + 1}数</label><input className={`text-input number-display${retainedInputs[index] ? ' is-retained' : ''}`} id={`number-${index}`} readOnly value={value} onClick={() => { setSelectedInput(index); updateInput(index, '') }} onKeyDown={handleNumberInputKeyDown} onChange={(event) => updateInput(index, event.target.value)} aria-invalid={Boolean(errors[index])} aria-describedby={errors[index] ? `error-${index}` : undefined} />{errors[index] && <p className="error-text" id={`error-${index}`}>{errors[index]}</p>}</div>)}</div><div className="number-keypad" aria-label="应用内数字键盘"><div className="keypad-row">{['1', '2', '3', '4', '5'].map((key) => <button type="button" key={key} aria-label={`输入${key}`} onClick={() => handleNumberKey(key)}>{key}</button>)}</div><div className="keypad-row">{['6', '7', '8', '9', '0'].map((key) => <button type="button" key={key} aria-label={`输入${key}`} onClick={() => handleNumberKey(key)}>{key}</button>)}</div><div className="keypad-row"><button type="button" aria-label="退格" onClick={() => handleNumberKey('backspace')}>退格</button><button type="button" aria-label="清空" onClick={() => handleNumberKey('clear')}>清空</button><button type="button" aria-label={inputs.every((value) => /^[1-9][0-9]*$/.test(value)) ? '开始起课' : '下一项'} onClick={() => handleNumberKey('next')}>{inputs.every((value) => /^[1-9][0-9]*$/.test(value)) ? '开始起课' : '下一项'}</button></div></div></> : inputMode === 'character' ? <CharacterConfirmation characterInput={characterInput} setCharacterInput={setCharacterInput} characterEntries={characterEntries} characterError={characterError} onConfirm={onConfirmCharacters} onEntriesChange={onCharacterEntriesChange} onSubmit={onSubmit} /> : inputMode === 'random' ? <RandomDivination randomInputs={randomInputs} reuseRandomInputs={reuseRandomInputs} onSubmit={onSubmit} /> : <TimeDivination timeInput={timeInput} setTimeInput={setTimeInput} timeError={timeError} onSubmit={onSubmit} />}
  </section>
}

function RandomDivination({ randomInputs, reuseRandomInputs, onSubmit }: { randomInputs: [number, number, number] | null; reuseRandomInputs: boolean; onSubmit: () => void }) {
  return <div className="method-flow">
    <p className="method-description">每次起课从 1～18 安全随机生成三个数字，直接进入三传计算。</p>
    {randomInputs && <p className="method-preview">当前数字：{randomInputs.join('、')}</p>}
    <button className="primary-button" type="button" onClick={onSubmit}>{reuseRandomInputs ? '沿用当前三数起课' : '随机起课'}</button>
  </div>
}

function TimeDivination({ timeInput, setTimeInput, timeError, onSubmit }: { timeInput: string; setTimeInput: (value: string) => void; timeError: string; onSubmit: () => void }) {
  let preview: TimeDivinationValues | null = null
  if (timeInput) {
    try { preview = convertTimeDivination(timeInput) } catch { preview = null }
  }
  return <div className="method-flow">
    <label className="field-label" htmlFor="time-input">公历日期时间</label>
    <input className="text-input time-input" id="time-input" type="datetime-local" value={timeInput} onChange={(event) => setTimeInput(event.target.value)} aria-invalid={Boolean(timeError)} aria-describedby={timeError ? 'time-error' : undefined} />
    {timeError && <p className="error-text" id="time-error">{timeError}</p>}
    {preview && <div className="method-preview"><p>农历：{preview.lunarText}</p><p>时辰：{preview.shichenName} · 取数：{preview.inputs.join('、')}</p></div>}
    <button className="primary-button" type="button" onClick={onSubmit}>按此时间起课</button>
  </div>
}

function CharacterConfirmation({ characterInput, setCharacterInput, characterEntries, characterError, onConfirm, onEntriesChange, onSubmit }: { characterInput: string; setCharacterInput: (value: string) => void; characterEntries: CharacterEntry[] | null; characterError: string; onConfirm: () => void; onEntriesChange: (entries: CharacterEntry[] | null) => void; onSubmit: () => void }) {
  const updateEntry = async (index: number, key: 'traditional' | 'manualStrokeCount', value: string) => {
    if (!characterEntries) return
    if (key === 'traditional') {
      const dataStrokeCount = [...value].length === 1 ? await lookupStrokeCount(value) : undefined
      onEntriesChange(characterEntries.map((entry, entryIndex) => entryIndex === index ? { ...entry, traditional: value, dataStrokeCount, manualStrokeCount: undefined, finalStrokeCount: dataStrokeCount } : entry))
      return
    }
    onEntriesChange(characterEntries.map((entry, entryIndex) => entryIndex === index ? { ...entry, manualStrokeCount: value ? Number(value) : undefined, finalStrokeCount: value ? Number(value) : entry.dataStrokeCount } : entry))
  }
  const canSubmit = Boolean(characterEntries?.every((entry) => entry.finalStrokeCount && entry.finalStrokeCount > 0))
  return <div className="character-flow"><label className="field-label" htmlFor="characters">三个汉字</label><input className="text-input" id="characters" value={characterInput} onChange={(event) => { setCharacterInput(event.target.value); onEntriesChange(null) }} placeholder="例如：发展顺" aria-invalid={Boolean(characterError)} />{characterError && <p className="error-text">{characterError}</p>}<button className="secondary-button confirm-button" type="button" onClick={onConfirm}>转换并确认笔画</button>{characterEntries && <><p className="data-note">请确认繁体字和笔画后起课。数据口径：康熙笔画，{STROKE_DATA_VERSION}。</p><div className="character-list">{characterEntries.map((entry, index) => <div className="character-row" key={entry.original + index}><div><strong>{entry.original}</strong><span>原字</span></div><label>繁体字<input className="compact-input" value={entry.traditional} onChange={(event) => updateEntry(index, 'traditional', event.target.value)} /></label><span>数据笔画：{entry.dataStrokeCount ?? '未找到'}</span><label>最终笔画<input className="compact-input" inputMode="numeric" value={entry.manualStrokeCount ?? entry.finalStrokeCount ?? ''} onChange={(event) => updateEntry(index, 'manualStrokeCount', event.target.value)} placeholder="手工填写" /></label></div>)}</div><p className="data-note">来源：{STROKE_DATA_SOURCE} · {STROKE_DATA_VERSION}</p><button className="primary-button" type="button" onClick={onSubmit} disabled={!canSubmit}>确认并开始起课</button></>}</div>
}

function ResultView({ result, question, source, onBack, onRandomize }: { result: DivinationResult; question: string; source: ResultSource; onBack: () => void; onRandomize: () => void }) {
  const [direction, setDirection] = useState<InterpretationDirection>(() => detectInterpretationDirection(question))
  const passes = [result.first, result.second, result.third] as const
  const resultIdentityRef = useRef(result)
  const resultRunIdRef = useRef(0)
  if (resultIdentityRef.current !== result) {
    resultIdentityRef.current = result
    resultRunIdRef.current += 1
  }
  const labels = ['初传', '中传', '末传']
  const [animationComplete, setAnimationComplete] = useState(false)
  const [completedPasses, setCompletedPasses] = useState(0)
  const passSelectRef = useRef<(index: number) => void>(() => undefined)
  const handleAnimationCompleteChange = useCallback((complete: boolean) => setAnimationComplete(complete), [])
  const handleCompletedChange = useCallback((completed: number) => setCompletedPasses(completed), [])
  const handlePassSelectReady = useCallback((select: (index: number) => void) => { passSelectRef.current = select }, [])
  const handlePassSelect = useCallback((index: number) => passSelectRef.current(index), [])
  useEffect(() => { setAnimationComplete(false); setCompletedPasses(0) }, [result])
  const inputMethod = source.method === 'number' ? '三数起课' : source.method === 'character' ? '三字起课' : source.method === 'random' ? '随机起课' : '时间起课'
  const originalInput = source.method === 'character' ? source.entries.map((entry) => entry.original).join('') : result.inputs.join('、')
  const sourceDetails = source.method === 'time'
    ? `公历时间：${source.values.solarText}；农历日期：${source.values.lunarText}；时辰：${source.values.shichenName}；原始数字：${result.inputs.join('、')}`
    : undefined
  return <section className="result-panel" aria-labelledby="result-title">
    <div className="result-layout">
      <div className="result-left">
        <div className="result-left-top">
          <div className="result-course-info">
            <div className="result-header"><div><p className="eyebrow">起课结果</p><h2 id="result-title">{question || '未填写事项'}</h2><p className="result-summary">{result.ruleSystemId === 'classic-six' ? '六宫' : '九宫'} · {inputMethod} · {result.inputs.join('、')}</p></div><div className="result-actions"><button className="secondary-button" type="button" onClick={onBack}>重新起课</button>{source.method === 'random' && <button className="text-button compact-button" type="button" onClick={onRandomize}>换一组</button>}</div></div>
            <p className="result-meta">{result.ruleSystemId === 'classic-six' ? '六宫小六壬' : '九宫小六壬（荀爽体系）'} · 规则版本 {result.ruleVersion}</p>
            {source.method === 'character' ? <><p className="source-line">原始三字：{source.entries.map((entry) => entry.original).join('')}<br />转换后的繁体三字：{source.entries.map((entry) => entry.traditional).join('')}</p><div className="character-result">{source.entries.map((entry) => <span key={entry.original}>{entry.original} → {entry.traditional}：数据 {entry.dataStrokeCount ?? '未找到'}，最终 {entry.finalStrokeCount}</span>)}</div><p className="data-note">笔画来源：{STROKE_DATA_SOURCE} · {STROKE_DATA_VERSION}</p></> : source.method === 'time' ? <p className="source-line">公历时间：{source.values.solarText}<br />农历日期：{source.values.lunarText} · 时辰：{source.values.shichenName}<br />原始数字：{result.inputs.join('、')}</p> : source.method === 'random' ? <p className="source-line">随机三数：{result.inputs.join('、')}</p> : <p className="source-line">原始数字：{result.inputs.join('、')}</p>}
          </div>
          <LeftHandAnimation key={`${result.ruleSystemId}-${result.inputs.join('-')}`} runId={resultRunIdRef.current} steps={result.steps} passes={passes} palaceCount={result.ruleSystemId === 'classic-six' ? 6 : 9} onCompleteChange={handleAnimationCompleteChange} hidePassResults onCompletedChange={handleCompletedChange} onPassSelectReady={handlePassSelectReady} />
        </div>
        <PassResults passes={passes} completed={completedPasses} onSelect={handlePassSelect} />
      </div>
      <div className="revealed-result">
        <div className={animationComplete ? 'result-right-top' : 'result-right-top is-animation-pending'} aria-hidden={!animationComplete}>
          <div className="passes">{passes.map((palace, index) => <article className="pass-card" key={labels[index]}><p className="pass-label">{labels[index]}</p><h3>{palace.name}</h3><p>{palace.element} · {palace.direction || '方位未设定'}</p><p className="keywords">{['观察基础条件', '观察推进变化', '观察收尾条件'][index]}</p></article>)}</div>
          <DivinationInterpretation passes={passes} direction={direction} question={question} onDirectionChange={setDirection} />
        </div>
        <LocalGeminiInterpretation pending={!animationComplete} context={{
          question,
          interpretationDirection: direction,
          systemName: result.ruleSystemId === 'classic-six' ? '六宫小六壬' : '九宫小六壬（荀爽体系）',
          inputMethod,
          originalInput,
          sourceDetails,
          passes,
        }} />
      </div>
    </div>
  </section>
}
