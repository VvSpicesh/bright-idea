import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { calculateThreePasses, classicSixRules, xunNineRules, type RuleSystem, type RuleSystemId } from '../rules'
import { describeElementRelation, elementControls, elementGenerates } from '../features/divination/interpretation'
import { palaceSemantics as palaceSemanticsData, type PalaceSemantics } from '../features/divination/palaceSemantics'
import { specificTopicLabels } from '../features/divination/questionContext'
import { getShichen } from '../features/divination/methods'
import { sixPalaceKnowledge } from '../features/divination/sixPalaceKnowledge'
import { traditionalPairs, derivedSamePairs } from '../features/divination/dayHourPairs'
import { RULE_SECTION_GROUPS, type RuleSection, type RuleSectionId } from './rulesSections'
import { SIX_RULE_SECTIONS } from './sixRuleSections'
import { NINE_RULE_SECTIONS } from './nineRuleSections'

const palaceSemantics: Record<string, PalaceSemantics> = palaceSemanticsData

const systems: readonly RuleSystem[] = [classicSixRules, xunNineRules]
const examples: Record<RuleSystemId, readonly [bigint, bigint, bigint]> = { 'classic-six': [6n, 6n, 6n], 'xun-nine': [1n, 12n, 6n] }
const timeRanges = [
  ['23:00–00:59', 23], ['01:00–02:59', 1], ['03:00–04:59', 3], ['05:00–06:59', 5],
  ['07:00–08:59', 7], ['09:00–10:59', 9], ['11:00–12:59', 11], ['13:00–14:59', 13],
  ['15:00–16:59', 15], ['17:00–18:59', 17], ['19:00–20:59', 19], ['21:00–22:59', 21],
] as const

