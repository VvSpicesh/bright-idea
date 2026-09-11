import { useState } from 'react'
import { calculateThreePasses, classicSixRules, xunNineRules, type RuleSystem, type RuleSystemId } from '../rules'
import { describeElementRelation, elementControls, elementGenerates } from '../features/divination/interpretation'
import { palaceSemantics } from '../features/divination/palaceSemantics'
import { intentRecognitionRules, interpretationDirections, topicRecognitionRules } from '../features/divination/questionContext'
import { getShichen } from '../features/divination/methods'
import { sixPalaceKnowledge } from '../features/divination/sixPalaceKnowledge'

const systems: readonly RuleSystem[] = [classicSixRules, xunNineRules]
const examples: Record<RuleSystemId, readonly [bigint, bigint, bigint]> = {
  'classic-six': [6n, 6n, 6n],
  'xun-nine': [1n, 12n, 6n],
}

const timeRanges = [
  ['23:00–00:59', 23], ['01:00–02:59', 1], ['03:00–04:59', 3], ['05:00–06:59', 5],
  ['07:00–08:59', 7], ['09:00–10:59', 9], ['11:00–12:59', 11], ['13:00–14:59', 13],
  ['15:00–16:59', 15], ['17:00–18:59', 17], ['19:00–20:59', 19], ['21:00–22:59', 21],
] as const

