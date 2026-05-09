/* =============================================================
   明日方舟 博士人格测试 — DATA
   5 Models × 3 Dims = 15 dims
   30 situation-choice questions (2 per dim)
   Each choice carries a raw score: -2 / -1 / +1 / +2
   dir: +1 = agree→high, -1 = reversed
   ============================================================= */

const AVATAR_BASE = 'assets/avatar/';
const LOGO_BASE   = 'assets/camplogo/';

/* ── Dimensions ── */
const DIMS = [
  { id:'C1',  model:'指挥模型', label:'决策风格',   desc:'直觉↔推演' },
  { id:'C2',  model:'指挥模型', label:'风险承受',   desc:'激进↔保守' },
  { id:'C3',  model:'指挥模型', label:'目标优先',   desc:'任务↔人员' },
  { id:'Em1', model:'情感模型', label:'共情深度',   desc:'冷静↔感性' },
  { id:'Em2', model:'情感模型', label:'情感边界',   desc:'融合↔隔离' },
  { id:'Em3', model:'情感模型', label:'信任基线',   desc:'开放↔审慎' },
  { id:'At1', model:'态度模型', label:'规则遵从',   desc:'秩序↔变通' },
  { id:'At2', model:'态度模型', label:'感染者立场', desc:'平等↔隔离' },
  { id:'At3', model:'态度模型', label:'理想主义',   desc:'理想↔现实' },
  { id:'Ac1', model:'行动模型', label:'行动速度',   desc:'迅速↔审慎' },
  { id:'Ac2', model:'行动模型', label:'手段底线',   desc:'原则↔功利' },
  { id:'Ac3', model:'行动模型', label:'坚持倾向',   desc:'坚守↔灵活' },
  { id:'So1', model:'社会模型', label:'社交主动',   desc:'开放↔封闭' },
  { id:'So2', model:'社会模型', label:'权威认同',   desc:'服从↔质疑' },
  { id:'So3', model:'社会模型', label:'表达方式',   desc:'直接↔迂回' },
];