function RulesSectionNav({ systemId, onSystemChange }: { systemId: RuleSystemId; onSystemChange: (id: RuleSystemId) => void }) {
  const groupId = systemId === 'classic-six' ? 'six' : 'nine'
  const sections = groupId === 'six' ? SIX_RULE_SECTIONS : NINE_RULE_SECTIONS
  const [activeSectionId, setActiveSectionId] = useState<RuleSectionId>(sections[0].id)
  const [pendingNavigation, setPendingNavigation] = useState<{ system: RuleSystemId; targetId: RuleSectionId; behavior: ScrollBehavior } | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const activeSectionRef = useRef(activeSectionId)
  activeSectionRef.current = activeSectionId

  const queueNavigation = (targetId: RuleSectionId, targetSystem: RuleSystemId, behavior: ScrollBehavior) => {
    observerRef.current?.disconnect()
    setIsNavigating(true)
    setActiveSectionId(targetId)
    setPendingNavigation({ system: targetSystem, targetId, behavior })
    setMobileOpen(false)
  }

  useEffect(() => {
    const handleHistory = () => {
      const hash = window.location.hash.slice(1) as RuleSectionId
      const target = [...SIX_RULE_SECTIONS, ...NINE_RULE_SECTIONS].find((section) => section.id === hash)
      if (!target) return
      const targetSystem = target.id.startsWith('nine-') ? 'xun-nine' : 'classic-six'
      if (targetSystem !== systemId) onSystemChange(targetSystem)
      queueNavigation(target.id, targetSystem, 'auto')
    }
    handleHistory()
    window.addEventListener('popstate', handleHistory)
    return () => window.removeEventListener('popstate', handleHistory)
    // History restoration is intentionally registered once for this page instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setActiveSectionId(sections[0].id)
  }, [systemId])

  useLayoutEffect(() => {
    if (!pendingNavigation || pendingNavigation.system !== systemId) return
    const target = document.getElementById(pendingNavigation.targetId)
    if (!target) {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        if (pendingNavigation.system === systemId && document.getElementById(pendingNavigation.targetId)) setPendingNavigation({ ...pendingNavigation })
      }))
      return
    }
    target.scrollIntoView?.({ behavior: pendingNavigation.behavior, block: 'start' })
    window.history.replaceState(null, '', `#${pendingNavigation.targetId}`)
    setActiveSectionId(pendingNavigation.targetId)
    setPendingNavigation(null)
    setIsNavigating(false)
  }, [pendingNavigation, systemId])

  useEffect(() => {
    observerRef.current?.disconnect()
    if (isNavigating || typeof IntersectionObserver === 'undefined') return
    const observed = Array.from(document.querySelectorAll<HTMLElement>('.rules-section[id]'))
    const observer = new IntersectionObserver((entries) => {
      if (isNavigating) return
      const targetLine = 88
      const visible = entries.filter((entry) => entry.isIntersecting)
        .map((entry) => ({ entry, distance: Math.abs(entry.boundingClientRect.top - targetLine) }))
        .sort((a, b) => a.distance - b.distance)[0]
      if (visible) setActiveSectionId(visible.entry.target.id as RuleSectionId)
    }, { rootMargin: '-88px 0px -60% 0px', threshold: [0, 0.2, 0.6] })
    observerRef.current = observer
    observed.forEach((section) => observer.observe(section))
    return () => {
      observer.disconnect()
      if (observerRef.current === observer) observerRef.current = null
    }
  }, [systemId, isNavigating])

  const navigateToRuleSection = (section: RuleSection, targetSystem: RuleSystemId) => {
    queueNavigation(section.id as RuleSectionId, targetSystem, targetSystem === systemId ? 'smooth' : 'auto')
    if (targetSystem !== systemId) onSystemChange(targetSystem)
  }
  const activeTitle = sections.find((section) => section.id === activeSectionId)?.title ?? sections[0].title
  return <nav className={`rules-toc ${mobileOpen ? 'is-open' : ''}`} aria-label="规则目录">
    <div className="rules-system-radio-compat"><label><input type="radio" name="rules-page-system" checked={systemId === 'classic-six'} onChange={() => navigateToRuleSection(SIX_RULE_SECTIONS[0], 'classic-six')} />六宫小六壬</label><label><input type="radio" name="rules-page-system" checked={systemId === 'xun-nine'} onChange={() => navigateToRuleSection(NINE_RULE_SECTIONS[0], 'xun-nine')} />九宫小六壬（荀爽体系）</label></div>
    <button className="rules-toc-toggle" type="button" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>规则目录：{activeTitle}</button>
    <div className="rules-toc-groups">{RULE_SECTION_GROUPS.map((group) => {
      const selected = group.id === groupId
      const targetSystem = group.id === 'six' ? 'classic-six' : 'xun-nine'
      const groupSections = group.id === 'six' ? SIX_RULE_SECTIONS : NINE_RULE_SECTIONS
      return <section className={`rules-toc-group ${selected ? 'is-active' : ''}`} key={group.id}>
        <button className="rules-toc-group-title" type="button" aria-expanded={selected} onClick={() => navigateToRuleSection(groupSections[0], targetSystem)}>{group.title}</button>
        {selected && <div className="rules-toc-list">{groupSections.map((section) => <button key={section.id} className={activeSectionId === section.id ? 'is-active' : ''} type="button" aria-current={activeSectionId === section.id ? 'location' : undefined} onClick={() => navigateToRuleSection(section, targetSystem)}>{section.title}</button>)}</div>}
      </section>
    })}</div>
  </nav>
}

function TopicCards({ knowledge }: { knowledge: typeof sixPalaceKnowledge[keyof typeof sixPalaceKnowledge] }) {
  return <div className="topic-meaning-grid">{Object.entries(knowledge.specificTopicMeanings).map(([topic, meaning]) => <article key={topic}><strong className="pass-label">{specificTopicLabels[topic as keyof typeof specificTopicLabels] ?? '其他事项'}</strong><p>{meaning.initial}</p><p>{meaning.process}</p><p>{meaning.outcome}</p></article>)}</div>
}

