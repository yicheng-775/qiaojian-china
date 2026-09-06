/* ==========================================================================
   桥见中国 · 数据层
   纯前端演示数据：文化敏感点词典 + 内置对照案例（中/英/日/德）
   说明：本原型不接入 AI API，识别基于内置词典规则匹配，
        多语种译文为预先编校的演示样本。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

/* --------------------------------------------------------------------------
   1. 文化敏感点词典
   category: cultural 文化负载词 | metaphor 隐喻意象 | context 强语境依赖表达
   level:    高 / 中 / 低
   -------------------------------------------------------------------------- */
QJC.dictionary = [
  /* —— 茶文化 / 待客 —— */
  {
    term: "以茶代酒",
    category: "cultural",
    level: "高",
    reason: "高度依赖中国酒桌与敬客文化语境，海外受众无对应礼俗，直译为 'use tea instead of wine' 会丢失「以礼节替代劝酒」的隐含逻辑。",
    suggestions: ["增译解释：offering tea in place of alcohol as a gesture of courtesy", "补充礼俗背景：在中国待客文化中，敬茶与敬酒同表敬意。"]
  },
  {
    term: "敬茶",
    category: "cultural",
    level: "中",
    reason: "「敬」字蕴含晚辈对长辈、主人对客人的礼序关系，直译 serve tea 无法传达尊卑礼序。",
    suggestions: ["归化替换：serve tea respectfully（with both hands）", "保留行为细节：双手奉茶，凸显「敬」的具象化。"]
  },
  {
    term: "工夫茶",
    category: "cultural",
    level: "中",
    reason: "「工夫」非 'work/kungfu' 之意，实指闽粤地区精细的泡茶程式，易被误读为武术。",
    suggestions: ["音译+注释：Gongfu tea — the elaborate tea-brewing ritual of southern China", "避免与 'kung fu'（武术）混淆。"]
  },
  {
    term: "龙井",
    category: "cultural",
    level: "低",
    reason: "中国名茶专名，海外受众认知度中等，直译拼音需补充品类信息。",
    suggestions: ["音译+类别：Longjing green tea", "首见处补充产地：from Zhejiang, China。"]
  },

  /* —— 传统节日 / 非遗 —— */
  {
    term: "端午节",
    category: "cultural",
    level: "中",
    reason: "节日名承载屈原、龙舟、粽子等复合文化记忆，仅译 'Dragon Boat Festival' 侧重单一意象。",
    suggestions: ["采用通行译名 Dragon Boat Festival 并保留可追溯性", "补充一句节日内涵：纪念与祈愿安康的传统节日。"]
  },
  {
    term: "赛龙舟",
    category: "cultural",
    level: "中",
    reason: "「龙」在中西文化中象征差异巨大（东方祥瑞 vs 西方恶兽），需防范意象误读。",
    suggestions: ["保留+解释：dragon boat racing，附注东方语境中龙为祥瑞之兽", "可用 'longboat racing' 弱化 dragon 的负面联想，视受众而定。"]
  },
  {
    term: "粽子",
    category: "cultural",
    level: "中",
    reason: "糯米粽包裹方式、口味与形态在西方无对应物，'rice dumpling' 易与西式饺子混淆。",
    suggestions: ["音译+描述：zongzi — sticky-rice parcels wrapped in bamboo leaves", "补口感/场景，帮助建立画面感。"]
  },
  {
    term: "驱邪避疫",
    category: "context",
    level: "中",
    reason: "涉及传统民俗观念，若直译易带出「迷信」色彩，需作文化祛魅处理。",
    suggestions: ["意译软化：ward off misfortune and pray for health", "点明这是「传统习俗的美好愿望」而非字面的巫术行为。"]
  },
  {
    term: "春节",
    category: "cultural",
    level: "低",
    reason: "国际认知度较高，但 'Spring Festival' 与 'Lunar New Year' 存在译名分歧。",
    suggestions: ["视受众区域选用 Chinese New Year / Lunar New Year", "首见处可并列注明。"]
  },
  {
    term: "中秋",
    category: "cultural",
    level: "低",
    reason: "月亮、团圆意象需文化铺垫，单纯 'Mid-Autumn Festival' 信息量不足。",
    suggestions: ["补团圆意象：the festival of family reunion under the full moon"]
  },

  /* —— 饮食 / 市井 —— */
  {
    term: "撸串",
    category: "metaphor",
    level: "高",
    reason: "「撸」为北方口语动词，具强烈本土语感，直译后完全丢失「随性、烟火气」的氛围语义。",
    suggestions: ["意译替换：grab some grilled skewers / eat skewers at a street stall", "保留口语随性感，可译 'grab a few skewers with friends'。"]
  },
  {
    term: "大排档",
    category: "context",
    level: "中",
    reason: "中国南方露天食肆形态，海外对应物不精确，直译易失去场景感。",
    suggestions: ["描述式译法：open-air food stalls / sidewalk eateries", "补一句「街边、亲民、热闹」的氛围。"]
  },
  {
    term: "夜市",
    category: "context",
    level: "低",
    reason: "night market 在东南亚等地区有对应认知，歧义较小。",
    suggestions: ["直译 night market 即可，可补热闹氛围描述。"]
  },
  {
    term: "广场舞",
    category: "context",
    level: "中",
    reason: "中国特有的中老年公共健身文化，海外无对应现象，需解释「群体性、公共空间、休闲」属性。",
    suggestions: ["描述+解释：public square dancing（a popular group fitness pastime among middle-aged and older Chinese）", "弱化潜在刻板印象，强调健康与社区属性。"]
  },
  {
    term: "烟火气",
    category: "metaphor",
    level: "高",
    reason: "高度浓缩的意象词，指「日常生活的温暖与生机」，直译 'smoke and fire' 完全失效。",
    suggestions: ["意译：the warmth and bustle of everyday life", "可拆解为具体画面：热气腾腾的食物、热闹的人群。"]
  },
  {
    term: "火锅",
    category: "cultural",
    level: "低",
    reason: "hotpot 已有一定国际认知，歧义可控。",
    suggestions: ["直译 hotpot，可补「围炉共食」的社交属性。"]
  },

  /* —— 青年亚文化 —— */
  {
    term: "内卷",
    category: "metaphor",
    level: "高",
    reason: "源自学术术语的流行语，指「非理性内部竞争」，若直译 involution 需大量语境铺垫。",
    suggestions: ["意译替换：cutthroat competition / rat race / hyper-competition", "按语境选择，避免学术黑话。"]
  },
  {
    term: "躺平",
    category: "metaphor",
    level: "高",
    reason: "网络流行语，指「放弃过度竞争的低欲望姿态」，直译 'lie flat' 易被理解为物理动作。",
    suggestions: ["意译+解释：opting out of the rat race / choosing a low-pressure lifestyle", "保留其「主动选择」的语义。"]
  },
  {
    term: "摆烂",
    category: "metaphor",
    level: "高",
    reason: "口语贬义新词，指「破罐破摔、不再努力」，无对应译法。",
    suggestions: ["意译替换：give up trying / stop making an effort", "视语气选择：let it all go（轻松）或 give up（负面）。"]
  },
  {
    term: "社恐",
    category: "metaphor",
    level: "中",
    reason: "「社交恐惧」的口语缩略，常被调侃化使用，直译 social phobia 语义过重。",
    suggestions: ["意译：socially awkward / shy around people", "区分数值临床含义与日常调侃。"]
  },

  /* —— 人际 / 礼俗 —— */
  {
    term: "面子",
    category: "context",
    level: "高",
    reason: "「面子」是中国式人际关系的核心概念，蕴含名誉、社会评价、情面多重含义，直译 face 信息严重不足。",
    suggestions: ["意译+解释：social standing / reputation / saving face", "关键处需补一句面子文化的社交逻辑。"]
  },
  {
    term: "关系",
    category: "context",
    level: "高",
    reason: "特指中国社会的人情网络，与英文 relationship 的普通义差异巨大，易被误读为利益交换。",
    suggestions: ["解释性译法：guanxi — the network of personal connections and mutual obligations", "避免与一般人际关系混同。"]
  },
  {
    term: "红包",
    category: "cultural",
    level: "中",
    reason: "红纸包钱的礼俗，西方有 gift card 但无「红」的吉祥意涵。",
    suggestions: ["描述+保留：red envelope（a gift of money in a red packet for good luck）", "点明吉祥寓意。"]
  },
  {
    term: "人情世故",
    category: "context",
    level: "中",
    reason: "浓缩中国社会交往规则的成语，直译易碎成碎片。",
    suggestions: ["意译：the unwritten rules of social etiquette", "可补充「礼尚往来」的互惠逻辑。"]
  },

  /* —— 文旅 / 国潮 —— */
  {
    term: "汉服",
    category: "cultural",
    level: "低",
    reason: "传统服饰专名，认知度逐年上升，拼音+解释即可。",
    suggestions: ["音译+解释：hanfu — traditional Han Chinese clothing", "可补时代背景。"]
  },
  {
    term: "国潮",
    category: "context",
    level: "中",
    reason: "「国货潮流」的新造词，指中国传统元素与现代设计的融合，海外无对应词。",
    suggestions: ["解释性译法：China-chic / a trend of Chinese cultural aesthetics in modern design", "点明「传统×现代」融合点。"]
  },
  {
    term: "非遗",
    category: "cultural",
    level: "低",
    reason: "「非物质文化遗产」的官方缩略，英文有标准对应 intangible cultural heritage。",
    suggestions: ["直译 intangible cultural heritage，首见处写全称。"]
  },
  {
    term: "古镇",
    category: "context",
    level: "低",
    reason: "中国水乡/历史村镇意象，ancient town 可传达但略失韵味。",
    suggestions: ["直译 ancient town / historic town，可补「水乡/石板路」画面。"]
  },
  {
    term: "桥",
    category: "metaphor",
    level: "低",
    reason: "「桥」在本项目中具双重象征（实物建筑 + 沟通媒介），需根据语境判断是否需要点明隐喻。",
    suggestions: ["实义直译 bridge；隐喻义可译 'bridge of communication' 并注明双关。"]
  }
];

