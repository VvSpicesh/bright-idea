import type { Palace } from '../rules'
import { createDivinationInterpretation } from '../features/divination/interpretation'

export function DivinationInterpretation({ passes }: { passes: readonly [Palace, Palace, Palace] }) {
  const interpretation = createDivinationInterpretation(passes)

  return <section className="interpretation" aria-labelledby="interpretation-title">
    <h3 id="interpretation-title">综合结论</h3>
    {interpretation.summary.map((sentence) => <p key={sentence}>{sentence}</p>)}
    <details className="interpretation-details">
      <summary>查看详细解读</summary>
      <div className="interpretation-section"><h4>三传解读</h4>{interpretation.passReadings.map((reading) => <p key={reading}>{reading}</p>)}</div>
      <div className="interpretation-section"><h4>五行关系</h4>{interpretation.transitions.map((transition, index) => <p key={`${index}-${transition.from}-${transition.to}`}>{transition.description}</p>)}</div>
      <div className="interpretation-section"><h4>行动建议</h4><p>{interpretation.advice}</p></div>
      <div className="interpretation-section"><h4>判断依据</h4><ul>{interpretation.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </details>
  </section>
}
