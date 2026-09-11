export const sixQuestionDomains = ['事业', '财运', '感情', '学业', '健康', '出行', '纠纷', '寻物', '人物', '通用'] as const
export type SixQuestionDomain = typeof sixQuestionDomains[number]

export interface SixPalaceKnowledge {
  readonly polarity: '阳' | '阴'
  readonly element: '木' | '火' | '土' | '金' | '水'
  readonly direction: string
  readonly spirit: string
  readonly palace: string
  readonly generalMeaning: string
  readonly topicMeanings: Readonly<Partial<Record<Exclude<SixQuestionDomain, '通用' | '人物'>, string>>>
  readonly personalityMeaning: string
  readonly bodyMeaning: string
  readonly positiveExpression: string
  readonly negativeExpression: string
  readonly advice: string
  readonly heavenlyStems: string
  readonly earthlyBranches: string
  readonly hiddenStem: string
  readonly numberSymbols: readonly number[]
}

export const sixPalaceKnowledge = {
  大安: {
    polarity: '阳', element: '木', direction: '东方', spirit: '青龙', palace: '震宫',
    generalMeaning: '安定、持续、守成、长期积累',
    topicMeanings: { 事业: '工作基础较明确，适合按计划推进', 财运: '已有资源可以保留，偏向长期积累', 感情: '关系倾向持续，但发展速度不快', 学业: '基础和日常积累重要', 健康: '传统上对应肝胆、四肢；不能据此诊断', 出行: '行程变化较少，宜按原计划' },
    personalityMeaning: '谨慎务实、有原则，也可能比较固执', bodyMeaning: '传统类象为肝胆、四肢，不能据此诊断',
    positiveExpression: '节奏稳定，已有安排能够持续发挥作用', negativeExpression: '过于守成，进展可能偏慢或不愿调整', advice: '保持节奏，先巩固已有条件',
    heavenlyStems: '甲乙', earthlyBranches: '寅卯', hiddenStem: '丁', numberSymbols: [1, 4, 5],
  },
  留连: {
    polarity: '阴', element: '土', direction: '四隅', spirit: '螣蛇', palace: '未设定',
    generalMeaning: '拖延、反复、牵扯、难以立即确定',
    topicMeanings: { 事业: '流程、审批或沟通可能反复', 财运: '资金被占用、回款延后或账目牵扯', 感情: '关系纠结，双方态度可能反复', 学业: '进度拖延，需要处理积压问题', 健康: '过程可能反复或恢复较慢；不能判断具体疾病', 出行: '可能延误、改期或受到其他事项牵制' },
    personalityMeaning: '顾虑较多、行动反复，也可能拖延', bodyMeaning: '传统人体对应资料未提供',
    positiveExpression: '反复核实后能看清卡点', negativeExpression: '拖延和牵扯持续消耗时间与精力', advice: '确认卡点，设置期限，避免持续消耗',
    heavenlyStems: '己', earthlyBranches: '辰未戌', hiddenStem: '丁', numberSymbols: [2, 7, 8],
  },
  速喜: {
    polarity: '阳', element: '火', direction: '南方', spirit: '朱雀', palace: '离宫',
    generalMeaning: '消息、加速、突然推进、阶段性喜讯',
    topicMeanings: { 事业: '可能较快收到回复、通知或新机会', 财运: '短期出现进账或交易机会，但持续性需另看', 感情: '互动升温、联系增加或较快得到回应', 学业: '短期效率提高，容易出现阶段成果', 健康: '表示消息或变化较快；不能解释为病情必然好转', 出行: '行程推进快，也可能临时决定' },
    personalityMeaning: '外向直接、反应快，但容易急躁', bodyMeaning: '传统人体对应资料未提供',
    positiveExpression: '信息明确且回应及时，机会能被接住', negativeExpression: '只见短期热度，细节尚未落实', advice: '及时回应机会，同时核实细节',
    heavenlyStems: '丙丁', earthlyBranches: '巳午未', hiddenStem: '辛', numberSymbols: [3, 6, 9],
  },
  赤口: {
    polarity: '阴', element: '金', direction: '西方', spirit: '白虎', palace: '兑宫',
    generalMeaning: '口舌、冲突、竞争、损伤、压力',
    topicMeanings: { 事业: '意见冲突、竞争、责任争议或沟通问题', 财运: '可能因争议、失误或额外支出造成损耗', 感情: '争吵、误会或言辞伤人', 学业: '压力较大，容易因急躁或争论影响表现', 健康: '仅表示需要谨慎关注并听从医生意见', 出行: '注意争执、赶路和意外风险' },
    personalityMeaning: '立场较强、竞争意识明显，冲突时表达直接', bodyMeaning: '传统人体对应资料未提供',
    positiveExpression: '分歧被及时说清并转为规则或边界', negativeExpression: '争执、失误或额外压力扩大损耗', advice: '减少正面冲突，保留记录，优先控制风险',
    heavenlyStems: '庚辛', earthlyBranches: '申酉', hiddenStem: '癸', numberSymbols: [4, 1, 2],
  },
  小吉: {
    polarity: '阳', element: '水', direction: '北方', spirit: '玄武', palace: '坎宫',
    generalMeaning: '合作、流动、出行、小有所得、关系协调',
    topicMeanings: { 事业: '适合协作、沟通和借助他人资源', 财运: '可能有小额所得、合作收益或新财源', 感情: '互动较顺，适合沟通、见面和缓和关系', 学业: '通过交流、请教或调整方法获得进展', 健康: '可通过配合和持续处理改善处境；不能作为疗效判断', 出行: '与移动、见面、外出有关，整体较顺' },
    personalityMeaning: '随和、重视关系，擅长协调', bodyMeaning: '传统人体对应资料未提供',
    positiveExpression: '协作顺畅，出现可验证的小进展', negativeExpression: '收获有限，过度期待会放大落差', advice: '主动沟通，利用合作机会，不必追求一步到位',
    heavenlyStems: '壬癸', earthlyBranches: '亥子', hiddenStem: '甲', numberSymbols: [5, 6, 10],
  },
  空亡: {
    polarity: '阴', element: '土', direction: '中央', spirit: '勾陈', palace: '中宫',
    generalMeaning: '缺失、落空、方向不明、条件尚未形成',
    topicMeanings: { 事业: '计划可能缺少关键条件，职位或安排仍未确定', 财运: '预期收益可能暂时无法兑现', 感情: '关系缺少实质进展，或双方目标不一致', 学业: '目标不清、计划难落实，需要重新确定重点', 健康: '信息不足或结果尚未明确，必须以检查和医生意见为准', 出行: '计划可能取消、落空或需要重新安排' },
    personalityMeaning: '想法较多，但方向和行动尚未落实', bodyMeaning: '传统人体对应资料未提供',
    positiveExpression: '及时发现信息缺口并补齐必要条件', negativeExpression: '预期落空，计划难以形成实际行动', advice: '先确认事实和必要条件，不要只依赖预期',
    heavenlyStems: '戊', earthlyBranches: '丑辰未', hiddenStem: '乙', numberSymbols: [6, 5, 10],
  },
} satisfies Record<string, SixPalaceKnowledge>

export type SixPalaceName = keyof typeof sixPalaceKnowledge