export function RulesPage() {
  const [systemId, setSystemId] = useState<RuleSystemId>('classic-six')
  const system = systems.find((item) => item.id === systemId)!
  const exampleResults = systems.map((item) => ({ system: item, result: calculateThreePasses(item, examples[item.id]) }))
  const relations = [
    ['前传生后传', describeElementRelation('木', '火')],
    ['后传生前传', describeElementRelation('火', '木')],
    ['前传克后传', describeElementRelation('木', '土')],
    ['后传克前传', describeElementRelation('土', '木')],
    ['同五行', describeElementRelation('木', '木')],
  ] as const

  return <section className="content-panel rules-page" aria-labelledby="rules-title">
    <div className="page-heading"><div><p className="eyebrow">当前配置</p><h2 id="rules-title">规则</h2></div><span>版本 {system.ruleVersion}</span></div>
    <fieldset className="system-choice"><legend>规则体系</legend>{systems.map((item) => <label className="choice" key={item.id}><input type="radio" name="rules-page-system" checked={systemId === item.id} onChange={() => setSystemId(item.id)} /><span>{item.name}</span></label>)}</fieldset>

    <section className="rules-section"><h3>宫位顺序与解说配置</h3><p>以下内容直接读取当前规则和解说配置；没有配置的字段显示“未设定”。</p><div className="palace-rule-grid">{system.palaces.map((palace) => {
      const semantics = palaceSemantics[palace.name as keyof typeof palaceSemantics]
      const sixKnowledge = system.id === 'classic-six' ? sixPalaceKnowledge[palace.name as keyof typeof sixPalaceKnowledge] : undefined
      return <article className="palace-rule-card" key={palace.index}><header><span>{palace.index + 1}</span><h4>{palace.name}</h4><b>{palace.element}</b></header><dl>{sixKnowledge ? <><div><dt>阴阳／五行</dt><dd>{sixKnowledge.polarity}／{sixKnowledge.element}</dd></div><div><dt>方位／神兽</dt><dd>{sixKnowledge.direction}／{sixKnowledge.spirit}</dd></div><div><dt>宫位</dt><dd>{sixKnowledge.palace}</dd></div><div><dt>关键词</dt><dd>{palace.keywords.join('、')}</dd></div><div><dt>通用含义</dt><dd>{sixKnowledge.generalMeaning}</dd></div><div><dt>事项领域</dt><dd>{Object.entries(sixKnowledge.topicMeanings).map(([topic, meaning]) => `${topic}：${meaning}`).join('；')}</dd></div><div><dt>人物特征</dt><dd>{sixKnowledge.personalityMeaning}</dd></div><div><dt>人体对应</dt><dd>{sixKnowledge.bodyMeaning}</dd></div><div><dt>天干／地支／藏干</dt><dd>{sixKnowledge.heavenlyStems}／{sixKnowledge.earthlyBranches}／{sixKnowledge.hiddenStem}</dd></div><div><dt>象数对应</dt><dd>{sixKnowledge.numberSymbols.join('、')}（仅展示，不参与起课计算）</dd></div><div><dt>行动建议</dt><dd>{sixKnowledge.advice}</dd></div></> : <><div><dt>方位</dt><dd>{palace.direction || '未设定'}</dd></div><div><dt>关键词</dt><dd>{palace.keywords.join('、') || '未设定'}</dd></div><div><dt>初传含义</dt><dd>{semantics?.first || '未设定'}</dd></div><div><dt>中传含义</dt><dd>{semantics?.middle || '未设定'}</dd></div><div><dt>末传含义</dt><dd>{semantics?.last || '未设定'}</dd></div><div><dt>行动建议</dt><dd>{semantics?.advice || '未设定'}</dd></div></>}</dl></article>
    })}</div></section>

    <section className="rules-section"><h3>连续起数规则</h3><ol><li>第一个数从大安开始，大安计为 1。</li><li>第二个数从初传落宫开始，该落宫计为 1。</li><li>第三个数从中传落宫开始，该落宫计为 1。</li><li>六宫和九宫分别按各自宫位顺序循环。</li></ol><div className="rule-example-grid">{exampleResults.map(({ system: exampleSystem, result: example }) => <div className="rule-example" key={exampleSystem.id}><strong>{exampleSystem.name}固定示例</strong><span>输入：{example.inputs.join('、')}</span><span>结果：{[example.first, example.second, example.third].map((pass) => pass.name).join(' → ')}</span><small>结果由当前 `calculateThreePasses()` 运行生成。</small></div>)}</div></section>

    <section className="rules-section"><h3>四种起课方式</h3><div className="method-rule-grid"><article><h4>三数起课</h4><p>输入三个正整数，不接受 0、负数、小数、符号或空值。</p></article><article><h4>三字起课</h4><p>输入恰好三个汉字，先按词组转换为通用繁体，再读取本地康熙笔画数据；用户可修改繁体字和最终笔画，三个最终笔画进入同一引擎。</p></article><article><h4>随机起课</h4><p>浏览器安全随机生成三个 1～18 的整数。</p></article><article><h4>时间起课</h4><p>设备本地公历日期时间转换为农历月、农历日和时辰序号。闰月使用同名月份数字（代码取月份绝对值）；23:00 起属子时，但公历日期仍按设备民用日期传入换算，不另做“晚子时换日”。</p></article></div><div className="shichen-grid">{timeRanges.map(([range, hour]) => { const item = getShichen(hour); return <span key={range}>{item.name}时 {item.index}：{range}</span> })}</div></section>

    <section className="rules-section"><h3>五行关系</h3><p>相生：{Object.entries(elementGenerates).map(([from, to]) => `${from}生${to}`).join(' → ')}</p><p>相克：{Object.entries(elementControls).map(([from, to]) => `${from}克${to}`).join(' → ')}</p><div className="relation-rule-list">{relations.map(([label, relation]) => <article key={label}><strong>{label}</strong><p>{relation.description}</p></article>)}</div></section>

    <section className="rules-section"><h3>解说逻辑</h3><p>初传代表前期，中传代表发展过程，末传代表结果倾向。topic 方向包括 {interpretationDirections.join('、')}；自动识别顺序为 {topicRecognitionRules.map(([direction]) => direction).join(' → ')}，未匹配时为综合。intent 依次识别 {intentRecognitionRules.map(([intent, pattern]) => `${intent}（${pattern.source.replaceAll('|', '、')}）`).join('、')}，未匹配时为 trend。</p><p>六宫天干、地支、藏干属于进阶类象，存在流派差异，不参与三传落宫计算。topic 和 intent 只调整表达角度，不修改三传和五行。解说属于规则辅助，不是事实结论。AI 按钮只复制提示词并跳转外部网站，不调用 API。</p></section>

    <section className="rules-section"><h3>版本与历史快照</h3><p>当前体系规则版本为 {system.ruleVersion}。历史记录保存起课当时的规则版本、三传、步骤和解说快照；查看旧记录不会按当前配置重新计算。使用“按当前规则重新起课”会新增记录，不覆盖旧记录。</p></section>
  </section>
}
