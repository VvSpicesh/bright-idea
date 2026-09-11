import type { Palace, RuleSystemId } from '../rules'
import { createDivinationInterpretation, interpretationDirections, type InterpretationDirection } from '../features/divination/interpretation'

export function DivinationInterpretation({ passes, direction, question, ruleSystemId, onDirectionChange }: { passes: readonly [Palace, Palace, Palace]; direction: InterpretationDirection; question: string; ruleSystemId: RuleSystemId; onDirectionChange: (direction: InterpretationDirection) => void }) {
  const interpretation = createDivinationInterpretation(passes, direction, question, ruleSystemId)

  return <section className="interpretation" aria-labelledby="interpretation-title">
    <label className="interpretation-direction">解读方向 <select value={direction} onChange={(event) => onDirectionChange(event.target.value as InterpretationDirection)}>{interpretationDirections.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    <h3 id="interpretation-title">一句话结论</h3>
    <p>{interpretation.summary}</p>
    <div className="interpretation-details">
      <div className="interpretation-section"><h4>发展过程</h4>{interpretation.passReadings.map((reading) => <p key={reading}>{reading}</p>)}</div>
      <div className="interpretation-section"><h4>关键转折</h4>{interpretation.turningPoints.map((transition) => <p key={transition}>{transition}</p>)}</div>
      <div className="interpretation-section"><h4>行动建议</h4>{interpretation.advice.split('\n').map((item) => <p key={item}>{item}</p>)}</div>
      <div className="interpretation-section"><h4>判断依据</h4><ul>{interpretation.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </div>
  </section>
}