function SixPalaceCards() {
  return <div className="palace-rule-grid">{classicSixRules.palaces.map((palace) => { const knowledge = sixPalaceKnowledge[palace.name as keyof typeof sixPalaceKnowledge]; return <article className="palace-rule-card" key={palace.index}><header><span>{palace.index + 1}</span><h4>{palace.name}</h4><b>{palace.element}</b></header><dl><div><dt>阴阳／五行</dt><dd>{knowledge.polarity}／{knowledge.element}</dd></div><div><dt>方位／神兽</dt><dd>{knowledge.direction}／{knowledge.spirit}</dd></div><div><dt>宫位</dt><dd>{knowledge.palace}</dd></div><div><dt>关键词</dt><dd>{palace.keywords.join('、')}</dd></div><div><dt>通用含义</dt><dd>{knowledge.generalMeaning}</dd></div><div><dt>口诀原文</dt><dd>{knowledge.verse}</dd></div><div><dt>现代解释</dt><dd>{knowledge.verseModernMeaning}</dd></div><div><dt>事项细断</dt><dd><TopicCards knowledge={knowledge} /></dd></div><div><dt>人物特征</dt><dd>{knowledge.personalityMeaning}</dd></div><div><dt>传统人体对应</dt><dd>{knowledge.bodyMeaning}</dd></div><div><dt>天干地支</dt><dd>{knowledge.heavenlyStems}／{knowledge.earthlyBranches}／{knowledge.hiddenStem}</dd></div><div><dt>象数</dt><dd>{knowledge.numberSymbols.join('、')}（仅展示，不参与起课计算）</dd></div><div><dt>行动建议</dt><dd>{knowledge.advice}</dd></div></dl></article> })}</div>
}

function NinePalaceCards() {
  return <div className="palace-rule-grid">{xunNineRules.palaces.map((palace) => <article className="palace-rule-card" key={palace.index}><header><span>{palace.index + 1}</span><h4>{palace.name}</h4><b>{palace.element}</b></header><dl><div><dt>方位／神位</dt><dd>{palace.direction}／{palace.deity}</dd></div><div><dt>关键词</dt><dd>{palace.keywords.join('、')}</dd></div><div><dt>通用含义</dt><dd>{palaceSemantics[palace.name].first}</dd></div><div><dt>初传</dt><dd>{palaceSemantics[palace.name].first}</dd></div><div><dt>中传</dt><dd>{palaceSemantics[palace.name].middle}</dd></div><div><dt>末传</dt><dd>{palaceSemantics[palace.name].last}</dd></div><div><dt>行动建议</dt><dd>{palaceSemantics[palace.name].advice}</dd></div></dl></article>)}</div>
}

function SixVerses() {
  return <><p>口诀原文与现代解释分开展示；方位、时段和结果只作传统类象参考。健康内容不能用于诊断、疗效或生死判断。</p><p className="error-text rules-warning">健康类内容不能用于疾病诊断、疗效判断或生死预测，请以医生和实际检查结果为准。</p><p>口诀存在版本和流派差异；危险古断语仅作为原文展示，不作为现实事实。</p><div className="six-verse-grid">{Object.keys(sixPalaceKnowledge).map((name, index) => { const knowledge = sixPalaceKnowledge[name as keyof typeof sixPalaceKnowledge]; return <details className="six-verse-card" key={name} open={index === 0}><summary><span className="six-verse-title">{name}</span><span>{knowledge.polarity}</span><span>{knowledge.element}</span><span className="six-verse-keywords data-note">{knowledge.generalMeaning.split('、').slice(0, 3).join('、')}</span><span className="collapse-icon" aria-hidden="true">⌄</span></summary><div className="six-verse-content"><div className="six-verse-text"><div><h4>口诀原文</h4><p>{knowledge.verse}</p></div><div><h4>现代解释</h4><p>{knowledge.verseModernMeaning}</p></div></div><div><h4>事项细断</h4><TopicCards knowledge={knowledge} /></div></div></details> })}</div></>
}

