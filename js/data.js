/* ==========================================================================
   桥见川渝 · 数据层
   川渝文化词典 + 内置对照案例（中/英）+ 领域/体裁/写作风格枚举
   说明：词典规则匹配用于「兜底模式」识别与「AI 模式」的术语参考；
        多语种译文为预先编校的演示样本，AI 模式由 DeepSeek 实时生成。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

/* --------------------------------------------------------------------------
   1. 川渝文化敏感点词典
   category: cultural 文化负载词 | metaphor 隐喻意象 | context 强语境依赖表达
   level:    高 / 中 / 低
   region:   成都（慢生活·安逸）/ 重庆（麻辣·码头江湖）/ 巴蜀（两地共赏）
   -------------------------------------------------------------------------- */
QJC.dictionary = [
  /* —— 成都 · 慢生活（安逸调性）—— */
  {
    term: "盖碗茶",
    category: "cultural",
    level: "中",
    region: "成都",
    reason: "成都茶馆的标志性茶具与饮茶方式，承载「慢生活」与「市井闲适」双重意象，直译 'lidded cup of tea' 丢失器具形制与场景感。",
    suggestions: ["音译+注释：gaiawan — a Sichuan lidded cup of tea", "补场景：在竹椅木桌的茶馆里慢慢啜饮，凸显「慢」的韵味。"]
  },
  {
    term: "茶馆",
    category: "context",
    level: "低",
    region: "成都",
    reason: "成都茶馆不只是喝茶场所，更是社交、听评书、摆龙门阵的公共空间，直译 teahouse 信息不足。",
    suggestions: ["直译 teahouse，可补「公共社交空间」属性：a teahouse where locals gather to chat and while away the afternoon。"]
  },
  {
    term: "龙门阵",
    category: "metaphor",
    level: "高",
    region: "成都",
    reason: "川渝方言，指「海阔天空地闲聊、讲故事」，与龙门（高门/官方）无关，直译 dragon-gate formation 完全失效。",
    suggestions: ["意译：longmenzhen — leisurely, wide-ranging chitchat", "可译 to shoot the breeze / to have a good long chat，保留「随性、无目的」语义。"]
  },
  {
    term: "巴适",
    category: "cultural",
    level: "高",
    region: "成都",
    reason: "川渝方言感叹词，表达「舒服、安逸、惬意」的复合感受，是成都慢生活的核心情绪词，无对应英文词。",
    suggestions: ["音译+注释：bashe — comfortable and contented", "意译替换：cozy / just right / utterly satisfying，视语境选择。"]
  },
  {
    term: "安逸",
    category: "cultural",
    level: "高",
    region: "成都",
    reason: "与「巴适」近义的川渝方言词，表达「闲适自在、不慌不忙」的生活态度，直译 easy/comfortable 过于单薄。",
    suggestions: ["音译+注释：anyi — laid-back and carefree", "意译：a laid-back, unhurried ease of living。"]
  },
  {
    term: "宽窄巷子",
    category: "cultural",
    level: "低",
    region: "成都",
    reason: "成都历史文化街区专名，'Kuanzhai' 若只音译不加注释，海外受众无法感知其「老成都街巷」属性。",
    suggestions: ["音译+注释：Kuanzhai Alleys — a historic quarter of old Chengdu", "首见处补「清代老街巷」背景。"]
  },
  {
    term: "大熊猫",
    category: "cultural",
    level: "低",
    region: "成都",
    reason: "四川名片，国际认知度极高，giant panda 已是通行译名，歧义可控。",
    suggestions: ["直译 giant panda，可补「四川是其主要栖息地」的背景信息。"]
  },
  {
    term: "担担面",
    category: "cultural",
    level: "中",
    region: "成都",
    reason: "四川名小吃，'dandan noodles' 需补「担子叫卖」的市井渊源与麻辣口感，才能建立画面感。",
    suggestions: ["音译+描述：dandan noodles — spicy Sichuan noodles once sold from shoulder poles", "补口感与历史。"]
  },
  {
    term: "钟水饺",
    category: "cultural",
    level: "低",
    region: "成都",
    reason: "成都传统小吃，甜辣口的红油水饺，直译钟氏水饺丢失「甜辣红油」特色。",
    suggestions: ["音译+描述：Zhong dumplings — Chengdu pork dumplings in sweet-spicy chili oil。"]
  },
  {
    term: "冰粉",
    category: "cultural",
    level: "低",
    region: "成都",
    reason: "川渝夏季消暑甜品，透明啫喱配红糖，海外无对应物。",
    suggestions: ["描述式：bingfen — a jelly-like summer dessert topped with brown-sugar syrup。"]
  },

  /* —— 重庆 · 码头江湖（麻辣调性）—— */
  {
    term: "火锅",
    category: "cultural",
    level: "低",
    region: "重庆",
    reason: "hotpot 已有一定国际认知，但川渝火锅的「麻辣」「围炉共食」社交属性需点明。",
    suggestions: ["直译 hotpot，可补：a communal pot of fiery broth for dipping", "点明「麻辣」与「围坐共食」的社交场景。"]
  },
  {
    term: "串串香",
    category: "cultural",
    level: "中",
    region: "重庆",
    reason: "重庆特色市井小吃，竹签串食材涮麻辣锅，'chuanchuan' 若不加注释难以理解。",
    suggestions: ["音译+描述：chuanchuan xiang — skewers cooked in spicy broth", "补「竹签自选、按签计费」的市井趣味。"]
  },
  {
    term: "山城",
    category: "context",
    level: "低",
    region: "重庆",
    reason: "重庆的别称，指其依山而建、坡坎交错的独特地貌，直译 mountain city 可传达但需补「立体城市」意象。",
    suggestions: ["直译 mountain city，可补：a city built on steep hillsides, famed for its vertiginous layers。"]
  },
  {
    term: "雾都",
    category: "context",
    level: "低",
    region: "重庆",
    reason: "重庆别称，因多雾得名，但 'foggy city' 易与伦敦混淆，需点明是重庆。",
    suggestions: ["意译：the foggy city（Chongqing），首见处明确指代重庆。"]
  },
  {
    term: "洪崖洞",
    category: "cultural",
    level: "低",
    region: "重庆",
    reason: "重庆地标，依山而建的吊脚楼群，夜晚灯火如宫崎骏动画场景，'Hongya Cave' 需补「吊脚楼」意象。",
    suggestions: ["音译+描述：Hongya Cave — a hillside complex of stilted houses glowing at night。"]
  },
  {
    term: "码头",
    category: "context",
    level: "中",
    region: "重庆",
    reason: "重庆因长江嘉陵江而兴，'码头'承载「码头文化」的江湖气、移民融合、市井烟火，直译 wharf 丢失文化内涵。",
    suggestions: ["意译+补义：the riverside dock culture of Chongqing", "点明「码头文化」的江湖与市井属性。"]
  },
  {
    term: "棒棒军",
    category: "cultural",
    level: "高",
    region: "重庆",
    reason: "重庆特色职业群体，指肩扛竹棒、爬坡上坎帮人挑货的力夫，'bangbang' 需大量语境铺垫，是山城地貌的活化石。",
    suggestions: ["音译+注释：bangbang (bangbang jun) — porters who carry goods on bamboo poles up Chongqing's steep slopes", "补「山城地形催生」的成因。"]
  },
  {
    term: "袍哥",
    category: "cultural",
    level: "高",
    region: "重庆",
    reason: "川渝历史上的民间帮会组织，蕴含「义气、江湖」等复杂社会史内涵，直译易带负面色彩，需谨慎处理。",
    suggestions: ["解释性译法：Paoge — a historic fraternal brotherhood of the Sichuan-Chongqing riverside", "点明「重义气」的历史文化面向，弱化帮会负面联想。"]
  },

  /* —— 巴蜀共赏 · 非遗 / 地标 —— */
  {
    term: "川剧变脸",
    category: "cultural",
    level: "中",
    region: "巴蜀",
    reason: "川剧绝技，'face-changing' 可直译，但需补「川剧」语境，避免与西方魔术/化妆混同。",
    suggestions: ["意译+注释：face-changing — the signature mask-switching feat of Sichuan opera", "点明是川剧表演艺术而非特技。"]
  },
  {
    term: "蜀绣",
    category: "cultural",
    level: "中",
    region: "巴蜀",
    reason: "中国四大名绣之一，'Shu embroidery' 需补「四川」指代与工艺地位。",
    suggestions: ["音译+注释：Shu embroidery — one of China's four great embroidery traditions, from Sichuan。"]
  },
  {
    term: "川江号子",
    category: "cultural",
    level: "中",
    region: "巴蜀",
    reason: "川江船工劳动歌谣，'the river chants' 需补「船工拉纤」的劳动场景与非遗属性。",
    suggestions: ["描述+注释：the river chants of Sichuan boatmen — a UNESCO-listed work song tradition", "补劳动场景。"]
  },
  {
    term: "三星堆",
    category: "cultural",
    level: "低",
    region: "巴蜀",
    reason: "古蜀文明遗址，出土神秘青铜面具，'Sanxingdui' 国际认知度上升，音译即可，可补「神秘青铜文明」。",
    suggestions: ["音译+注释：Sanxingdui — the mysterious Bronze Age site of ancient Shu civilization。"]
  },
  {
    term: "都江堰",
    category: "cultural",
    level: "低",
    region: "巴蜀",
    reason: "世界文化遗产水利工程，'Dujiangyan' 需补「两千年前无坝引水」的工程奇迹属性。",
    suggestions: ["音译+注释：Dujiangyan — a 2,000-year-old irrigation system that still works today。"]
  },
  {
    term: "麻将",
    category: "cultural",
    level: "低",
    region: "巴蜀",
    reason: "川渝茶馆常见消遣，'mahjong' 已是通行译名，但需点明「茶馆打麻将」的市井休闲场景。",
    suggestions: ["直译 mahjong，可补：a favorite pastime in teahouses across Sichuan and Chongqing。"]
  },
  {
    term: "红辣椒",
    category: "cultural",
    level: "低",
    region: "巴蜀",
    reason: "川渝饮食「麻辣」的味觉符号，直译 red chili 可传达，但可补「川渝菜灵魂」的文化意义。",
    suggestions: ["直译 red chilies，可补：the fiery soul of Sichuan-Chongqing cuisine。"]
  }
];

