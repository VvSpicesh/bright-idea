export const sixQuestionDomains = ['事业', '财运', '感情', '学业', '健康', '出行', '纠纷', '寻物', '人物', '通用'] as const
export type SixQuestionDomain = typeof sixQuestionDomains[number]
export const sixSpecificTopics = ['lostProperty', 'travelerMessage', 'wealth', 'dispute', 'relationship', 'health'] as const
export type SixSpecificTopic = typeof sixSpecificTopics[number]

export interface SpecificTopicMeaning {
  readonly initial: string
  readonly process: string
  readonly outcome: string
  readonly action: string
  readonly traditionalHint?: string
}

export interface SixPalaceKnowledge {
  readonly polarity: '阳' | '阴'
  readonly element: '木' | '火' | '土' | '金' | '水'
  readonly direction: string
  readonly spirit: string
  readonly palace: string
  readonly generalMeaning: string
  readonly verse: string
  readonly verseModernMeaning: string
  readonly topicMeanings: Readonly<Partial<Record<Exclude<SixQuestionDomain, '通用' | '人物'>, string>>>
  readonly specificTopicMeanings: Readonly<Record<SixSpecificTopic, SpecificTopicMeaning>>
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
    verse: '大安事事昌，求财在南方。失物寻便见，行人立便当。行人身未动，病者主无妨。衣服依时领，官事顺理长。',
    verseModernMeaning: '现代解释：事情宜循既有条件推进；求财、寻物、行人等方向提示仅作传统类象参考，不能代替事实核验。',
    topicMeanings: { 事业: '工作基础较明确，适合按计划推进', 财运: '已有资源可以保留，偏向长期积累', 感情: '关系倾向持续，但发展速度不快', 学业: '基础和日常积累重要', 健康: '传统上对应肝胆、四肢；不能据此诊断', 出行: '行程变化较少，宜按原计划' },
    specificTopicMeanings: {
      lostProperty: { initial: '物品通常离原位置不远，可能仍在熟悉环境或家中', process: '先沿最后使用地点和原处附近排查', outcome: '后续仍有获得线索的空间，但不能保证一定找到', action: '检查最后使用地点、原处附近和固定收纳位置', traditionalHint: '传统提示可先参考南至西南方向；不同口诀版本并不一致。' },
      travelerMessage: { initial: '对方可能尚未行动，状态变化不大', process: '先确认既定行程和已知联系人', outcome: '消息是否到来仍以实际联系为准', action: '发送一次明确询问并核对行程信息', traditionalHint: '口诀有“行人身未动”等说法，仅作传统类象参考。' },
      wealth: { initial: '已有来源较可依靠，适合守住原有渠道', process: '核对现有约定和到账条件', outcome: '可在稳定条件下逐步确认收益', action: '保留可验证的渠道并核实回款凭据', traditionalHint: '口诀中的南方求财提示仅作传统参考。' },
      dispute: { initial: '适合按规则、证据和正常流程处理', process: '把争点和材料逐项厘清', outcome: '推进取决于事实与程序而非宫象', action: '整理时间线、证据和沟通记录' },
      relationship: { initial: '关系基础尚在，进展偏缓', process: '通过稳定沟通确认双方期待', outcome: '能否推进要看实际回应和承诺', action: '约定一次具体沟通并确认边界' },
      health: { initial: '当前状态变化可能不大，应继续观察和检查', process: '按既定安排记录症状和检查信息', outcome: '后续以医生评估和实际反馈为准', action: '按医生安排检查或复诊，不据此调整治疗' },
    },
    personalityMeaning: '谨慎务实、有原则，也可能比较固执', bodyMeaning: '左腿、肝胆、四肢',
    positiveExpression: '节奏稳定，已有安排能够持续发挥作用', negativeExpression: '过于守成，进展可能偏慢或不愿调整', advice: '保持节奏，先巩固已有条件',
    heavenlyStems: '甲乙', earthlyBranches: '寅卯', hiddenStem: '丁', numberSymbols: [1, 4, 5],
  },
  留连: {
    polarity: '阴', element: '土', direction: '四隅', spirit: '螣蛇', palace: '未设定',
    generalMeaning: '拖延、反复、牵扯、难以立即确定',
    verse: '留连事难成，求谋日未明。官事只宜缓，去者未回程。失物南方见，急讨方称心。更防口舌惹，人口且太平。',
    verseModernMeaning: '现代解释：处理容易反复，宜确认卡点与期限；失物南方等提示仅作传统类象参考。',
    topicMeanings: { 事业: '流程、审批或沟通可能反复', 财运: '资金被占用、回款延后或账目牵扯', 感情: '关系纠结，双方态度可能反复', 学业: '进度拖延，需要处理积压问题', 健康: '过程可能反复或恢复较慢；不能判断具体疾病', 出行: '可能延误、改期或受到其他事项牵制' },
    specificTopicMeanings: {
      lostProperty: { initial: '物品可能被移动、遮挡、夹住，或经过他人转手', process: '沿移动路线倒查并询问接触过物品的人', outcome: '寻找过程可能反复，不能解释成永久丢失', action: '尽快询问接触者并检查夹层、遮挡处', traditionalHint: '传统提示偏南方，仅供扩大排查范围时参考。' },
      travelerMessage: { initial: '行程或回复可能延迟', process: '确认延误原因和新的联系节点', outcome: '仍需等待可核实的消息', action: '设定下一次确认时间并保留备用安排' },
      wealth: { initial: '回款或交易容易拖延、反复', process: '逐项核对账目、条款和审批环节', outcome: '能否到账取决于关键条件是否补齐', action: '明确回款节点并书面催办' },
      dispute: { initial: '处理周期较长，可能反复沟通', process: '避免在情绪下扩大争点', outcome: '需要耐心等待流程与材料反馈', action: '列出待办、期限和每次沟通结论' },
      relationship: { initial: '态度反复或存在牵扯', process: '先厘清尚未说开的条件', outcome: '关系是否继续应看行动是否一致', action: '提出一个可明确回应的问题' },
      health: { initial: '处理过程可能较长或反复', process: '持续记录实际变化并遵医嘱复查', outcome: '不能凭宫象判断病情走向', action: '按医生安排复诊，记录症状变化' },
    },
    personalityMeaning: '顾虑较多、行动反复，也可能拖延', bodyMeaning: '左臂、心、肾、胃',
    positiveExpression: '反复核实后能看清卡点', negativeExpression: '拖延和牵扯持续消耗时间与精力', advice: '确认卡点，设置期限，避免持续消耗',
    heavenlyStems: '己', earthlyBranches: '辰未戌', hiddenStem: '丁', numberSymbols: [2, 7, 8],
  },
  速喜: {
    polarity: '阳', element: '火', direction: '南方', spirit: '朱雀', palace: '离宫',
    generalMeaning: '消息、加速、突然推进、阶段性喜讯',
    verse: '速喜喜临门，求财向南行。失物申未见，行人立便闻。官事有高位，词讼得理明。病者得痊愈，田蚕皆大丰。',
    verseModernMeaning: '现代解释：消息或流程可能加快；“申未”和健康吉断存在流派与语境差异，不能作确定结果。',
    topicMeanings: { 事业: '可能较快收到回复、通知或新机会', 财运: '短期出现进账或交易机会，但持续性需另看', 感情: '互动升温、联系增加或较快得到回应', 学业: '短期效率提高，容易出现阶段成果', 健康: '表示消息或变化较快；不能解释为病情必然好转', 出行: '行程推进快，也可能临时决定' },
    specificTopicMeanings: {
      lostProperty: { initial: '较快得到线索，可能通过询问、消息或途中发现', process: '立即联系相关人员并检查刚去过的地点和交通路线', outcome: '后续较容易获得新线索，但仍需实物确认', action: '马上联系相关人员，逐一核对最近路线', traditionalHint: '传统提示可参考南至西南方向，或午、未、申对应时段；两种理解并存。' },
      travelerMessage: { initial: '较快收到信息或到达通知', process: '及时核实消息来源和具体时间', outcome: '通知不等于实际到达，仍需确认', action: '收到消息后确认位置、时间和下一步安排' },
      wealth: { initial: '短期可能出现消息或交易机会', process: '及时确认交易条件和责任人', outcome: '持续性仍要看合同和实际到账', action: '当天核验价格、合同与到账条件', traditionalHint: '口诀中的南方求财提示仅作传统参考。' },
      dispute: { initial: '较快获得通知、回应或推进', process: '及时阅读程序性信息并留存记录', outcome: '结果仍以证据和程序为准', action: '确认通知期限，必要时及时咨询专业人士' },
      relationship: { initial: '互动增加，较快收到回应', process: '把热度转为清楚的沟通与安排', outcome: '是否稳定仍要看持续行动', action: '及时回复并确认一次具体见面或协作安排' },
      health: { initial: '检查、消息或治疗安排可能较快出现变化', process: '及时向医生确认检查与安排含义', outcome: '不能解释为疗效或必然好转', action: '记录检查结果并按医生安排处理' },
    },
    personalityMeaning: '外向直接、反应快，但容易急躁', bodyMeaning: '头脑、血液、心脑',
    positiveExpression: '信息明确且回应及时，机会能被接住', negativeExpression: '只见短期热度，细节尚未落实', advice: '及时回应机会，同时核实细节',
    heavenlyStems: '丙丁', earthlyBranches: '巳午未', hiddenStem: '辛', numberSymbols: [3, 6, 9],
  },
  赤口: {
    polarity: '阴', element: '金', direction: '西方', spirit: '白虎', palace: '兑宫',
    generalMeaning: '口舌、冲突、竞争、损伤、压力',
    verse: '赤口主口舌，官事且紧防。失物急急找，行人有惊慌。鸡犬多作怪，病者出西方。更防咒诅事，口舌带刀枪。',
    verseModernMeaning: '现代解释：沟通、责任与现场秩序的风险上升；口诀中的怪异、诅咒等内容不是事实判断。',
    topicMeanings: { 事业: '意见冲突、竞争、责任争议或沟通问题', 财运: '可能因争议、失误或额外支出造成损耗', 感情: '争吵、误会或言辞伤人', 学业: '压力较大，容易因急躁或争论影响表现', 健康: '仅表示需要谨慎关注并听从医生意见', 出行: '注意争执、赶路和意外风险' },
    specificTopicMeanings: {
      lostProperty: { initial: '需要尽快寻找，环境可能混乱或出现误拿、交接不清', process: '及时核实同行人员、失物招领和交接记录', outcome: '不能直接断定被盗或已经损坏', action: '查看监控、失物招领、同行人员及交接记录', traditionalHint: '可把传统西方类象作为辅助排查，不作位置断定。' },
      travelerMessage: { initial: '途中可能有压力、争议或意外变化', process: '用现实渠道确认安全与行程状态', outcome: '消息需以实际联系为准', action: '直接联系对方或相关承运方，确认最新状态' },
      wealth: { initial: '注意争议、合同问题和额外损耗', process: '核对条款、责任和费用明细', outcome: '先控制风险再评估收益', action: '保留合同与凭据，暂停不清楚的付款' },
      dispute: { initial: '冲突性强，需重视言辞、证据和程序风险', process: '避免升级对抗，按程序表达主张', outcome: '处理结果取决于事实与证据', action: '保存原始记录，必要时咨询法律或行业专业人士' },
      relationship: { initial: '容易争执、误会或表达过激', process: '暂停情绪化沟通并核对事实', outcome: '能否缓和取决于双方是否愿意修正表达', action: '用书面或冷静沟通明确分歧与边界' },
      health: { initial: '需要重视风险并及时就医', process: '不要因焦虑或争论延误现实检查', outcome: '不能从宫象判断病情', action: '出现不适及时就医并遵从专业意见' },
    },
    personalityMeaning: '立场较强、竞争意识明显，冲突时表达直接', bodyMeaning: '右臂、肺、肠胃',
    positiveExpression: '分歧被及时说清并转为规则或边界', negativeExpression: '争执、失误或额外压力扩大损耗', advice: '减少正面冲突，保留记录，优先控制风险',
    heavenlyStems: '庚辛', earthlyBranches: '申酉', hiddenStem: '癸', numberSymbols: [4, 1, 2],
  },
  小吉: {
    polarity: '阳', element: '水', direction: '北方', spirit: '玄武', palace: '坎宫',
    generalMeaning: '合作、流动、出行、小有所得、关系协调',
    verse: '小吉最吉昌，路上好商量。阴人来报喜，失物在坤方。求财从十二，行人主便当。交加婚姻吉，官事得安康。',
    verseModernMeaning: '现代解释：协作、沟通和流动渠道较有帮助；坤方、数字等均为传统提示，不参与计算。',
    topicMeanings: { 事业: '适合协作、沟通和借助他人资源', 财运: '可能有小额所得、合作收益或新财源', 感情: '互动较顺，适合沟通、见面和缓和关系', 学业: '通过交流、请教或调整方法获得进展', 健康: '可通过配合和持续处理改善处境；不能作为疗效判断', 出行: '与移动、见面、外出有关，整体较顺' },
    specificTopicMeanings: {
      lostProperty: { initial: '通过他人协助、询问或交接较容易获得线索', process: '联系同行者、工作人员、家人或最后接触物品的人', outcome: '可能获得可验证线索，但不能保证结果', action: '按接触顺序询问相关人员', traditionalHint: '传统提示偏坤方，即西南方向，仅作辅助参考。' },
      travelerMessage: { initial: '通过沟通较容易取得联系', process: '利用共同联系人和现有行程信息确认', outcome: '消息仍应以本人或可靠渠道确认', action: '请共同联系人协助核实并确认回复时间' },
      wealth: { initial: '合作、介绍、流动渠道可能带来所得', process: '筛选可核实的合作与交易机会', outcome: '先从小额、可验证的机会推进', action: '确认分工、结算方式和风险上限', traditionalHint: '口诀中的“从十二”只作传统类象，不作数字计算。' },
      dispute: { initial: '调解、协商和第三方帮助较有作用', process: '尝试在明确争点后引入中立协调', outcome: '和解仍需以书面约定落实', action: '准备可协商方案并记录达成的约定' },
      relationship: { initial: '适合见面、协商与合作', process: '通过具体安排建立信任', outcome: '关系发展取决于持续配合', action: '提出一次可执行的见面或合作计划' },
      health: { initial: '配合治疗和照护可能带来积极帮助', process: '与医生和照护者持续沟通实际反馈', outcome: '不能据此承诺疗效', action: '按医嘱配合治疗与照护并记录变化' },
    },
    personalityMeaning: '随和、重视关系，擅长协调', bodyMeaning: '右腿、肾、肝、肠',
    positiveExpression: '协作顺畅，出现可验证的小进展', negativeExpression: '收获有限，过度期待会放大落差', advice: '主动沟通，利用合作机会，不必追求一步到位',
    heavenlyStems: '壬癸', earthlyBranches: '亥子', hiddenStem: '甲', numberSymbols: [5, 6, 10],
  },
  空亡: {
    polarity: '阴', element: '土', direction: '中央', spirit: '勾陈', palace: '中宫',
    generalMeaning: '缺失、落空、方向不明、条件尚未形成',
    verse: '空亡事不祥，阴人多乖张。求财无利益，行人有灾殃。失物寻不见，官事有刑伤。病人逢恶鬼，谋望主彷徨。',
    verseModernMeaning: '现代解释：信息或条件不足，宜重查事实并准备替代方案；口诀中的灾殃、恶鬼等不作为现实事实。',
    topicMeanings: { 事业: '计划可能缺少关键条件，职位或安排仍未确定', 财运: '预期收益可能暂时无法兑现', 感情: '关系缺少实质进展，或双方目标不一致', 学业: '目标不清、计划难落实，需要重新确定重点', 健康: '信息不足或结果尚未明确，必须以检查和医生意见为准', 出行: '计划可能取消、落空或需要重新安排' },
    specificTopicMeanings: {
      lostProperty: { initial: '目前线索不足，原有判断可能错误，寻找范围需要扩大', process: '重新确认最后出现时间并查看记录、定位和监控', outcome: '不能直接显示为永远找不到', action: '扩大排查范围，核对记录并及时办理必要挂失' },
      travelerMessage: { initial: '暂时没有有效消息，原计划可能变化', process: '重新确认联系人、行程和替代联络方式', outcome: '需要等待可靠信息而非自行猜测', action: '通过可靠渠道核实，并准备备用安排' },
      wealth: { initial: '预期收益可能暂时不能兑现', process: '确认收益依据、资金来源和约定是否真实', outcome: '暂不宜把预期当成结果', action: '暂停追加投入，核实合同、凭据和回款能力' },
      dispute: { initial: '主张可能缺少依据，或结果暂时难确定', process: '补齐事实、证据和程序信息', outcome: '先明确缺口再评估下一步', action: '核对证据链和时限，必要时咨询专业人士' },
      relationship: { initial: '目标不一致或缺少实质行动', process: '确认双方是否有共同的现实安排', outcome: '没有行动支持时不宜只依赖期待', action: '明确各自目标和下一步时间点' },
      health: { initial: '信息不足，不能仅凭当前迹象下结论', process: '以检查、症状变化和医生意见补足信息', outcome: '不作诊断、疗效或生死判断', action: '尽快按医生建议检查或复诊' },
    },
    personalityMeaning: '想法较多，但方向和行动尚未落实', bodyMeaning: '膀胱、生殖系统、脾、脑',
    positiveExpression: '及时发现信息缺口并补齐必要条件', negativeExpression: '预期落空，计划难以形成实际行动', advice: '先确认事实和必要条件，不要只依赖预期',
    heavenlyStems: '戊', earthlyBranches: '丑辰未', hiddenStem: '乙', numberSymbols: [6, 5, 10],
  },
} satisfies Record<string, SixPalaceKnowledge>

export type SixPalaceName = keyof typeof sixPalaceKnowledge