/* ── Questions ── */
/* scene: short location/time string shown on test screen */
const QUESTIONS = [

  /* C1 — 决策风格（直觉 HIGH, 推演 LOW） */
  {
    dim:'C1', dir:1,
    scene:'🗺️ 作战规划室 · 出发前夕',
    text:'作战计划已经推演了数轮，但仍有一个变量无法预测。你会如何决策？',
    choices:[
      { text:'现有情报已足够，凭经验直接出发', score:2 },
      { text:'补充侦察后再决定', score:1 },
      { text:'继续推演，直到覆盖更多可能性', score:-1 },
      { text:'放弃这次行动，等待更完整的情报', score:-2 },
    ],
  },
  {
    dim:'C1', dir:-1,
    scene:'⚡ 紧急通讯 · 战场实时',
    text:'前线突发意外，原方案全部失效。你有30秒做出新决定，你会？',
    choices:[
      { text:'迅速根据直觉给出临时指令', score:-2 },
      { text:'快速评估当前形势，选最优解', score:-1 },
      { text:'要求前线提供更多信息再决断', score:1 },
      { text:'启动预设应急方案，暂不做新决定', score:2 },
    ],
  },

  /* C2 — 风险承受（激进 HIGH, 保守 LOW） */
  {
    dim:'C2', dir:1,
    scene:'📋 医疗舱 · 作战后总结',
    text:'一次高风险奇袭有60%概率大胜、40%概率全灭，稳妥路线则保证小胜。你会选哪条路？',
    choices:[
      { text:'选奇袭，大胜才有意义', score:2 },
      { text:'倾向奇袭，但会再评估干员状态', score:1 },
      { text:'倾向稳妥，不赌干员的命', score:-1 },
      { text:'稳妥路线，保存实力才是正确答案', score:-2 },
    ],
  },
  {
    dim:'C2', dir:1,
    scene:'🏭 废弃矿场 · 情报简报',
    text:'一条未经核实的情报指向一个重要目标。是否派遣小队立即行动？',
    choices:[
      { text:'立即行动，等核实就错过了', score:2 },
      { text:'派小队先侦察，条件合适就进攻', score:1 },
      { text:'先核实情报，再决定是否出动', score:-1 },
      { text:'不基于未核实情报行动', score:-2 },
    ],
  },

  /* C3 — 目标优先（任务优先 HIGH, 人员优先 LOW） */
  {
    dim:'C3', dir:1,
    scene:'🔥 切尔诺伯格废墟 · 撤退途中',
    text:'撤退路线上有一批平民难以转移，绕路救人将导致任务失败。你会怎么做？',
    choices:[
      { text:'任务优先，这一次只能放弃他们', score:2 },
      { text:'在不影响核心目标的前提下尽力救援', score:1 },
      { text:'拆分队伍，一半救援一半完成任务', score:-1 },
      { text:'放弃任务，人命高于一切', score:-2 },
    ],
  },
  {
    dim:'C3', dir:-1,
    scene:'💊 方舟甲板 · 深夜',
    text:'一名干员为完成任务而选择冒险，你会如何评价这个决定？',
    choices:[
      { text:'干员是最重要的资产，这种冒险不应发生', score:-2 },
      { text:'结果还好，但要和他谈谈规范流程', score:-1 },
      { text:'任务完成了，冒险在合理范围内', score:1 },
      { text:'完成任务才是核心，冒险是必要代价', score:2 },
    ],
  },

  /* Em1 — 共情深度（感性 HIGH, 冷静 LOW） */
  {
    dim:'Em1', dir:1,
    scene:'🏥 医疗舱 · 个案咨询',
    text:'一名感染者干员向你倾诉对病情的恐惧与绝望，你的第一反应是？',
    choices:[
      { text:'认真聆听，告诉他你理解这种感受', score:2 },
      { text:'表示关心，同时引导他回到正向思考', score:1 },
      { text:'肯定他的工作价值，转移注意力', score:-1 },
      { text:'告知现有医疗进展，用数据给他信心', score:-2 },
    ],
  },
  {
    dim:'Em1', dir:-1,
    scene:'📰 情报处 · 战损统计',
    text:'本次行动伤亡超出预期，你在阅读报告时的状态更接近哪种？',
    choices:[
      { text:'逐项分析原因，记录改进方案', score:-2 },
      { text:'先处理情绪，再做复盘', score:1 },
      { text:'情绪很沉重，好一段时间才能集中注意力', score:2 },
      { text:'告诉自己这是战争的代价，继续工作', score:-1 },
    ],
  },

  /* Em2 — 情感边界（融合 LOW, 隔离 HIGH） */
  {
    dim:'Em2', dir:1,
    scene:'🌙 观测舱 · 休息时间',
    text:'阿米娅来找你聊天，谈到了一些她内心的脆弱。你通常的回应方式是？',
    choices:[
      { text:'认真聆听，适时分享自己的感受', score:-2 },
      { text:'陪她聊，但保持适当的专业距离', score:-1 },
      { text:'温柔但克制，不越过博士与干员的边界', score:1 },
      { text:'提供建议，尽量保持理性对话', score:2 },
    ],
  },
  {
    dim:'Em2', dir:1,
    scene:'🗓️ 罗德岛会议室 · 日常会议',
    text:'你对待方舟上干员的方式，更接近哪种？',
    choices:[
      { text:'尽量了解每个人的情况，像家人一样相处', score:-2 },
      { text:'关心干员，但清楚地维持工作关系', score:-1 },
      { text:'以专业合作为主，私交保持有限', score:1 },
      { text:'博士是指挥者，过深的私交会影响判断', score:2 },
    ],
  },

  /* Em3 — 信任基线（开放 HIGH, 审慎 LOW） */
  {
    dim:'Em3', dir:1,
    scene:'🚪 接待室 · 新干员报到',
    text:'一名来历不明但能力突出的干员申请加入罗德岛，你的初始态度是？',
    choices:[
      { text:'先接收，在合作中建立信任', score:2 },
      { text:'给予机会，同时安排常规背景调查', score:1 },
      { text:'背调完成前仅限后勤岗位', score:-1 },
      { text:'来历不明就是风险，暂不接收', score:-2 },
    ],
  },
  {
    dim:'Em3', dir:1,
    scene:'🤝 外交接触 · 势力代表',
    text:'整合运动派来一名使者表达谈判意愿，你的第一直觉是？',
    choices:[
      { text:'对话总比冲突好，先听听对方说什么', score:2 },
      { text:'谈判可以，但需要确认基本诚意', score:1 },
      { text:'高度警惕，这可能是情报刺探', score:-1 },
      { text:'整合运动的谈判毫无意义，直接拒绝', score:-2 },
    ],
  },

  /* At1 — 规则遵从（秩序 HIGH, 变通 LOW） */
  {
    dim:'At1', dir:1,
    scene:'📜 龙门城区 · 联合执法',
    text:'完成任务的最快方式需要绕过龙门的某项规定，你会怎么选？',
    choices:[
      { text:'严格遵守规定，寻找合规替代方案', score:2 },
      { text:'与龙门方面沟通，争取临时授权', score:1 },
      { text:'任务要求紧迫，先行动后解释', score:-1 },
      { text:'规定本身有问题，直接无视', score:-2 },
    ],
  },
  {
    dim:'At1', dir:-1,
    scene:'⚖️ 罗德岛甲板 · 内部会议',
    text:'凯尔希对某项决定有异议，但你认为那是正确的选择。你会？',
    choices:[
      { text:'充分讨论后仍坚持自己的判断', score:-2 },
      { text:'认真倾听后综合双方意见', score:-1 },
      { text:'凯尔希经验丰富，她的意见通常更有分量', score:1 },
      { text:'遵从凯尔希的意见，她的判断一贯正确', score:2 },
    ],
  },

  /* At2 — 感染者立场（平等 HIGH, 隔离 LOW） */
  {
    dim:'At2', dir:1,
    scene:'🌆 城市边缘 · 难民营',
    text:'一座城市拒绝接收矿石病感染者难民，你如何回应？',
    choices:[
      { text:'公开表态反对，并向该城市施压', score:2 },
      { text:'通过外交渠道表达立场，寻求谈判', score:1 },
      { text:'提供罗德岛的收容能力作为替代方案', score:-1 },
      { text:'这是各国内政，罗德岛不便干涉', score:-2 },
    ],
  },
  {
    dim:'At2', dir:1,
    scene:'🏥 医疗舱 · 接诊记录',
    text:'你对感染者干员获得与非感染者相同的晋升机会，是什么看法？',
    choices:[
      { text:'理所应当，能力才是标准', score:2 },
      { text:'应该平等，但需要考量实际健康状况', score:1 },
      { text:'感染者干员的特殊情况需要特殊考量', score:-1 },
      { text:'感染者干员最终都会离开，晋升意义不大', score:-2 },
    ],
  },

  /* At3 — 理想主义（理想 HIGH, 现实 LOW） */
  {
    dim:'At3', dir:1,
    scene:'🌅 船舱窗外 · 夜航',
    text:'你对罗德岛的最终目标，内心更倾向于哪种描述？',
    choices:[
      { text:'治愈矿石病，让感染者不再被歧视', score:2 },
      { text:'建立有效的医疗体系，改善现有处境', score:1 },
      { text:'在有限资源下尽可能多做一些事', score:-1 },
      { text:'活下去，有能力才能谈理想', score:-2 },
    ],
  },
  {
    dim:'At3', dir:-1,
    scene:'💬 通讯记录 · 外交往来',
    text:'有一项计划在理论上能推动感染者权益，但代价是消耗大量资源。你会？',
    choices:[
      { text:'先算成本，看资源是否支撑这个计划', score:-2 },
      { text:'推动计划，同时寻求外部资源支持', score:-1 },
      { text:'重要的事不应只用成本衡量', score:1 },
      { text:'只要方向对，不惜一切也要推动', score:2 },
    ],
  },

  /* Ac1 — 行动速度（迅速 HIGH, 审慎 LOW） */
  {
    dim:'Ac1', dir:1,
    scene:'🚨 紧急警报 · 方舟外部',
    text:'方舟遭到不明武装袭击，你的第一反应是？',
    choices:[
      { text:'立刻指挥干员迎战，边打边分析', score:2 },
      { text:'指令防御准备，同时分析对方意图', score:1 },
      { text:'先确认敌方身份，避免误判后果', score:-1 },
      { text:'启动撤离预案，保存方舟实力再说', score:-2 },
    ],
  },
  {
    dim:'Ac1', dir:1,
    scene:'📡 情报室 · 紧急简报',
    text:'目标区域出现新的矿石病暴发迹象，是否立即派遣医疗队？',
    choices:[
      { text:'立即出发，早一分钟到就少一份伤亡', score:2 },
      { text:'准备出发，先确认接入通道和安全条件', score:1 },
      { text:'等当地请求或情报确认后再出动', score:-1 },
      { text:'优先评估方舟自身资源是否足够支撑', score:-2 },
    ],
  },

  /* Ac2 — 手段底线（原则 LOW, 功利 HIGH） */
  {
    dim:'Ac2', dir:-1,
    scene:'🔒 审讯室 · 情报获取',
    text:'一名俘虏掌握关键情报，但拒绝开口。时间极为紧迫，你会怎么做？',
    choices:[
      { text:'严格遵守人道底线，依规进行审讯', score:-2 },
      { text:'施加心理压力，但不越过人身伤害底线', score:-1 },
      { text:'非常时期，部分手段是必要的', score:1 },
      { text:'结果最重要，手段是次要问题', score:2 },
    ],
  },
  {
    dim:'Ac2', dir:-1,
    scene:'🌍 博士的办公室 · 道德困境',
    text:'与一个劣迹斑斑的势力合作，能换取对矿石病研究至关重要的资源。你会？',
    choices:[
      { text:'拒绝，与不道德的势力合作会损害罗德岛的立场', score:-2 },
      { text:'谨慎接触，设定清晰底线', score:-1 },
      { text:'权衡利弊，有条件地接受合作', score:1 },
      { text:'目的正当，合作方的道德问题是他们的问题', score:2 },
    ],
  },

  /* Ac3 — 坚持倾向（坚守 HIGH, 灵活 LOW） */
  {
    dim:'Ac3', dir:1,
    scene:'🔄 策略更新 · 长期任务',
    text:'你制定的长期计划遭到多方质疑，执行中也遇到重重阻碍。你会？',
    choices:[
      { text:'坚持推进，质疑和阻碍不改变正确方向', score:2 },
      { text:'吸纳有效意见后继续推进', score:1 },
      { text:'重新评估计划，必要时大幅调整', score:-1 },
      { text:'阻力太大就另起炉灶，换个方向', score:-2 },
    ],
  },
  {
    dim:'Ac3', dir:1,
    scene:'🏔️ 山地营地 · 困境中',
    text:'在极度困难的情况下，你坚守一项承诺的动力来自？',
    choices:[
      { text:'承诺就是承诺，不管有多难都要实现', score:2 },
      { text:'承诺很重要，但要在能力范围内履行', score:1 },
      { text:'情况变化可以重新谈判，承诺不是绝对的', score:-1 },
      { text:'无法履行的承诺不如不承诺', score:-2 },
    ],
  },

  /* So1 — 社交主动（开放 HIGH, 封闭 LOW） */
  {
    dim:'So1', dir:1,
    scene:'🎉 船舱休息区 · 庆功聚餐',
    text:'任务完成后，干员们自发组织了一场小聚会，你会？',
    choices:[
      { text:'欣然参加，这是凝聚团队的好机会', score:2 },
      { text:'去露个脸，待一会儿就回去继续工作', score:1 },
      { text:'如果没有特别邀请就不主动参加', score:-1 },
      { text:'庆功聚餐是干员的事，博士不应在场', score:-2 },
    ],
  },
  {
    dim:'So1', dir:1,
    scene:'🌐 外交场合 · 领袖峰会',
    text:'在一场各势力代表云集的场合，你的行为方式更接近哪种？',
    choices:[
      { text:'主动拓展关系，在聊天中传达罗德岛立场', score:2 },
      { text:'有针对性地与关键人物交流', score:1 },
      { text:'保持礼貌但话不多，主要是倾听', score:-1 },
      { text:'完成必要的外交接触后尽早离场', score:-2 },
    ],
  },

  /* So2 — 权威认同（服从 HIGH, 质疑 LOW） */
  {
    dim:'So2', dir:1,
    scene:'📋 最高委员会 · 紧急会议',
    text:'一个泰拉主要国家政府对罗德岛的行动提出强烈反对，你的态度是？',
    choices:[
      { text:'在现有规则框架下寻找妥协方案', score:2 },
      { text:'解释立场，尝试说服，但保留独立判断', score:1 },
      { text:'如果他们的反对没有充分理由，我们继续', score:-1 },
      { text:'罗德岛的判断不受任何国家政治干预', score:-2 },
    ],
  },
  {
    dim:'So2', dir:-1,
    scene:'📜 历史档案室 · 自我审视',
    text:'你对泰拉现有的国际秩序和各国权力结构，态度是？',
    choices:[
      { text:'现有秩序是多年沉淀的产物，应尊重并在内部推动改变', score:2 },
      { text:'有其合理性，但需要改革', score:1 },
      { text:'存在根本性问题，需要从外部施压', score:-1 },
      { text:'这套秩序本身就是矿石病问题的根源之一', score:-2 },
    ],
  },

  /* So3 — 表达方式（直接 LOW, 迂回 HIGH） */
  {
    dim:'So3', dir:-1,
    scene:'💬 通讯频道 · 外交电报',
    text:'你需要传达一个可能引发争议的立场，你会怎么措辞？',
    choices:[
      { text:'直接表明立场，避免误解', score:-2 },
      { text:'清晰但有礼节地表达，适当铺垫', score:-1 },
      { text:'通过语境暗示，留下解读空间', score:1 },
      { text:'委婉表达，不直接触碰敏感核心', score:2 },
    ],
  },
  {
    dim:'So3', dir:1,
    scene:'🤔 个人反思 · 博士办公室',
    text:'当你不同意某个干员的行动方式时，你通常会如何处理？',
    choices:[
      { text:'找机会私下直接指出问题', score:-2 },
      { text:'正式会议上提出并讨论', score:-1 },
      { text:'通过调整任务安排间接引导', score:1 },
      { text:'除非严重影响任务，否则尽量不直接干涉', score:2 },
    ],
  },
];