/* --------------------------------------------------------------------------
   2. 内置对照案例（原稿 → 中英适配改写）
   -------------------------------------------------------------------------- */
QJC.cases = [
  {
    id: "chengdu",
    title: "成都慢生活：盖碗茶里的安逸",
    tag: "成都 · 慢生活",
    tagClass: "tag-teal",
    summary: "以盖碗茶、茶馆、龙门阵为切口，呈现成都人「巴适安逸」的慢生活哲学。",
    source:
      "在成都，慢不是懒，而是一种生活态度。清晨的茶馆里，人们用盖碗茶泡开一天，摆起龙门阵，摆着摆着就是一个上午。这份巴适，这份安逸，藏在宽窄巷子的青石板路上，也藏在大熊猫慢悠悠啃竹子的姿态里。",
    targets: [
      {
        lang: "中",
        langFull: "中文（原稿）",
        text: "在成都，慢不是懒，而是一种生活态度。清晨的茶馆里，人们用盖碗茶泡开一天，摆起龙门阵，摆着摆着就是一个上午。这份巴适，这份安逸，藏在宽窄巷子的青石板路上，也藏在大熊猫慢悠悠啃竹子的姿态里。",
        strategy: "原稿"
      },
      {
        lang: "英",
        langFull: "English",
        text: "In Chengdu, taking it slow is not laziness — it is a way of life. In the morning teahouses, people brew their first gaiawan (a Sichuan lidded cup of tea) to start the day, then settle into a longmenzhen, a leisurely, wide-ranging chat that can easily stretch until noon. This bashe — this comfortable, carefree ease — is felt in the flagstone lanes of Kuanzhai Alleys and in the unhurried way giant pandas nibble bamboo.",
        strategy: "「盖碗茶」「龙门阵」「巴适/安逸」音译+注释；「宽窄巷子」音译+街区说明；「大熊猫」直译 giant panda。"
      }
    ]
  },
  {
    id: "chongqing",
    title: "重庆江湖：火锅与码头的人间热气",
    tag: "重庆 · 码头文化",
    tagClass: "tag-red",
    summary: "借火锅、码头、洪崖洞、棒棒军等意象，呈现重庆山城的麻辣江湖气与市井烟火。",
    source:
      "重庆是一座建在山上的城市，人称山城，又多雾，故又称雾都。夜幕降临时，洪崖洞的吊脚楼灯火通明，码头边的大排档飘出火锅的麻辣香气。曾经肩挑竹棒的棒棒军，如今成了这座立体城市里最鲜活的记忆。",
    targets: [
      {
        lang: "中",
        langFull: "中文（原稿）",
        text: "重庆是一座建在山上的城市，人称山城，又多雾，故又称雾都。夜幕降临时，洪崖洞的吊脚楼灯火通明，码头边的大排档飘出火锅的麻辣香气。曾经肩挑竹棒的棒棒军，如今成了这座立体城市里最鲜活的记忆。",
        strategy: "原稿"
      },
      {
        lang: "英",
        langFull: "English",
        text: "Chongqing is a city built on mountains — a \"mountain city,\" and because of its frequent fog, it is also called the \"foggy city.\" When night falls, the stilted houses of Hongya Cave glow with lights, and the scent of fiery hotpot drifts from the open-air food stalls along the riverside docks. The bangbang — porters who once carried goods on bamboo poles up the city's steep slopes — have become one of the most vivid memories of this vertical metropolis.",
        strategy: "「山城/雾都」直译+引号点明别称；「洪崖洞」音译+吊脚楼描述；「棒棒军」音译+职业注释；「码头」补 riverside docks 的江湖场景。"
      }
    ]
  },
  {
    id: "feiyi",
    title: "巴蜀非遗：变脸、蜀绣与川江号子",
    tag: "巴蜀 · 非遗",
    tagClass: "tag-gold",
    summary: "以川剧变脸、蜀绣、川江号子为载体，展示巴蜀非遗的技艺之美与情感共通点。",
    source:
      "巴蜀大地孕育了丰富的非物质文化遗产。川剧演员一转身便是一张新面孔的变脸，蜀绣艺人在方寸之间绣出山水花鸟，川江上的船工号子至今仍在诉说着先民与江水搏斗的坚韧。这些技艺，承载着巴蜀人对生活的热爱与对天地的敬畏。",
    targets: [
      {
        lang: "中",
        langFull: "中文（原稿）",
        text: "巴蜀大地孕育了丰富的非物质文化遗产。川剧演员一转身便是一张新面孔的变脸，蜀绣艺人在方寸之间绣出山水花鸟，川江上的船工号子至今仍在诉说着先民与江水搏斗的坚韧。这些技艺，承载着巴蜀人对生活的热爱与对天地的敬畏。",
        strategy: "原稿"
      },
      {
        lang: "英",
        langFull: "English",
        text: "The land of Sichuan and Chongqing has nurtured a wealth of intangible cultural heritage. Sichuan opera performers perform face-changing, swapping masks in the blink of an eye; Shu embroidery artists stitch landscapes, flowers and birds into tiny frames of silk; and the river chants of the Yangtze boatmen still echo the resilience of generations who wrestled with the waters. These crafts carry the people's love of life and their reverence for nature.",
        strategy: "「变脸」意译+注释；「蜀绣」音译+工艺说明；「川江号子」描述+注释；「巴蜀」意译为 Sichuan and Chongqing。"
      }
    ]
  },
  {
    id: "landmark",
    title: "重庆地标：洪崖洞与山城巷",
    tag: "重庆 · 立体魔幻",
    tagClass: "tag-red",
    summary: "借洪崖洞、山城巷、朝天门、解放碑等新语料库专名，展示山城立体地标的英文译法。",
    source:
      "重庆的夜景，从洪崖洞的吊脚楼开始。这座依山而建的建筑群灯火通明，仿佛宫崎骏笔下的奇幻世界。沿着山城巷拾级而上，左手是斑驳的黄葛树根，右手是长江对岸的摩天楼群。登上朝天门，看两江交汇；回望解放碑，感受这座城市历史与现代的交织。这就是重庆——一座“8D魔幻”的立体之城。",
    targets: [
      {
        lang: "中",
        langFull: "中文（原稿）",
        text: "重庆的夜景，从洪崖洞的吊脚楼开始。这座依山而建的建筑群灯火通明，仿佛宫崎骏笔下的奇幻世界。沿着山城巷拾级而上，左手是斑驳的黄葛树根，右手是长江对岸的摩天楼群。登上朝天门，看两江交汇；回望解放碑，感受这座城市历史与现代的交织。这就是重庆——一座“8D魔幻”的立体之城。",
        strategy: "原稿"
      },
      {
        lang: "英",
        langFull: "English",
        text: "Chongqing's nightscape begins with the stilted houses of Hongya Cave. This hillside complex glows with lights, like a fantasy world straight out of a Miyazaki film. Climbing the steps of Shancheng Lane, on your left dangle mottled banyan roots, while on your right rise the skyscrapers across the Yangtze. Stand at Chaotianmen and watch the two rivers converge; look back at Jiefangbei and feel the city's blend of history and modernity. This is Chongqing — a \"8D magic\" vertical city.",
        strategy: "「洪崖洞」音译+吊脚楼说明；「山城巷」音译 Shancheng Lane；「朝天门/解放碑」音译专名；「8D魔幻」直译并点明立体城市。"
      }
    ]
  }
];

