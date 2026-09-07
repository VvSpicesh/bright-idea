import { useCallback, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { calculateThreePasses, classicSixRules, xunNineRules } from '../rules'
import type { DivinationResult, RuleSystem } from '../rules'
import { isParsedNumber, parsePositiveInteger } from '../features/divination/numberInput'
import { createCharacterEntries, lookupStrokeCount, STROKE_DATA_SOURCE, STROKE_DATA_VERSION, validateCharacters } from '../features/divination/characterInput'
import type { CharacterEntry } from '../features/divination/characterInput'
import { LeftHandAnimation } from '../components/LeftHandAnimation'
import { DivinationInterpretation } from '../components/DivinationInterpretation'
import { LocalGeminiInterpretation } from '../components/LocalGeminiInterpretation'

type Section = '起课' | '记录' | '规则'
type InputMode = 'number' | 'character'

const sections: Section[] = ['起课', '记录', '规则']

export function App() {
  const [activeSection, setActiveSection] = useState<Section>('起课')
  const [ruleSystem, setRuleSystem] = useState<RuleSystem>(classicSixRules)
  const [question, setQuestion] = useState('')
  const [inputs, setInputs] = useState(['', '', ''])
  const [retainedInputs, setRetainedInputs] = useState([false, false, false])
  const [errors, setErrors] = useState(['', '', ''])
  const [result, setResult] = useState<DivinationResult | null>(null)
  const [inputMode, setInputMode] = useState<InputMode>('number')
  const [characterInput, setCharacterInput] = useState('')
  const [characterEntries, setCharacterEntries] = useState<CharacterEntry[] | null>(null)
  const [characterError, setCharacterError] = useState('')
  const [selectedInput, setSelectedInput] = useState(0)

  const updateInput = (index: number, value: string) => {
    setInputs((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
    setRetainedInputs((current) => current.map((item, itemIndex) => itemIndex === index ? false : item))
    setErrors((current) => current.map((item, itemIndex) => itemIndex === index ? '' : item))
  }

  const startDivination = () => {
    if (inputMode === 'character') {
      if (!characterEntries || characterEntries.some((entry) => !entry.finalStrokeCount)) return
      setResult(calculateThreePasses(ruleSystem, characterEntries.map((entry) => BigInt(entry.finalStrokeCount!)) as [bigint, bigint, bigint]))
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
    setResult(calculateThreePasses(ruleSystem, parsed as [bigint, bigint, bigint]))
  }

  const resetToForm = () => setResult(null)

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
    setCharacterEntries(null)
    setCharacterError('')
    setSelectedInput(0)
  }

  const renderNavigationPage = () => {
    if (activeSection === '记录') return <section className="status-panel"><h2>记录</h2><p>记录功能后续开放。</p></section>
    if (activeSection === '规则') return <section className="status-panel"><h2>规则</h2><p>规则说明后续开放。</p></section>
    return result ? <ResultView result={result} question={question} characterEntries={inputMode === 'character' ? characterEntries : null} onBack={resetToForm} /> : <DivinationForm
      ruleSystem={ruleSystem} setRuleSystem={setRuleSystem} question={question} setQuestion={setQuestion}
      inputs={inputs} errors={errors} retainedInputs={retainedInputs} updateInput={updateInput} onSubmit={startDivination} selectedInput={selectedInput} setSelectedInput={setSelectedInput}
      inputMode={inputMode} setInputMode={switchInputMode} characterInput={characterInput} setCharacterInput={setCharacterInput}
      characterEntries={characterEntries} characterError={characterError} onConfirmCharacters={beginCharacterConfirmation}
      onCharacterEntriesChange={setCharacterEntries}
    />
  }

  return (
    <div className="app-shell">
      <main className={result && activeSection === '起课' ? 'main-content has-result' : 'main-content'}>
        <header className="brand-block">
          <p className="app-title">小六壬掌诀</p>
        </header>

        {renderNavigationPage()}

        <p className="disclaimer">传统文化研究与娱乐用途，不构成现实领域的专业建议。</p>
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

function DivinationForm({ ruleSystem, setRuleSystem, question, setQuestion, inputs, errors, retainedInputs, updateInput, onSubmit, inputMode, setInputMode, characterInput, setCharacterInput, characterEntries, characterError, onConfirmCharacters, onCharacterEntriesChange, selectedInput, setSelectedInput }: {
  ruleSystem: RuleSystem; setRuleSystem: (value: RuleSystem) => void; question: string; setQuestion: (value: string) => void
  inputs: string[]; errors: string[]; retainedInputs: boolean[]; updateInput: (index: number, value: string) => void; onSubmit: () => void
  inputMode: InputMode; setInputMode: (mode: InputMode) => void; characterInput: string; setCharacterInput: (value: string) => void
  characterEntries: CharacterEntry[] | null; characterError: string; onConfirmCharacters: () => void
  onCharacterEntriesChange: (entries: CharacterEntry[] | null) => void; selectedInput: number; setSelectedInput: (value: number) => void
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
    <div className="mode-tabs" role="tablist" aria-label="起课方式"><button type="button" role="tab" aria-selected={inputMode === 'number'} className={inputMode === 'number' ? 'mode-tab is-active' : 'mode-tab'} onClick={() => setInputMode('number')}>任意三数</button><button type="button" role="tab" aria-selected={inputMode === 'character'} className={inputMode === 'character' ? 'mode-tab is-active' : 'mode-tab'} onClick={() => setInputMode('character')}>任意三字</button></div>
    {inputMode === 'number' ? <><div className="numbers-grid">{inputs.map((value, index) => <div className={selectedInput === index ? 'number-field is-selected' : 'number-field'} key={index}><label className="field-label" htmlFor={`number-${index}`}>第{index + 1}数</label><input className={`text-input number-display${retainedInputs[index] ? ' is-retained' : ''}`} id={`number-${index}`} readOnly value={value} onClick={() => { setSelectedInput(index); updateInput(index, '') }} onKeyDown={handleNumberInputKeyDown} onChange={(event) => updateInput(index, event.target.value)} aria-invalid={Boolean(errors[index])} aria-describedby={errors[index] ? `error-${index}` : undefined} />{errors[index] && <p className="error-text" id={`error-${index}`}>{errors[index]}</p>}</div>)}</div><div className="number-keypad" aria-label="应用内数字键盘"><div className="keypad-row">{['1', '2', '3', '4', '5'].map((key) => <button type="button" key={key} aria-label={`输入${key}`} onClick={() => handleNumberKey(key)}>{key}</button>)}</div><div className="keypad-row">{['6', '7', '8', '9', '0'].map((key) => <button type="button" key={key} aria-label={`输入${key}`} onClick={() => handleNumberKey(key)}>{key}</button>)}</div><div className="keypad-row"><button type="button" aria-label="退格" onClick={() => handleNumberKey('backspace')}>退格</button><button type="button" aria-label="清空" onClick={() => handleNumberKey('clear')}>清空</button><button type="button" aria-label={inputs.every((value) => /^[1-9][0-9]*$/.test(value)) ? '开始起课' : '下一项'} onClick={() => handleNumberKey('next')}>{inputs.every((value) => /^[1-9][0-9]*$/.test(value)) ? '开始起课' : '下一项'}</button></div></div></> : <CharacterConfirmation characterInput={characterInput} setCharacterInput={setCharacterInput} characterEntries={characterEntries} characterError={characterError} onConfirm={onConfirmCharacters} onEntriesChange={onCharacterEntriesChange} onSubmit={onSubmit} />}
  </section>
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

function ResultView({ result, question, characterEntries, onBack }: { result: DivinationResult; question: string; characterEntries: CharacterEntry[] | null; onBack: () => void }) {
  const passes = [result.first, result.second, result.third] as const
  const labels = ['初传', '中传', '末传']
  const [animationComplete, setAnimationComplete] = useState(false)
  const handleAnimationCompleteChange = useCallback((complete: boolean) => setAnimationComplete(complete), [])
  return <section className="result-panel" aria-labelledby="result-title">
    <div className="result-layout">
      <div className="result-left">
        <div className="result-header"><div><p className="eyebrow">起课结果</p><h2 id="result-title">{question || '未填写事项'}</h2><p className="result-summary">{result.ruleSystemId === 'classic-six' ? '六宫' : '九宫'} · {characterEntries ? '三字起课' : '三数起课'} · {result.inputs.join('、')}</p></div><button className="secondary-button" type="button" onClick={onBack}>重新起课</button></div>
        <p className="result-meta">{result.ruleSystemId === 'classic-six' ? '六宫小六壬' : '九宫小六壬（荀爽体系）'} · 规则版本 {result.ruleVersion}</p>
        {characterEntries ? <><p className="source-line">原始三字：{characterEntries.map((entry) => entry.original).join('')}<br />转换后的繁体三字：{characterEntries.map((entry) => entry.traditional).join('')}</p><div className="character-result">{characterEntries.map((entry) => <span key={entry.original}>{entry.original} → {entry.traditional}：数据 {entry.dataStrokeCount ?? '未找到'}，最终 {entry.finalStrokeCount}</span>)}</div><p className="data-note">笔画来源：{STROKE_DATA_SOURCE} · {STROKE_DATA_VERSION}</p></> : <p className="source-line">原始数字：{result.inputs.join('、')}</p>}
        <LeftHandAnimation steps={result.steps} passes={passes} palaceCount={result.ruleSystemId === 'classic-six' ? 6 : 9} onCompleteChange={handleAnimationCompleteChange} />
      </div>
      {animationComplete && <div className="revealed-result">
        <div className="passes">{passes.map((palace, index) => <article className="pass-card" key={labels[index]}><p className="pass-label">{labels[index]}</p><h3>{palace.name}</h3><p>{palace.element} · {palace.direction || '方位未设定'}</p><p className="keywords">{palace.keywords.join('、')}</p></article>)}</div>
        <DivinationInterpretation passes={passes} />
        <LocalGeminiInterpretation context={{
          question,
          systemName: result.ruleSystemId === 'classic-six' ? '六宫小六壬' : '九宫小六壬（荀爽体系）',
          inputMethod: characterEntries ? '三字起课' : '三数起课',
          originalInput: characterEntries ? characterEntries.map((entry) => entry.original).join('') : result.inputs.join('、'),
          passes,
        }} />
      </div>}
    </div>
  </section>
}