function DayHourGroups() {
  return <div className="day-hour-groups">{Array.from(new Set(traditionalPairs.map((pair) => pair.dayPalace))).map((day) => <details className="day-hour-group" key={day}><summary><span>{day}起首 · 5组传统组合</span><span className="collapse-icon" aria-hidden="true">⌄</span></summary><div className="day-hour-pairs">{traditionalPairs.filter((pair) => pair.dayPalace === day).map((pair) => <article className="day-hour-pair" key={`${pair.dayPalace}-${pair.hourPalace}`}><header><strong>{pair.dayPalace}＋{pair.hourPalace}</strong><span className="pair-type data-note">传统口诀</span></header><p className="pair-verse">口诀原文：{pair.sourceVerse}</p><p>现代解释：{pair.modernMeaning}</p>{pair.traditionalHint && <small><strong className="pass-label">传统提示：</strong>{pair.traditionalHint}</small>}</article>)}</div></details>)}<details className="day-hour-group"><summary><span>同宫组合 · 6组现代推导</span><span className="collapse-icon" aria-hidden="true">⌄</span></summary><div className="day-hour-pairs">{derivedSamePairs.map((pair) => <article className="day-hour-pair" key={`${pair.dayPalace}-${pair.hourPalace}`}><header><strong>{pair.dayPalace}＋{pair.hourPalace}</strong><span className="pair-type data-note">同宫推导</span></header><p>现代解释：{pair.modernMeaning}</p></article>)}</div></details></div>
}

function MethodGrid({ system }: { system: RuleSystemId }) {
  return <div className="method-rule-grid"><article><h4>数字起课</h4><p>{system === 'classic-six' ? '输入三个正整数，按六宫顺序连续计数，每一传从上一传落宫继续起数。' : '输入三个正整数，按九宫顺序连续计数；大数如12按完整循环处理，不只取个位数。'}</p></article><article><h4>文字起课</h4><p>输入三个汉字，读取本地笔画数据后进入当前规则体系的同一计算引擎。</p></article><article><h4>随机起课</h4><p>浏览器安全随机生成三个 1～18 的整数，再使用当前体系计算。</p></article><article><h4>时间起课</h4><p>设备本地日期时间转换为农历月、农历日和时辰序号；六宫时间起课另有日时双宫联断。</p></article></div>
}

function PalaceOverview({ system }: { system: RuleSystem }) {
  return <section className="rules-section" id={`${system.id === 'classic-six' ? 'six' : 'nine'}-overview`}><h3>{system.name}体系说明</h3><p>{system.name}使用独立的宫位顺序、五行属性和连续计数规则。当前页面只渲染所选体系的完整规则正文。</p><p>宫位顺序：{system.palaces.map((palace) => palace.name).join(' → ')}。掌位从大安起，后续按当前体系顺序循环。</p></section>
}

function PalaceSection({ system }: { system: RuleSystem }) {
  return <section className="rules-section" id={`${system.id === 'classic-six' ? 'six' : 'nine'}-palaces`}><h3>{system.name}宫位顺序与解说配置</h3>{system.id === 'classic-six' ? <SixPalaceCards /> : <NinePalaceCards />}</section>
}

function CountingSection({ system }: { system: RuleSystem }) {
  const result = calculateThreePasses(system, examples[system.id])
  return <section className="rules-section" id={`${system.id === 'classic-six' ? 'six' : 'nine'}-counting`}><h3>{system.id === 'classic-six' ? '六宫连续计数' : '九宫连续计数'}</h3><p>每一数包含起点宫位，后一数从上一传落宫继续起数；当前体系按自身宫位数量循环。</p><div className="rule-example"><strong>{system.name}固定示例</strong><span>输入：{result.inputs.join('、')}</span><span>结果：{[result.first, result.second, result.third].map((pass) => pass.name).join(' → ')}</span></div></section>
}

function FiveElementsSection({ system }: { system: RuleSystem }) {
  const relations = [['木生火', describeElementRelation('木', '火')], ['火生木', describeElementRelation('火', '木')], ['木克土', describeElementRelation('木', '土')], ['土克木', describeElementRelation('土', '木')], ['同五行', describeElementRelation('木', '木')]] as const
  return <section className="rules-section" id={`${system.id === 'classic-six' ? 'six' : 'nine'}-five-elements`}><h3>{system.name}五行关系</h3><p>相生：{Object.entries(elementGenerates).map(([from, to]) => `${from}生${to}`).join(' → ')}</p><p>相克：{Object.entries(elementControls).map(([from, to]) => `${from}克${to}`).join(' → ')}</p><div className="relation-rule-list">{relations.map(([label, relation]) => <article key={label}><strong>{label}</strong><p>{relation.description}</p></article>)}</div></section>
}