/* --------------------------------------------------------------------------
   3. 目标语言（主打中→英，架构保留数组便于将来扩展）
   -------------------------------------------------------------------------- */
QJC.languages = [
  { code: "en", label: "英语", full: "English" }
];

/* --------------------------------------------------------------------------
   4. 新闻稿件领域 / 体裁 / 写作风格维度（用户画像用）
   -------------------------------------------------------------------------- */
QJC.domains = ["时政", "财经", "社会", "文化", "文旅", "体育", "法制", "科技"];

QJC.genres = ["消息", "通讯", "特写", "专访", "评论"];

/* 写作风格维度：key 为英文标识（AI 返回的 styleTags 与之对齐），label/options 用于展示 */
QJC.styleDims = {
  register:    { label: "语体",         options: ["正式书面", "半正式", "口语轻松"] },
  sentiment:   { label: "情感基调",     options: ["克制客观", "温情感性", "热情激昂"] },
  syntax:      { label: "句式节奏",     options: ["短句白描", "长句铺陈", "排比对仗", "文白夹杂"] },
  rhetoric:    { label: "修辞手法",     options: ["善用比喻", "引用用典", "白描直叙", "设问反问"] },
  idiom:       { label: "成语四字格密度", options: ["高", "中", "低"] },
  colloquial:  { label: "口语方言化",   options: ["高", "中", "低"] },
  perspective: { label: "叙事视角",     options: ["第一人称亲历", "第三人称客观", "夹叙夹议"] },
  structure:   { label: "结构组织",     options: ["开门见山", "层层递进", "小标题分段"] }
};