/* ── Faction Types ── */
/*
  profile: 15 dims, each -1/0/+1 (L/M/H)
  logoFile: filename in camplogo/ repo
  operators: [{ name, charId }]  charId = filename in avatar/ repo (no extension)
*/
const FACTIONS = [
  {
    code: 'RHODES',
    name: '罗德岛制药',
    fullname: '罗德岛制药公司型',
    emoji: '⚕️',
    tagline: '"感染者也是人，值得被当作人对待。"',
    color: '#e07b39',
    traits: ['实用主义', '医疗使命', '感染者权益', '中立立场', '包容并蓄'],
    desc: '你是这个世界上最难做的角色——一个夹在各方势力之间，以医疗为名却承载着政治、军事与道德全部重量的指挥者。你相信问题可以通过对话与努力解决，你不轻易放弃任何人，但你也清楚地知道理想需要资源才能实现。你不是圣人，但你一直在试图做正确的事。',
    logoFile: 'logo_rhodes.png',
    operators: [
      { name: '阿米娅', charId: 'char_002_amiya' },
      { name: '凯尔希', charId: 'char_003_kalts' },
      { name: '杜宾', charId: 'char_130_doberm' },
    ],
    profile: { C1:0, C2:0, C3:-1, Em1:1, Em2:0, Em3:1, At1:0, At2:1, At3:1, Ac1:0, Ac2:-1, Ac3:1, So1:1, So2:0, So3:0 },
  },
  {
    code: 'REUNION',
    name: '整合运动',
    fullname: '整合运动型',
    emoji: '🔥',
    tagline: '"这个世界欠我们一个解释。"',
    color: '#c45a5a',
    traits: ['激进理想主义', '感染者优先', '以暴制暴', '极端手段', '愤怒驱动'],
    desc: '你不接受这个世界的不公平，也不愿意用"渐进改变"来安慰自己。感染者的处境激怒了你，你愿意为他们做任何事——哪怕需要打破规则，哪怕手段会让人不舒服。你有时候会走得太远，但你内心的愤怒是真实的，那份对平等的渴望也是真实的。',
    logoFile: 'logo_followers.png',
    operators: [
      { name: 'W', charId: 'char_113_cqbw' },
    ],
    profile: { C1:1, C2:1, C3:1, Em1:1, Em2:-1, Em3:1, At1:-1, At2:1, At3:1, Ac1:1, Ac2:1, Ac3:1, So1:0, So2:-1, So3:-1 },
  },
  {
    code: 'RHINE',
    name: '莱茵生命',
    fullname: '莱茵生命实验室型',
    emoji: '🔬',
    tagline: '"数据不说谎，情感会。"',
    color: '#4a9cc8',
    traits: ['科技理性', '利益优先', '秩序至上', '精英主义', '结果导向'],
    desc: '你用数据和逻辑看待世界，对感情色彩的决策天然保持警惕。你相信科技能解决矿石病，相信有效率的体系比感情用事更能帮助人。你在意结果而非过程，在意能力而非立场。有时候这让你显得冷酷，但你知道情绪化只会让事情更糟。',
    logoFile: 'logo_rhine.png',
    operators: [
      { name: '赫默', charId: 'char_108_silent' },
      { name: '伊芙利特', charId: 'char_134_ifrit' },
    ],
    profile: { C1:-1, C2:0, C3:1, Em1:-1, Em2:1, Em3:0, At1:1, At2:-1, At3:-1, Ac1:0, Ac2:1, Ac3:1, So1:-1, So2:1, So3:1 },
  },
  {
    code: 'PENGUIN',
    name: '企鹅物流',
    fullname: '企鹅物流型',
    emoji: '🐧',
    tagline: '"规则？我只认拳头和交情。"',
    color: '#f5a623',
    traits: ['义气为先', '灰色地带', '自由主义', '街头智慧', '不拘一格'],
    desc: '你用自己的方式运作，不在乎别人的规则书上怎么写。你重情义，对朋友两肋插刀，对敌人毫不手软。你游走于各方势力之间，利用信息差和人脉做你认为对的事。你看起来吊儿郎当，但关键时刻你的判断往往比那些正儿八经的人准得多。',
    logoFile: 'logo_penguin.png',
    operators: [
      { name: '能天使', charId: 'char_103_angel' },
      { name: '德克萨斯', charId: 'char_102_texas' },
      { name: '空', charId: 'char_101_sora' },
    ],
    profile: { C1:1, C2:1, C3:-1, Em1:0, Em2:0, Em3:1, At1:-1, At2:0, At3:0, Ac1:1, Ac2:0, Ac3:0, So1:1, So2:-1, So3:-1 },
  },
  {
    code: 'GLASGOW',
    name: '格拉斯哥帮',
    fullname: '格拉斯哥帮型',
    emoji: '🥊',
    tagline: '"我们不完美，但我们从不抛弃自己人。"',
    color: '#c4762a',
    traits: ['团队忠诚', '草根出身', '街头规则', '实干精神', '底层视角'],
    desc: '你不来自精英阶层，你的价值观是在底层摸爬滚打中磨出来的。你最重视的是对伙伴的忠诚——背叛朋友是不可原谅的，而保护自己人是一切行动的第一准则。你不相信那些光鲜的大道理，你相信实际行动和身边的人。',
    logoFile: 'logo_glasgow.png',
    operators: [
      { name: '推进之王', charId: 'char_112_siege' },
      { name: '因陀罗', charId: 'char_155_tiger' },
    ],
    profile: { C1:1, C2:1, C3:-1, Em1:1, Em2:-1, Em3:1, At1:-1, At2:0, At3:0, Ac1:1, Ac2:0, Ac3:1, So1:1, So2:-1, So3:-1 },
  },
  {
    code: 'VICTORIA',
    name: '维多利亚王室',
    fullname: '维多利亚贵族型',
    emoji: '👑',
    tagline: '"荣誉、传统与责任，缺一不可。"',
    color: '#9b7fcc',
    traits: ['贵族传统', '荣誉至上', '内部矛盾', '责任感', '传统守护'],
    desc: '你深信传统与秩序的价值，认为荣誉是比生命更重要的东西。你愿意为保护你所认同的体制承担巨大代价，但你也开始意识到这个体制内部有着深刻的矛盾与腐败。你不是不知道，你只是选择用自己的方式，从内部去修正它。',
    logoFile: 'logo_victoria.png',
    operators: [
      { name: '推进之王', charId: 'char_112_siege' },
    ],
    profile: { C1:0, C2:-1, C3:0, Em1:0, Em2:1, Em3:0, At1:1, At2:0, At3:0, Ac1:0, Ac2:-1, Ac3:1, So1:0, So2:1, So3:1 },
  },
  {
    code: 'KJERAG',
    name: '喀戎峰',
    fullname: '喀戎传统守护型',
    emoji: '🏔️',
    tagline: '"山岳见证了一切，我们守护的是比生命更古老的东西。"',
    color: '#7fbfaa',
    traits: ['传统主义', '隐世守护', '慎重改变', '自然法则', '内部平衡'],
    desc: '你珍视那些经受了时间考验的传统，认为仓促的改变往往带来更大的破坏。你倾向于守护、维持、保存，而不是激进变革。这不代表你固执，而是你相信稳定的基础才能支撑真正的进步。你对外部世界保持距离，但并非漠不关心。',
    logoFile: 'logo_kjerag.png',
    operators: [
      { name: '银灰', charId: 'char_172_svrash' },
      { name: '初雪', charId: 'char_174_slbell' },
    ],
    profile: { C1:-1, C2:-1, C3:0, Em1:0, Em2:1, Em3:0, At1:1, At2:0, At3:-1, Ac1:-1, Ac2:-1, Ac3:1, So1:-1, So2:1, So3:1 },
  },
  {
    code: 'LUNGMEN',
    name: '龙门近卫局',
    fullname: '龙门近卫局型',
    emoji: '🏙️',
    tagline: '"法律是最后的防线，也是我们唯一信任的东西。"',
    color: '#e8c44a',
    traits: ['法律秩序', '务实主义', '城市精神', '职责明确', '规则守护'],
    desc: '你信仰规则与法律，因为那是混乱世界里为数不多能依靠的东西。你务实，不会为了遥远的理想而忽视眼前的责任。你清楚地知道自己的职责范围，并在其中做到最好。你不惧怕做出艰难决定，因为你知道职责所在就是意义所在。',
    logoFile: 'logo_lgd.png',
    operators: [
      { name: '陈', charId: 'char_010_chen' },
      { name: '星熊', charId: 'char_136_hsguma' },
      { name: '诗怀雅', charId: 'char_308_swire' },
    ],
    profile: { C1:-1, C2:-1, C3:0, Em1:-1, Em2:1, Em3:0, At1:1, At2:-1, At3:-1, Ac1:0, Ac2:-1, Ac3:1, So1:0, So2:1, So3:1 },
  },
  {
    code: 'URSUS',
    name: '乌萨斯帝国',
    fullname: '乌萨斯铁血型',
    emoji: '🐻',
    tagline: '"一人的牺牲，换来千人的存活。这就是铁律。"',
    color: '#8ab4d4',
    traits: ['铁血纪律', '集体主义', '牺牲精神', '帝国意志', '沉默坚韧'],
    desc: '你相信纪律和集体高于个体。你愿意承受个人的痛苦换取更大的利益，也会要求他人做同样的事——不是因为冷酷，而是因为你深信这是让更多人活下去的唯一方式。你不惧怕艰难的决定，但你也明白这种铁律背后的沉重代价。',
    logoFile: 'logo_ursus.png',
    operators: [
      { name: '凛冬', charId: 'char_115_headbr' },
      { name: '真理', charId: 'char_195_glassb' },
      { name: '早露', charId: 'char_197_poca' },
    ],
    profile: { C1:0, C2:0, C3:1, Em1:-1, Em2:1, Em3:-1, At1:1, At2:-1, At3:-1, Ac1:0, Ac2:1, Ac3:1, So1:-1, So2:1, So3:1 },
  },
  {
    code: 'KAZDEL',
    name: '卡兹戴尔',
    fullname: '卡兹戴尔孤独求道型',
    emoji: '🩸',
    tagline: '"以终结换和平，以黑暗换光明。"',
    color: '#a06080',
    traits: ['孤独意志', '以毒攻毒', '沉重过去', '终局思维', '独行者'],
    desc: '你背负着别人无法理解也不愿承担的重量。你愿意扮演反派的角色，让世界把罪责加在你身上，只要这能换来最终的和平。你不需要被理解，也不需要被原谅。你只需要看见那个你为之牺牲的未来真的到来。',
    logoFile: 'logo_kazdel.png',
    operators: [
      { name: 'W', charId: 'char_113_cqbw' },
      { name: '史尔特尔', charId: 'char_350_surtr' },
    ],
    profile: { C1:0, C2:1, C3:1, Em1:0, Em2:1, Em3:-1, At1:-1, At2:0, At3:1, Ac1:0, Ac2:1, Ac3:1, So1:-1, So2:-1, So3:1 },
  },
  {
    code: 'SIRACUSA',
    name: '西拉库扎家族',
    fullname: '西拉库扎家族型',
    emoji: '🐺',
    tagline: '"家族第一，其次是荣誉，然后才是其他一切。"',
    color: '#c8a06a',
    traits: ['家族忠诚', '荣誉规则', '暗流涌动', '灰色生存', '契约精神'],
    desc: '你的世界由义务与忠诚构成。家族或组织的纽带是你行动的第一准则，荣誉规则比法律更有约束力。你不会轻易背叛也不会轻易原谅背叛。你在灰色地带游走，但有自己的道德底线，那条线的名字叫"不背弃自己人"。',
    logoFile: 'logo_siracusa.png',
    operators: [
      { name: '德克萨斯', charId: 'char_102_texas' },
      { name: '拉普兰德', charId: 'char_140_whitew' },
    ],
    profile: { C1:1, C2:0, C3:-1, Em1:0, Em2:0, Em3:-1, At1:-1, At2:0, At3:0, Ac1:1, Ac2:0, Ac3:1, So1:0, So2:-1, So3:0 },
  },
  {
    code: 'LATERANO',
    name: '拉特兰',
    fullname: '拉特兰神圣秩序型',
    emoji: '✝️',
    tagline: '"中立是我们的信仰，秩序是我们的使命。"',
    color: '#f0e6b2',
    traits: ['神圣职责', '中立超然', '秩序信仰', '审判者视角', '有限介入'],
    desc: '你相信有某种更高的秩序凌驾于所有势力之上，你的职责是维护它而非选择阵营。你保持中立不是因为懦弱，而是因为你认为偏袒任何一方都会破坏你所信仰的平衡。你有能力介入，但你会非常谨慎地衡量是否该这么做。',
    logoFile: 'logo_Laterano.png',
    operators: [
      { name: '能天使', charId: 'char_103_angel' },
      { name: '送葬人', charId: 'char_279_excu' },
    ],
    profile: { C1:-1, C2:-1, C3:0, Em1:0, Em2:1, Em3:0, At1:1, At2:0, At3:0, Ac1:-1, Ac2:-1, Ac3:1, So1:0, So2:1, So3:1 },
  },
  /* ── HIDDEN ── */
  {
    code: 'SAMI',
    name: '萨米秘境',
    fullname: '萨米远古秘境型',
    emoji: '🌲',
    tagline: '"文明的尽头，才是真正的开始。"',
    color: '#6bc88a',
    traits: ['神秘主义', '原始法则', '超然物外', '远古智慧', '局外人视角'],
    desc: '你不属于泰拉的任何势力，或者说，你从一个更古老的维度来审视这一切。你对文明和政治的热闹既不鄙视也不沉迷，你知道这些争夺背后有更本质的东西被遗忘了。你是局外人，也是见证者，而你的智慧来自于那片大多数人从未踏足过的土地。',
    logoFile: 'logo_sami.png',
    operators: [],
    profile: { C1:0, C2:0, C3:0, Em1:0, Em2:0, Em3:0, At1:0, At2:0, At3:0, Ac1:0, Ac2:0, Ac3:0, So1:0, So2:0, So3:0 },
    hidden: true,
  },
];