function SixRules({ system }: { system: RuleSystem }) {
  return <><PalaceOverview system={system} /><PalaceSection system={system} /><CountingSection system={system} /><section className="rules-section" id="six-methods"><h3>六宫起课方式</h3><MethodGrid system="classic-six" /><div className="shichen-grid">{timeRanges.map(([range, hour]) => <span key={range}>{getShichen(hour).name}时 {getShichen(hour).index}：{range}</span>)}</div></section><section className="rules-section" id="six-transmissions"><h3>六宫三传说明</h3><p>初传说明前期基础与形成背景，中传说明发展过程和阻力，末传说明后续倾向与成立条件；问题领域会进一步调整表达角度。</p></section><FiveElementsSection system={system} /><section className="rules-section" id="six-interpretation"><h3>六宫情境化解说逻辑</h3><p>六宫解说读取用户问题并识别事业、财运、感情、学业、健康、出行、纠纷、寻物、人物或通用领域，再结合三传阶段、五行和阴阳变化生成内容。</p></section><section className="rules-section" id="six-verses"><h3>六宫口诀与事项细断</h3><SixVerses /></section><section className="rules-section" id="six-day-hour"><h3>日时双宫</h3><p>仅用于六宫时间起课，日宫在前、时宫在后，不改变三传落宫结果。</p><p className="error-text rules-warning">日时双宫仅用于六宫时间起课。传统口诀存在流派差异，方位、时效和结果只作传统文化参考，不作确定判断。</p><DayHourGroups /></section><section className="rules-section" id="six-history"><h3>六宫版本与历史快照</h3><p>当前规则版本为 {system.ruleVersion}；历史记录保留当时的规则版本、三传和解说快照。</p></section><section className="rules-section" id="six-notices"><h3>六宫流派与使用说明</h3><p>天干、地支、口诀方位等属于传统类象，存在流派差异，不参与落宫计算。健康内容不能用于疾病诊断、疗效判断或生死预测。</p></section></>
}

function NineRules({ system }: { system: RuleSystem }) {
  return <><PalaceOverview system={system} /><PalaceSection system={system} /><CountingSection system={system} /><section className="rules-section" id="nine-methods"><h3>九宫起课方式</h3><MethodGrid system="xun-nine" /></section><section className="rules-section" id="nine-transmissions"><h3>九宫三传说明</h3><p>初传、中传、末传分别对应当前九宫规则下的前期、过程和后续倾向；不引用六宫口诀或日时双宫。</p></section><FiveElementsSection system={system} /><section className="rules-section" id="nine-interpretation"><h3>九宫解说逻辑</h3><p>九宫当前使用宫位语义、阶段含义、五行关系和实际配置生成规则辅助解说；六宫事项细断、口诀和日时双宫不属于九宫功能。</p></section><section className="rules-section" id="nine-history"><h3>九宫版本与历史快照</h3><p>当前规则版本为 {system.ruleVersion}；历史记录保留当时的规则版本、三传和解说快照。</p></section><section className="rules-section" id="nine-notices"><h3>九宫流派与使用说明</h3><p>九宫配置采用荀爽体系资料，宫位、神位和五行属于规则类象。健康等现实问题不能替代医生、检查和专业意见。</p></section></>
}

export function RulesPage() {
  const [systemId, setSystemId] = useState<RuleSystemId>('classic-six')
  const system = systems.find((item) => item.id === systemId)!
  return <section className="content-panel rules-page" aria-labelledby="rules-title"><div className="page-heading"><div><p className="eyebrow">当前配置</p><h2 id="rules-title">规则</h2></div><span>版本 {system.ruleVersion}</span></div><div className="rules-layout"><aside className="rules-desktop-toc"><RulesSectionNav systemId={systemId} onSystemChange={setSystemId} /></aside><div className="rules-content">{systemId === 'classic-six' ? <SixRules system={system} /> : <NineRules system={system} />}</div></div></section>
}