/* --------------------------------------------------------------------------
   5. 川渝核心术语中英对照（注入翻译/改稿 prompt 的术语表）
   -------------------------------------------------------------------------- */
QJC.coreGlossary = {
  "火锅":     { en: "hotpot", region: "重庆" },
  "盖碗茶":   { en: "gaiawan (a Sichuan lidded cup of tea)", region: "成都" },
  "龙门阵":   { en: "longmenzhen (leisurely, wide-ranging chat)", region: "成都" },
  "巴适":     { en: "bashe (comfortable and contented)", region: "成都" },
  "安逸":     { en: "anyi (laid-back and carefree)", region: "成都" },
  "川剧变脸": { en: "face-changing of Sichuan opera", region: "巴蜀" },
  "蜀绣":     { en: "Shu embroidery", region: "巴蜀" },
  "川江号子": { en: "river chants of Sichuan boatmen", region: "巴蜀" },
  "洪崖洞":   { en: "Hongya Cave", region: "重庆" },
  "宽窄巷子": { en: "Kuanzhai Alleys", region: "成都" },
  "三星堆":   { en: "Sanxingdui", region: "巴蜀" },
  "都江堰":   { en: "Dujiangyan", region: "巴蜀" },
  "大熊猫":   { en: "giant panda", region: "成都" },
  "棒棒军":   { en: "bangbang (porters who carry goods on bamboo poles)", region: "重庆" },
  "袍哥":     { en: "Paoge brotherhood", region: "重庆" },
  "麻将":     { en: "mahjong", region: "巴蜀" }
};

/* 类别中文名映射 */
QJC.categoryNames = {
  cultural: "文化负载词",
  metaphor: "隐喻意象",
  context: "强语境依赖表达"
};

/* 地域中文名映射 */
QJC.regionNames = {
  "成都": "成都 · 慢生活",
  "重庆": "重庆 · 码头江湖",
  "巴蜀": "巴蜀共赏"
};