/* QUESTIONS_DAILY — 60题 × 方舟梗 (4题/维度, 随机抽20~30) */
const QUESTIONS_DAILY = [

  /* ══ C1 决策风格 直觉↑ 推演↓ ══ */
  {dim:'C1',dir:1,scene:'☕ 休息区 · 早班后',
   op:{name:'阿米娅',charId:'char_002_amiya',role:'近卫干员 · 罗德岛代理人'},
   text:'阿米娅走进来："博士，现在还不可以休息哦。"你下意识的反应是？',
   choices:[
     {text:'好好好，马上，凭感觉挑个任务开干',score:2},
     {text:'先随手翻翻今天的文件，看哪个顺眼做哪个',score:1},
     {text:'拿出清单逐项对比优先级再分配时间',score:-1},
     {text:'已经有今天的完整工作计划，按计划执行',score:-2},
   ]},
  {dim:'C1',dir:-1,scene:'🎲 娱乐室 · 桌游夜',
   op:{name:'德克萨斯',charId:'char_102_texas',role:'近卫干员 · 西拉库扎'},
   text:'桌游规则书厚40页，轮到你了，你会？',
   choices:[
     {text:'照感觉出，反正赢不了德克萨斯',score:-2},
     {text:'大概问一下思路，然后凭直觉',score:-1},
     {text:'翻到关键章节确认清楚再动',score:1},
     {text:'我需要把40页全部读完才能开始',score:2},
   ]},
  {dim:'C1',dir:1,scene:'🌙 办公室 · 凌晨四点',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'凯尔希说你失忆前"相当擅长在凌晨四点用沸水直接在口腔里加热速食食品"。对此你的第一反应是？',
   choices:[
     {text:'……好像确实这么干过？凭感觉行事嘛',score:2},
     {text:'听起来……可信，我不排除这个可能',score:1},
     {text:'需要更多证据支持这个说法',score:-1},
     {text:'这不可能，我有正常的饮食规划',score:-2},
   ]},
  {dim:'C1',dir:-1,scene:'📋 走廊 · 任务简报',
   op:{name:'W',charId:'char_113_cqbw',role:'狙击干员 · 卡兹戴尔'},
   text:'W抛给你一个任务概要，说"细节你自己想"。你会？',
   choices:[
     {text:'行，我知道大概方向，边走边想',score:-2},
     {text:'先把核心目标搞清楚，其余随机应变',score:-1},
     {text:'要求她补充关键参数再启动',score:1},
     {text:'没有完整方案我不会行动',score:2},
   ]},

  /* ══ C2 风险承受 激进↑ 保守↓ ══ */
  {dim:'C2',dir:1,scene:'🎪 甲板 · 休闲时光',
   op:{name:'能天使',charId:'char_103_angel',role:'狙击干员 · 企鹅物流'},
   text:'能天使提议去龙门一家新开的口碑两极化的餐厅，你会？',
   choices:[
     {text:'去！踩雷也是一种经历',score:2},
     {text:'去，但先查一下具体差评内容',score:1},
     {text:'先等别人去踩完雷再说',score:-1},
     {text:'不了，熟悉的地方更安心',score:-2},
   ]},
  {dim:'C2',dir:1,scene:'🏋️ 训练场 · 晨练',
   op:{name:'推进之王',charId:'char_112_siege',role:'先锋干员 · 格拉斯哥'},
   text:'推进之王邀你挑战一条你从没走过的高难攀岩路线，并补了一句："你以前或许来得及，现在……不好说。"',
   choices:[
     {text:'就因为这句话，今天一定上',score:2},
     {text:'观察一下难点再决定',score:1},
     {text:'等状态更好的时候再说',score:-1},
     {text:'不必要的风险，pass',score:-2},
   ]},
  {dim:'C2',dir:1,scene:'💥 走廊 · 偶遇W',
   op:{name:'W',charId:'char_113_cqbw',role:'狙击干员 · 卡兹戴尔'},
   text:'W说她有个计划可以"一步解决"某个麻烦，但她上次"一步解决"炸掉了半条街。你会？',
   choices:[
     {text:'听听，结果好才是真的好',score:2},
     {text:'听，但先问这次有没有爆炸',score:1},
     {text:'让她先写方案，我审核后再决定',score:-1},
     {text:'W的计划先搁置，另找方案',score:-2},
   ]},
  {dim:'C2',dir:-1,scene:'🌊 甲板 · 夜风',
   op:{name:'斯卡蒂',charId:'char_263_skadi',role:'近卫干员 · 阿戈尔'},
   text:'斯卡蒂说她发现了一条从未有人潜过的深海路线，问你想不想一起去探探。',
   choices:[
     {text:'想，未知就是吸引力',score:2},
     {text:'感兴趣，但需要基本的安全评估',score:1},
     {text:'等有更多前期调查再说',score:-1},
     {text:'未知深海，风险太高',score:-2},
   ]},

  /* ══ C3 目标优先 任务↑ 人员↓ ══ */
  {dim:'C3',dir:1,scene:'📋 会议室 · 排期',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'凯尔希说某干员最近状态不好，但下周任务排期已定，还看着你说："……"你会？',
   choices:[
     {text:'任务是既定的，先完成再调整',score:2},
     {text:'不影响整体进度的前提下尝试调换',score:1},
     {text:'干员状态优先，找替代方案',score:-1},
     {text:'延期也没关系，干员健康更重要',score:-2},
   ]},
  {dim:'C3',dir:-1,scene:'🌙 办公室 · 深夜',
   op:{name:'斯卡蒂',charId:'char_263_skadi',role:'近卫干员 · 阿戈尔'},
   text:'斯卡蒂带着鱼竿出现在门口，说"……只是来坐坐"。你还有报告没写完。',
   choices:[
     {text:'报告明天再写，先陪她（虽然办公室没有鱼）',score:-2},
     {text:'让她进来，一边工作一边陪着',score:-1},
     {text:'让她等一会儿，这段写完马上',score:1},
     {text:'告诉她今晚必须交，改天',score:2},
   ]},
  {dim:'C3',dir:1,scene:'🏥 医疗舱 · 走廊',
   op:{name:'华法琳',charId:'char_171_bldsk',role:'医疗干员 · 罗德岛'},
   text:'华法琳说有名干员康复期情绪低落，"正好你来了，顺便抽个血"。你会？',
   choices:[
     {text:'任务第一，探视等有空再说（血不抽）',score:2},
     {text:'去探视，但血坚决不抽',score:1},
     {text:'让华法琳转达关心，血不抽',score:-1},
     {text:'马上去陪他，血……再说吧',score:-2},
   ]},
  {dim:'C3',dir:-1,scene:'📱 通讯 · 阿米娅消息',
   op:{name:'阿米娅',charId:'char_002_amiya',role:'近卫干员 · 罗德岛代理人'},
   text:'阿米娅发来消息："博士，这是今天的任务清单，共47项。"同时另一名干员来找你倾诉。你？',
   choices:[
     {text:'先处理清单，干员的事等一会儿',score:2},
     {text:'先快速看一遍清单，再去听干员说',score:1},
     {text:'先陪干员聊，清单回头补',score:-1},
     {text:'清单晚点再说，人比任务重要',score:-2},
   ]},

  /* ══ Em1 共情深度 感性↑ 冷静↓ ══ */
  {dim:'Em1',dir:1,scene:'🏥 医疗舱 · 探视',
   op:{name:'华法琳',charId:'char_171_bldsk',role:'医疗干员 · 罗德岛'},
   text:'华法琳说受伤干员康复期情绪低落。你的第一反应是？',
   choices:[
     {text:'马上去，他一定需要有人陪',score:2},
     {text:'去，不知道说什么，主要陪着',score:1},
     {text:'让华法琳转达关心就好',score:-1},
     {text:'康复是医疗的事，我不必介入情绪',score:-2},
   ]},
  {dim:'Em1',dir:-1,scene:'🎵 公共区 · 音乐角',
   op:{name:'诗怀雅',charId:'char_308_swire',role:'近卫干员 · 龙门近卫局'},
   text:'诗怀雅演唱到一半眼眶红了，旁边有人小声说"吉祥物还演唱呢"。你？',
   choices:[
     {text:'走过去，用行动告诉那些人她不只是吉祥物',score:2},
     {text:'静静等她唱完，然后认真鼓掌',score:1},
     {text:'没特别反应，继续做自己的事',score:-1},
     {text:'这是她的情绪问题，我不必介入',score:-2},
   ]},
  {dim:'Em1',dir:1,scene:'🌙 娱乐室 · 深夜',
   op:{name:'缠丸',charId:'char_289_gyuki',role:'近卫干员 · 东国'},
   text:'缠丸跑来说："没人陪我说话我会无聊死的！博士别睡啊！"你还有点困意。',
   choices:[
     {text:'好，陪你聊，说什么都行',score:2},
     {text:'撑着陪她聊一会儿',score:1},
     {text:'让她找别人，我真的困了',score:-1},
     {text:'她的无聊不是我的责任',score:-2},
   ]},
  {dim:'Em1',dir:-1,scene:'🎮 休息区 · 下午',
   op:{name:'伊芙利特',charId:'char_134_ifrit',role:'术师干员 · 莱茵生命'},
   text:'伊芙利特发现你在摸鱼，"你这家伙，把我晾在一边一个人睡大觉，胆子很大啊！"她其实只是想和你说话。你？',
   choices:[
     {text:'立刻道歉，认真问她想聊什么',score:2},
     {text:'解释一下，然后陪她说说',score:1},
     {text:'平静地说我没睡，只是在思考',score:-1},
     {text:'我确实在摸鱼，她说的没错但不重要',score:-2},
   ]},

  /* ══ Em2 情感边界 隔离↑ 融合↓ ══ */
  {dim:'Em2',dir:1,scene:'🌿 温室 · 浇花',
   op:{name:'安洁莉娜',charId:'char_291_aglina',role:'辅助干员 · 叙拉古'},
   text:'安洁莉娜分享了件带点脆弱的童年往事，说完看着你。你会？',
   choices:[
     {text:'只是倾听，不打算分享自己的过去（反正也记不住）',score:2},
     {text:'给一些回应，保持适当距离',score:1},
     {text:'感同身受，分享类似的经历',score:-1},
     {text:'她聊得那么真诚，我也想说说我的事',score:-2},
   ]},
  {dim:'Em2',dir:1,scene:'🚪 走廊 · 偶遇',
   op:{name:'拉普兰德',charId:'char_140_whitew',role:'近卫干员 · 西拉库扎'},
   text:'拉普兰德拦住你："博士，你对我是什么感觉？别只会省略号。"',
   choices:[
     {text:'认真但有分寸地说：你是很出色的干员',score:2},
     {text:'"……"（拉普兰德表情微妙）',score:1},
     {text:'觉得这是个好机会，认真聊聊',score:-1},
     {text:'坦率说出真实感受，不管什么边界',score:-2},
   ]},
  {dim:'Em2',dir:1,scene:'🐱 走廊 · 奇怪的猫',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'你在走廊看到一只猫，它看你的眼神……很奇怪。凯尔希恰好路过，你问她这是谁的猫。她只是说："你不必知道。"你？',
   choices:[
     {text:'好的，不问了（保持距离）',score:2},
     {text:'点头，但悄悄继续观察那只猫',score:1},
     {text:'非常好奇，想进一步追问',score:-1},
     {text:'蹲下来摸摸它，拉近关系',score:-2},
   ]},
  {dim:'Em2',dir:-1,scene:'🍺 休息区 · 聚餐',
   op:{name:'能天使',charId:'char_103_angel',role:'狙击干员 · 企鹅物流'},
   text:'能天使喝多了，开始倾诉一些她平时不会说的事。你会？',
   choices:[
     {text:'认真听，这是她选择分享的，值得珍视',score:-2},
     {text:'听着，适当回应，但不追问',score:-1},
     {text:'让她喝点水，委婉转移话题',score:1},
     {text:'她喝醉了说的话不必当真，照常对待',score:2},
   ]},

  /* ══ Em3 信任基线 开放↑ 审慎↓ ══ */
  {dim:'Em3',dir:1,scene:'🍜 食堂 · 晚餐',
   op:{name:'幽灵鲨',charId:'char_143_ghost',role:'近卫干员 · 阿戈尔'},
   text:'幽灵鲨主动坐到你旁边，像是有话说但没开口，一直盯着你的餐盘。',
   choices:[
     {text:'主动问她是不是有什么事',score:2},
     {text:'随口聊起来，给她个开口的机会',score:1},
     {text:'正常吃饭，等她先开口',score:-1},
     {text:'专注吃饭，幽灵鲨沉默很正常',score:-2},
   ]},
  {dim:'Em3',dir:1,scene:'📬 通讯室 · 早晨',
   op:{name:'W',charId:'char_113_cqbw',role:'狙击干员 · 卡兹戴尔'},
   text:'W发消息说有个"提议"没说是什么，鉴于她上次的"提议"导致半条街消失，你？',
   choices:[
     {text:'马上回：说吧，我在',score:2},
     {text:'回说有时间，但顺便问这次有没有爆炸',score:1},
     {text:'说现在有点忙',score:-1},
     {text:'先查一下近期有没有不明财产损失再说',score:-2},
   ]},
  {dim:'Em3',dir:1,scene:'🤝 走廊 · 新合作',
   op:{name:'德克萨斯',charId:'char_102_texas',role:'近卫干员 · 西拉库扎'},
   text:'德克萨斯说她有个从西拉库扎来的旧相识想见你，对方"信得过"。你？',
   choices:[
     {text:'行，德克萨斯说信得过就信得过',score:2},
     {text:'见，但先问一下大概什么来头',score:1},
     {text:'让她先给我一份背景介绍',score:-1},
     {text:'需要走完整的背景调查流程',score:-2},
   ]},
  {dim:'Em3',dir:-1,scene:'💳 食堂 · 结账',
   op:{name:'能天使',charId:'char_103_angel',role:'狙击干员 · 企鹅物流'},
   text:'能天使说："博士，上次借你的那笔钱——我已经记在合同里了。"她递来一份文件。',
   choices:[
     {text:'先签了，能天使不会坑我',score:2},
     {text:'认真看了合同再签',score:1},
     {text:'找法务帮我审合同',score:-1},
     {text:'我不记得借过这笔钱，拒绝签署',score:-2},
   ]},

  /* ══ At1 规则遵从 秩序↑ 变通↓ ══ */
  {dim:'At1',dir:1,scene:'📌 走廊 · 公告栏',
   op:{name:'极境',charId:'char_401_elysm',role:'先锋干员 · 伊比利亚'},
   text:'极境说方舟某条规定对她明显不合理，但写在白纸黑字上。你怎么看？',
   choices:[
     {text:'规定存在有其理由，先遵守再走正式修改渠道',score:2},
     {text:'规定可以讨论，但改之前还是遵守',score:1},
     {text:'不合理的规定不值得被执行',score:-1},
     {text:'只要不出大事，灵活处理就好',score:-2},
   ]},
  {dim:'At1',dir:-1,scene:'🗃️ 档案室',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'凯尔希指出你某个安排没走审批流程，"你比以前更……随性了，博士。"',
   choices:[
     {text:'承认并补全流程，下次注意',score:2},
     {text:'解释来不及，但承认流程重要',score:1},
     {text:'结果没问题，流程是形式',score:-1},
     {text:'有些事绕过流程反而更快',score:-2},
   ]},
  {dim:'At1',dir:1,scene:'💂 门口 · 执勤',
   op:{name:'赫拉格',charId:'char_188_helage',role:'近卫干员 · 乌萨斯'},
   text:'赫拉格说："别懈怠。在罗德岛，你要时刻保持警惕。"他问你最近是否认真遵守所有安全规程。',
   choices:[
     {text:'是的，规程每一条我都在遵守',score:2},
     {text:'大部分遵守，少数情况有所变通',score:1},
     {text:'核心规程遵守，细节比较灵活',score:-1},
     {text:'赫拉格，规程是参考，不是枷锁',score:-2},
   ]},
  {dim:'At1',dir:-1,scene:'🗣️ 食堂 · 龙门粗口',
   op:{name:'陈',charId:'char_010_chen',role:'近卫干员 · 龙门近卫局'},
   text:'陈和诗怀雅又在走廊互怼，内容已经升级到"龙门粗口"级别，星熊在边上头疼。有人来问你要不要管。',
   choices:[
     {text:'两人吵架有规则，先观察是否超出边界再介入',score:2},
     {text:'星熊在场就够了，我不必插手',score:1},
     {text:'叫她们停下，这不符合方舟行为规范',score:-1},
     {text:'让她们吵，情绪发泄也是需要的',score:-2},
   ]},

  /* ══ At2 感染者立场 平等↑ 隔离↓ ══ */
  {dim:'At2',dir:1,scene:'🧪 实验室 · 研究区',
   op:{name:'华法琳',charId:'char_171_bldsk',role:'医疗干员 · 罗德岛'},
   text:'华法琳问：方舟感染者干员和非感染者待遇完全相同吗？她手边放着一根注射器。',
   choices:[
     {text:'理所应当（顺便把注射器挡住）',score:2},
     {text:'是的，但会根据医疗需求有额外支持',score:1},
     {text:'大体相同，少数情况有特殊安排',score:-1},
     {text:'感染者情况特殊，差别对待有其合理性',score:-2},
   ]},
  {dim:'At2',dir:1,scene:'🌆 城市 · 外出',
   op:{name:'斥罪',charId:'char_4065_judge',role:'重装干员 · 叙拉古'},
   text:'外出时斥罪遭到路人侧目和刻意回避，他没说什么。',
   choices:[
     {text:'走上去陪在他身边，什么都不说',score:2},
     {text:'等私下再问他感受如何',score:1},
     {text:'装作没注意到，避免让他更尴尬',score:-1},
     {text:'这种事难以避免，不必过多在意',score:-2},
   ]},
  {dim:'At2',dir:1,scene:'🏃 训练场 · 集合',
   op:{name:'天火',charId:'char_166_skfire',role:'术师干员 · 维多利亚'},
   text:'天火在训练前对几名感染者干员说："如此怠惰。"语气一视同仁——对感染者和非感染者都这样。你怎么看待这种方式？',
   choices:[
     {text:'一视同仁就是最好的平等',score:2},
     {text:'语气可以更好，但方向是对的',score:1},
     {text:'感染者需要更多体谅，这样不妥',score:-1},
     {text:'天火的方式过于严苛，应该区别对待',score:-2},
   ]},
  {dim:'At2',dir:-1,scene:'🏥 医疗舱 · 分配',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'资源紧张时，凯尔希提出将某稀缺药物优先分配给非感染者干员，理由是"他们受矿石病影响更可逆"。你？',
   choices:[
     {text:'同意，医学逻辑优先',score:-2},
     {text:'可以理解，但需要确保感染者也有基本保障',score:-1},
     {text:'不同意，需要重新讨论分配标准',score:1},
     {text:'明确反对，不能以感染状态作为优先级标准',score:2},
   ]},

  /* ══ At3 理想主义 理想↑ 现实↓ ══ */
  {dim:'At3',dir:1,scene:'🌅 甲板 · 日落',
   op:{name:'阿米娅',charId:'char_002_amiya',role:'近卫干员 · 罗德岛代理人'},
   text:'阿米娅问："博士，你相信矿石病真的能被治愈吗？"（她刚放下一份47项任务清单。）',
   choices:[
     {text:'相信，我们就是为此而存在的',score:2},
     {text:'相信，但可能不在我们这代实现',score:1},
     {text:'希望如此，但眼下活下去更重要',score:-1},
     {text:'不确定，治愈与否不是我行动的前提',score:-2},
   ]},
  {dim:'At3',dir:-1,scene:'📖 图书室 · 午后',
   op:{name:'菲亚梅塔',charId:'char_300_phenxi',role:'狙击干员 · 拉特兰'},
   text:'菲亚梅塔说"做实际的事比说理想重要多了"，手边放着一本封面写着"——嘎呜"的小册子（诗怀雅手记）。',
   choices:[
     {text:'完全同意，行动第一',score:-2},
     {text:'行动重要，但没有方向容易白跑',score:-1},
     {text:'理想给行动方向，两者缺一不可',score:1},
     {text:'没有足够理想支撑，人很容易在180万的钢琴旁边停下来',score:2},
   ]},
  {dim:'At3',dir:1,scene:'🔭 实验室 · 研究讨论',
   op:{name:'银灰',charId:'char_172_svrash',role:'近卫干员 · 谢拉格'},
   text:'银灰在讨论谢拉格的未来，他说："如果我们不为某个更大的目标而战，一切都失去意义。"你怎么回应？',
   choices:[
     {text:'"同意。没有大目标，罗德岛也只是一艘漂泊的船。"',score:2},
     {text:'"理想是重要的，但谢拉格的现实问题也不能忽视。"',score:1},
     {text:'"先把眼前的问题解决，大目标可以之后再谈。"',score:-1},
     {text:'"理想太虚，我更关注具体成效。"',score:-2},
   ]},
  {dim:'At3',dir:-1,scene:'🌧️ 甲板 · 雨夜',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'凯尔希站在雨中问你："博士，你还记得你当初决定创建罗德岛时，你的理由是什么吗？"',
   choices:[
     {text:'"……"（沉默，还记得的感觉）',score:2},
     {text:'"感觉是对的，具体说不太清楚。"',score:1},
     {text:'"现在的理由已经够了，过去不重要。"',score:-1},
     {text:'"理由不重要，结果才重要。"',score:-2},
   ]},

  /* ══ Ac1 行动速度 迅速↑ 审慎↓ ══ */
  {dim:'Ac1',dir:1,scene:'🛒 仓库 · 物资盘点',
   op:{name:'因陀罗',charId:'char_155_tiger',role:'近卫干员 · 格拉斯哥'},
   text:'因陀罗发现物资快用完了，流程要走三个部门审批。你的做法是？',
   choices:[
     {text:'先斩后奏，有问题再补流程',score:2},
     {text:'确认下限后立刻启动申请',score:1},
     {text:'正常走流程，他们效率还行',score:-1},
     {text:'等下次定期盘点时一并处理',score:-2},
   ]},
  {dim:'Ac1',dir:1,scene:'🚶 走廊 · 下班路上',
   op:{name:'德克萨斯',charId:'char_102_texas',role:'近卫干员 · 西拉库扎'},
   text:'德克萨斯说她"听说"某干员最近有点问题，语气很平，不像紧急情况。你？',
   choices:[
     {text:'马上去看看，宁可多此一举',score:2},
     {text:'先简单了解情况再介入',score:1},
     {text:'让德克萨斯再确认一下',score:-1},
     {text:'等有明确信息再行动',score:-2},
   ]},
  {dim:'Ac1',dir:1,scene:'🌅 早晨 · 紧急集合',
   op:{name:'梅',charId:'char_133_mm',role:'狙击干员 · 罗德岛'},
   text:'梅拍门："醒醒！醒醒！不要偷懒呀！有个紧急情况！"没说是什么。你？',
   choices:[
     {text:'立刻起来，先行动再问情况',score:2},
     {text:'起来，边走边问发生了什么',score:1},
     {text:'"等我穿好衣服，你先说发生什么了"',score:-1},
     {text:'"等我缓一缓，说清楚再说"',score:-2},
   ]},
  {dim:'Ac1',dir:-1,scene:'🔥 紧急情况 · 热水壶',
   op:{name:'极境',charId:'char_401_elysm',role:'先锋干员 · 伊比利亚'},
   text:'集成战略中某局即将失败，极境神情肃穆地从礼盒里掏出一个热水壶递给你，什么都没说。你？',
   choices:[
     {text:'立刻重开，不浪费时间纠结',score:2},
     {text:'认真复盘一下失误在哪里再重开',score:1},
     {text:'仔细分析这次数据，寻找翻盘可能',score:-1},
     {text:'这局还没到最后，我要坚持到底',score:-2},
   ]},

  /* ══ Ac2 手段底线 原则↓ 功利↑ ══ */
  {dim:'Ac2',dir:-1,scene:'🍻 休息区 · 聚餐',
   op:{name:'能天使',charId:'char_103_angel',role:'狙击干员 · 企鹅物流'},
   text:'能天使说她为了帮朋友做了件"灰色"的事，结果是好的，"何况还把账抵了"。你？',
   choices:[
     {text:'过程比结果重要，应该找更合适的方式',score:-2},
     {text:'理解，但提醒她注意边界',score:-1},
     {text:'结果好就好，有时候需要灵活',score:1},
     {text:'完全支持，还把账抵了，赚到了',score:2},
   ]},
  {dim:'Ac2',dir:-1,scene:'💬 办公室 · 谈话',
   op:{name:'W',charId:'char_113_cqbw',role:'狙击干员 · 卡兹戴尔'},
   text:'W说她用了"非正规手段"帮方舟解决了麻烦，并补充："放心，这次没有爆炸。"',
   choices:[
     {text:'明确表示不接受，哪怕有效',score:-2},
     {text:'感谢，但下次这类事先跟我商量',score:-1},
     {text:'这次不追究，提醒她控制尺度',score:1},
     {text:'只要对方舟有利，怎么做都行',score:2},
   ]},
  {dim:'Ac2',dir:-1,scene:'🐺 走廊 · 拉普兰德',
   op:{name:'拉普兰德',charId:'char_140_whitew',role:'近卫干员 · 西拉库扎'},
   text:'拉普兰德说她动用了"家族手段"帮你解决了一个棘手的外部问题，主动来告诉你。',
   choices:[
     {text:'明确拒绝接受这种结果，要求她撤销',score:-2},
     {text:'感谢，但说清楚这类手段以后不能用',score:-1},
     {text:'这次既成事实，提醒她以后先报备',score:1},
     {text:'结果好就好，她的手段我不过问',score:2},
   ]},
  {dim:'Ac2',dir:1,scene:'⚔️ 甲板 · 两面包夹',
   op:{name:'斯卡蒂',charId:'char_263_skadi',role:'近卫干员 · 阿戈尔'},
   text:'有人提出和日本的方舟玩家联合，"形成两面包夹之势"解决某个问题。斯卡蒂皱眉，你怎么看这种策略？',
   choices:[
     {text:'管它手段如何，能解决问题的就是好策略',score:2},
     {text:'可以尝试，但要评估风险',score:1},
     {text:'手段需要经过正式审批',score:-1},
     {text:'方舟有原则，不能为了结果不择手段',score:-2},
   ]},

  /* ══ Ac3 坚持倾向 坚守↑ 灵活↓ ══ */
  {dim:'Ac3',dir:1,scene:'🎯 训练场 · 课后',
   op:{name:'推进之王',charId:'char_112_siege',role:'先锋干员 · 格拉斯哥'},
   text:'推进之王练一个动作很久，考虑换方向。"银灰说坚持，凯尔希说换思路，你呢？"',
   choices:[
     {text:'坚持下去，只要方法对了一定能突破',score:2},
     {text:'先看是不是方法需要调整，再决定',score:1},
     {text:'如果真的不适合，换方向是明智的',score:-1},
     {text:'灵活点，连银灰有时候也换战术',score:-2},
   ]},
  {dim:'Ac3',dir:1,scene:'📝 会议室 · 计划讨论',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'你有个长期计划，凯尔希质疑了，"博士，你比以前更……固执了。"',
   choices:[
     {text:'我认为原计划是正确的，继续推进',score:2},
     {text:'认真听完她的意见，评估后决定',score:1},
     {text:'凯尔希提出了合理替代方案，值得调整',score:-1},
     {text:'凯尔希经验丰富，按她说的改',score:-2},
   ]},
  {dim:'Ac3',dir:1,scene:'🗺️ 地图室 · 战略研讨',
   op:{name:'银灰',charId:'char_172_svrash',role:'近卫干员 · 谢拉格'},
   text:'银灰的方案和你的方案产生冲突，他不打算妥协。你会？',
   choices:[
     {text:'坚持我的判断，说明理由',score:2},
     {text:'认真听他的方案，再做决定',score:1},
     {text:'银灰的方案有说服力，考虑调整我的',score:-1},
     {text:'银灰经验更丰富，以他为主',score:-2},
   ]},
  {dim:'Ac3',dir:-1,scene:'🏠 走廊 · 方舟流离',
   op:{name:'阿米娅',charId:'char_002_amiya',role:'近卫干员 · 罗德岛代理人'},
   text:'方舟被祭司占领了，所有人流落街头。阿米娅说必须找到临时据点。你的反应是？',
   choices:[
     {text:'先去原方舟把东西取回来',score:2},
     {text:'先确保人员安全，再想办法',score:1},
     {text:'临时据点比旧方舟更重要，立刻转移',score:-1},
     {text:'旧的不去新的不来，全面转向新方案',score:-2},
   ]},

  /* ══ So1 社交主动 开放↑ 封闭↓ ══ */
  {dim:'So1',dir:1,scene:'🎉 休息区 · 生日聚会',
   op:{name:'安洁莉娜',charId:'char_291_aglina',role:'辅助干员 · 叙拉古'},
   text:'安洁莉娜在组织生日聚会，顺口问你"来不来帮忙布置，上次你在气氛好多了"。',
   choices:[
     {text:'当然，需要我做什么尽管说',score:2},
     {text:'去，帮个小忙，不太想张扬',score:1},
     {text:'去参加聚会，布置让别人来',score:-1},
     {text:'聚会不太擅长，可能不去',score:-2},
   ]},
  {dim:'So1',dir:1,scene:'🚢 餐厅 · 新干员接待',
   op:{name:'阿米娅',charId:'char_002_amiya',role:'近卫干员 · 罗德岛代理人'},
   text:'几名新干员刚上方舟，其中一个一直看你的方向。阿米娅说你要不要去打招呼。',
   choices:[
     {text:'主动过去，新人需要感受到欢迎',score:2},
     {text:'去打个简单招呼就回来',score:1},
     {text:'等他们适应了再说',score:-1},
     {text:'阿米娅去就好，我不太擅长这种场合',score:-2},
   ]},
  {dim:'So1',dir:1,scene:'🛍️ 停靠城市 · 外出',
   op:{name:'年',charId:'char_2014_nian',role:'重装干员 · 炎国'},
   text:'年拍了你一下："你怎么又睡着了！起来起来，陪我去买点东西，快点快点！"',
   choices:[
     {text:'好，一起去，正好出去走走',score:2},
     {text:'去，但只是陪着，不要走太久',score:1},
     {text:'让她自己去，我在方舟等',score:-1},
     {text:'我确实需要休息，不去了',score:-2},
   ]},
  {dim:'So1',dir:-1,scene:'🎮 娱乐室 · 游戏时间',
   op:{name:'缠丸',charId:'char_289_gyuki',role:'近卫干员 · 东国'},
   text:'缠丸不让你离开："没人陪我说话我会无聊死的！你不可以走！"你还有事情要做。',
   choices:[
     {text:'留下来，她这么说一定真的需要陪伴',score:-2},
     {text:'再陪一会儿，然后跟她说我要去忙了',score:-1},
     {text:'跟她说我还有事，让她找别人',score:1},
     {text:'我真的有事，直接离开',score:2},
   ]},

  /* ══ So2 权威认同 服从↑ 质疑↓ ══ */
  {dim:'So2',dir:1,scene:'📋 汇报 · 会议室',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'凯尔希直接说你某个判断是错的，语气不容置疑，沉默等你反应。',
   choices:[
     {text:'先接受，她的判断通常是对的',score:2},
     {text:'听完解释，有道理就接受',score:1},
     {text:'说明我的理由，看她怎么回应',score:-1},
     {text:'我有自己依据，凯尔希不总是对的',score:-2},
   ]},
  {dim:'So2',dir:-1,scene:'🗣️ 走廊 · 非正式讨论',
   op:{name:'W',charId:'char_113_cqbw',role:'狙击干员 · 卡兹戴尔'},
   text:'W冷笑："你觉得罗德岛的规矩有必要全遵守？"她掏出一个装置，"这是我的答案。"',
   choices:[
     {text:'规矩存在有原因，不应轻易质疑（那装置先收起来）',score:2},
     {text:'有些有必要，有些值得讨论（装置收起来）',score:1},
     {text:'规矩是工具，不合用的就该改',score:-1},
     {text:'能达成目的就好（装置先别开）',score:-2},
   ]},
  {dim:'So2',dir:1,scene:'💂 训练 · 赫拉格点评',
   op:{name:'赫拉格',charId:'char_188_helage',role:'近卫干员 · 乌萨斯'},
   text:'赫拉格看完你的作战方案，说："这个计划有问题，按我说的改。"没有给出详细理由。',
   choices:[
     {text:'先按他说的改，他经验比我丰富',score:2},
     {text:'问他哪里有问题，解释了再改',score:1},
     {text:'说明我的方案逻辑，请他回应',score:-1},
     {text:'我认为方案没问题，不改',score:-2},
   ]},
  {dim:'So2',dir:-1,scene:'🌟 甲板 · 推进之王的建议',
   op:{name:'推进之王',charId:'char_112_siege',role:'先锋干员 · 格拉斯哥'},
   text:'推进之王直接跟你说："博士，那个决策是错的，你应该重新考虑。"态度诚恳。',
   choices:[
     {text:'先接受，她说的可能是对的',score:2},
     {text:'认真听完理由，再做判断',score:1},
     {text:'说明我决策的依据，请她回应',score:-1},
     {text:'我的决策经过了充分考量，维持原判',score:-2},
   ]},

  /* ══ So3 表达方式 迂回↑ 直接↓ ══ */
  {dim:'So3',dir:-1,scene:'🛏️ 宿舍 · 走访',
   op:{name:'幽灵鲨',charId:'char_143_ghost',role:'近卫干员 · 阿戈尔'},
   text:'幽灵鲨最近明显情绪低落（"鲨红了眼"的那种）。你会怎么切入？',
   choices:[
     {text:'直接问："你最近怎么了，能说说吗？"',score:-2},
     {text:'"我发现你最近有点不一样，有什么事吗？"',score:-1},
     {text:'约她出去走走，等合适时机再开口',score:1},
     {text:'多观察一段时间，等她自己开口',score:2},
   ]},
  {dim:'So3',dir:1,scene:'🤔 办公室 · 私谈',
   op:{name:'极境',charId:'char_401_elysm',role:'先锋干员 · 伊比利亚'},
   text:'极境做了件让你不满意的事，你打算说清楚。你会怎么开口？',
   choices:[
     {text:'绕了一大圈才说到正题',score:2},
     {text:'先铺垫背景和前提，再说问题',score:1},
     {text:'直接说那件事让你有什么感受',score:-1},
     {text:'开门见山，直接说我觉得那样做不对',score:-2},
   ]},
  {dim:'So3',dir:1,scene:'🚪 走廊 · 拉普兰德撩骚',
   op:{name:'拉普兰德',charId:'char_140_whitew',role:'近卫干员 · 西拉库扎'},
   text:'拉普兰德靠在门边说了句意味深长的话，你需要给出回应。你会？',
   choices:[
     {text:'顾左右而言他，绕回工作话题',score:2},
     {text:'给一个模糊但友善的回应',score:1},
     {text:'直接表明自己的立场',score:-1},
     {text:'直接问她想说什么',score:-2},
   ]},
  {dim:'So3',dir:-1,scene:'🐾 走廊 · 凯尔希的猫',
   op:{name:'凯尔希',charId:'char_003_kalts',role:'医疗干员 · 罗德岛'},
   text:'你想问凯尔希一件比较私人的事，但不确定她会不会直接拒绝你。你的策略是？',
   choices:[
     {text:'直接问，最坏也就是被拒绝',score:-2},
     {text:'找个合适的时机直接说',score:-1},
     {text:'先聊别的，找机会引到那件事上',score:1},
     {text:'想好了再问，或者找中间人帮忙带话',score:2},
   ]},
];
