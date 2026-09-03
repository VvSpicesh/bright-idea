import { useState } from 'react'
import { calculateThreePasses, classicSixRules, xunNineRules } from '../rules'
import type { DivinationResult, RuleSystem } from '../rules'
import { isParsedNumber, parsePositiveInteger } from '../features/divination/numberInput'

type Section = '起课' | '记录' | '规则'

const sections: Section[] = ['起课', '记录', '规则']

export function App() {
  const [activeSection, setActiveSection] = useState<Section>('起课')
  const [ruleSystem, setRuleSystem] = useState<RuleSystem>(classicSixRules)
  const [question, setQuestion] = useState('')
  const [inputs, setInputs] = useState(['', '', ''])
  const [errors, setErrors] = useState(['', '', ''])
  const [result, setResult] = useState<DivinationResult | null>(null)

  const updateInput = (index: number, value: string) => {
    setInputs((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
    setErrors((current) => current.map((item, itemIndex) => itemIndex === index ? '' : item))
  }

  const startDivination = () => {
    const parsed = inputs.map(parsePositiveInteger)
    const nextErrors = parsed.map((value) => {
      if (value === 'required') return '请输入正整数'
      if (value === 'positiveInteger') return '仅支持正整数，不含小数或符号'
      return ''
    })
    setErrors(nextErrors)
    if (!parsed.every(isParsedNumber)) return
    setResult(calculateThreePasses(ruleSystem, parsed as [bigint, bigint, bigint]))
  }

  const resetToForm = () => setResult(null)

  const renderNavigationPage = () => {
    if (activeSection === '记录') return <section className="status-panel"><h2>记录</h2><p>记录功能后续开放。</p></section>
    if (activeSection === '规则') return <section className="status-panel"><h2>规则</h2><p>规则说明后续开放。</p></section>
    return result ? <ResultView result={result} question={question} onBack={resetToForm} /> : <DivinationForm
      ruleSystem={ruleSystem} setRuleSystem={setRuleSystem} question={question} setQuestion={setQuestion}
      inputs={inputs} errors={errors} updateInput={updateInput} onSubmit={startDivination}
    />
  }

  return (
    <div className="app-shell">
      <main className="main-content">
        <header className="brand-block">
          <p className="eyebrow">小六壬工具</p>
          <h1>bright-idea</h1>
          <p className="intro">把每一步看清楚，再做自己的判断。</p>
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

function DivinationForm({ ruleSystem, setRuleSystem, question, setQuestion, inputs, errors, updateInput, onSubmit }: {
  ruleSystem: RuleSystem; setRuleSystem: (value: RuleSystem) => void; question: string; setQuestion: (value: string) => void
  inputs: string[]; errors: string[]; updateInput: (index: number, value: string) => void; onSubmit: () => void
}) {
  return <section className="form-panel" aria-labelledby="form-title">
    <div className="section-heading"><span className="panel-mark" aria-hidden="true">卜</span><div><h2 id="form-title">任意三数起课</h2><p>输入三个正整数，查看完整计算轨迹。</p></div></div>
    <fieldset className="system-choice"><legend>规则体系</legend>
      {[classicSixRules, xunNineRules].map((system) => <label className="choice" key={system.id}><input type="radio" name="rule-system" checked={ruleSystem.id === system.id} onChange={() => setRuleSystem(system)} /><span>{system.name}</span></label>)}
    </fieldset>
    <label className="field-label" htmlFor="question">所问事项 <span>（可选）</span></label>
    <input className="text-input" id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：今天适合推进这件事吗？" />
    <div className="numbers-grid">{inputs.map((value, index) => <div className="number-field" key={index}><label className="field-label" htmlFor={`number-${index}`}>第{index + 1}数</label><input className="text-input" id={`number-${index}`} inputMode="numeric" value={value} onChange={(event) => updateInput(index, event.target.value)} aria-invalid={Boolean(errors[index])} aria-describedby={errors[index] ? `error-${index}` : undefined} />{errors[index] && <p className="error-text" id={`error-${index}`}>{errors[index]}</p>}</div>)}</div>
    <button className="primary-button" type="button" onClick={onSubmit}>开始起课</button>
  </section>
}

function ResultView({ result, question, onBack }: { result: DivinationResult; question: string; onBack: () => void }) {
  const passes = [result.first, result.second, result.third]
  const labels = ['初传', '中传', '末传']
  return <section className="result-panel" aria-labelledby="result-title">
    <div className="result-header"><div><p className="eyebrow">起课结果</p><h2 id="result-title">{question || '未填写事项'}</h2></div><button className="secondary-button" type="button" onClick={onBack}>返回修改</button></div>
    <p className="result-meta">{result.ruleSystemId === 'classic-six' ? '六宫小六壬' : '九宫小六壬（荀爽体系）'} · 规则版本 {result.ruleVersion}</p>
    <p className="source-line">原始数字：{result.inputs.join('、')}</p>
    <div className="passes">{passes.map((palace, index) => <article className="pass-card" key={labels[index]}><p className="pass-label">{labels[index]}</p><h3>{palace.name}</h3><p>{palace.element} · {palace.direction || '方位未设定'}</p><p className="keywords">{palace.keywords.join('、')}</p></article>)}</div>
    <h3 className="trace-title">计算轨迹</h3>
    <ol className="trace-list">{result.steps.map((step, index) => <li key={labels[index]}><strong>{labels[index]}</strong><span>从{step.startIndex + 1}号宫起数，输入 {step.input}，第 {step.rounds} 圈余 {step.remainder}，落在第 {step.endIndex + 1}号宫（{passes[index].name}）</span></li>)}</ol>
    <button className="primary-button" type="button" onClick={onBack}>重新起课</button>
  </section>
}