/* --------------------------------------------------------------------------
   2. 内置对照案例（原稿 → 四语适配改写）
   -------------------------------------------------------------------------- */
QJC.cases = [
  {
    id: "tea",
    title: "以茶待客：一杯茶里的中国情谊",
    tag: "传统文化 · 茶",
    tagClass: "tag-gold",
    summary: "茶是中外共有精神内核的主题，借助待客礼俗呈现中国人的情谊表达。",
    source:
      "在中国，人们常说「以茶代酒」。拜访亲友时，主人总会泡上一壶热茶，双手敬茶，表达对客人的尊重。无论是广东的工夫茶，还是江南的龙井，一杯茶里都寄托着中国人对情谊的珍重。",
    targets: [
      {
        lang: "中",
        langFull: "中文（原稿）",
        text: "在中国，人们常说「以茶代酒」。拜访亲友时，主人总会泡上一壶热茶，双手敬茶，表达对客人的尊重。无论是广东的工夫茶，还是江南的龙井，一杯茶里都寄托着中国人对情谊的珍重。",
        strategy: "原稿"
      },
      {
        lang: "英",
        langFull: "English",
        text: "In China, people often “offer tea in place of alcohol” as a gesture of courtesy. When visiting friends or relatives, the host brews a pot of hot tea and serves it with both hands to show respect. Whether it is Gongfu tea — the elaborate tea-brewing ritual of southern China — or Longjing green tea from the Yangtze River Delta, a single cup of tea carries the deep value Chinese people place on friendship.",
        strategy: "「以茶代酒」增译解释；「工夫茶」音译+注释；「敬茶」以具象动作（with both hands）传达礼序。"
      },
      {
        lang: "日",
        langFull: "日本語",
        text: "中国では、「酒の代わりにお茶を」という言葉をよく耳にします。親戚や友人を訪ねるとき、主人は熱いお茶を淹れ、両手で差し出すことで客人への敬意を表します。広東の工夫茶であれ、江南の龍井茶であれ、一杯のお茶には中国人の人情を大切にする心が込められています。",
        strategy: "「以茶代酒」意译并补礼俗；「工夫茶」保留汉字+片假名标注读音；「敬茶」以「両手で差し出す」具象化。"
      },
      {
        lang: "德",
        langFull: "Deutsch",
        text: "In China sagt man oft: „Tee statt Alkohol“ — eine Geste der Höflichkeit. Wenn man Freunde oder Verwandte besucht, brüht der Gastgeber eine Kanne heißen Tee auf und reicht sie mit beiden Händen als Zeichen des Respekts. Ob Gongfu-Tee aus Guangdong oder Longjing-Tee aus dem Jangtse-Delta: In einer Tasse Tee liegt die tiefe Wertschätzung der Chinesen für Freundschaft.",
        strategy: "「以茶代酒」增译 Gestik 语境；专名音译；「敬茶」以双手递茶动作具象化。"
      }
    ]
  },
  {
    id: "street",
    title: "夜色烟火：大排档里的人间热气",
    tag: "当代生活 · 市井",
    tagClass: "tag-red",
    summary: "去时政化的市井日常，借夜市、撸串等意象传递当代中国普通人的鲜活生机。",
    source:
      "夜幕降临，城市的大排档和夜市就热闹起来。约上三五好友一起「撸串」，喝点冰啤酒，是很多年轻人的日常。广场上，阿姨们跳起了广场舞，满街的烟火气里透着一股热气腾腾的生机。",
    targets: [
      {
        lang: "中",
        langFull: "中文（原稿）",
        text: "夜幕降临，城市的大排档和夜市就热闹起来。约上三五好友一起「撸串」，喝点冰啤酒，是很多年轻人的日常。广场上，阿姨们跳起了广场舞，满街的烟火气里透着一股热气腾腾的生机。",
        strategy: "原稿"
      },
      {
        lang: "英",
        langFull: "English",
        text: "As night falls, the open-air food stalls and night markets come alive. Grabbing a few grilled skewers with friends over ice-cold beer is a familiar evening ritual for many young people. In the square, older women gather for public square dancing, and the whole street brims with the warmth and bustle of everyday life.",
        strategy: "「撸串」意译为 grab grilled skewers；「大排档」描述式译 open-air food stalls；「烟火气」意译为 warmth and bustle；「广场舞」补说明。"
      },
      {
        lang: "日",
        langFull: "日本語",
        text: "夜の帳が下りると、街の屋台や夜市がにぎわい始めます。友達数人と焼き串をつまみ、冷えたビールを飲むのは、多くの若者にとって日常のひとときです。広場ではおばさんたちが集まって踊り、街全体にあたたかな生活の息吹があふれています。",
        strategy: "「撸串」意译为「焼き串をつまむ」；「大排档」归化为「屋台」；「烟火气」意译为「あたたかな生活の息吹」。"
      },
      {
        lang: "德",
        langFull: "Deutsch",
        text: "Wenn die Nacht hereinbricht, werden die offenen Essensstände und Nachtmärkte der Stadt lebendig. Mit Freunden ein paar gegrillte Spieße zu essen und ein kühles Bier dazu zu trinken, gehört für viele junge Menschen zum Alltag. Auf dem Platz tanzen die älteren Damen Gruppentänze, und die ganze Straße sprüht vor der Wärme und Lebendigkeit des Alltagslebens.",
        strategy: "「撸串」意译 gegrillte Spieße；「广场舞」描述+解释 Gruppentänze；「烟火气」意译 Wärme und Lebendigkeit。"
      }
    ]
  },
  {
    id: "dragonboat",
    title: "端午安康：龙舟与粽子的千年祈愿",
    tag: "传统文化 · 非遗",
    tagClass: "tag-teal",
    summary: "以已有国际认知基础的传统节日为载体，展示习俗背后的安康祈愿与情感共通点。",
    source:
      "端午节是中国传统节日。这一天，人们赛龙舟、吃粽子，在门上挂艾草，为孩子系上五彩绳，以此驱邪避疫、祈求安康。这些习俗承载着中国人对家人健康的朴素祝愿。",
    targets: [
      {
        lang: "中",
        langFull: "中文（原稿）",
        text: "端午节是中国传统节日。这一天，人们赛龙舟、吃粽子，在门上挂艾草，为孩子系上五彩绳，以此驱邪避疫、祈求安康。这些习俗承载着中国人对家人健康的朴素祝愿。",
        strategy: "原稿"
      },
      {
        lang: "英",
        langFull: "English",
        text: "The Dragon Boat Festival is a traditional Chinese holiday. On this day, people race dragon boats, eat zongzi — sticky-rice parcels wrapped in bamboo leaves — hang wormwood on their doors, and tie colorful braided cords around children's wrists, all as traditional ways to ward off misfortune and pray for good health. These customs carry a simple wish for the well-being of one's family.",
        strategy: "「粽子」音译+描述；「驱邪避疫」意译软化 ward off misfortune；「龙舟」补东方龙之祥瑞语境的说明空间。"
      },
      {
        lang: "日",
        langFull: "日本語",
        text: "端午の節句は中国の伝統的な祝日です。この日、人々はドラゴンボートを漕ぎ、ちまきを食べ、門にヨモギを掛け、子どもの手首に五色の紐を結びます。これらは厄を払い、健康を願うための昔からの習わしです。こうした風習には、家族の健康を願う素朴な思いが込められています。",
        strategy: "「粽子」归化为日本已有认知的「ちまき」；「驱邪避疫」意译「厄を払い、健康を願う」；「龙舟」保留音译。"
      },
      {
        lang: "德",
        langFull: "Deutsch",
        text: "Das Drachenbootfest ist ein traditionelles chinesisches Fest. An diesem Tag fahren die Menschen Drachenbootrennen, essen Zongzi — in Bambusblätter gewickelte Klebreispäckchen — hängen Beifuß an die Türen und binden den Kindern bunte Schnüre um die Handgelenke, um Unheil abzuwenden und für Gesundheit zu beten. Diese Bräuche tragen einen schlichten Wunsch nach dem Wohl der Familie in sich.",
        strategy: "「粽子」音译+描述 Zongzi；「驱邪避疫」意译 Unheil abwenden；「五彩绳」以具象色彩描述 bunte Schnüre。"
      }
    ]
  }
];

/* --------------------------------------------------------------------------
   3. 目标语言选项
   -------------------------------------------------------------------------- */
QJC.languages = [
  { code: "en", label: "英语", full: "English" },
  { code: "ja", label: "日语", full: "日本語" },
  { code: "de", label: "德语", full: "Deutsch" }
];

/* 类别中文名映射 */
QJC.categoryNames = {
  cultural: "文化负载词",
  metaphor: "隐喻意象",
  context: "强语境依赖表达"
};
