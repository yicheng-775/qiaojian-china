/* ==========================================================================
   桥见巴渝 · 语料库术语表（corpus glossary）
   来源：语料库资料.zip 的 14 组 CN/EN .docx 平行语料，人工校订后的
        巴渝专名 / 文化词官方英文译法。
   作用：注入「翻译 / 改稿」prompt 的术语表，让 AI 对巴渝专名翻译一致
        （如 湖广会馆 → Huguang Guild Hall、山城巷 → Shancheng Lane）。
   与 js/data.js 的 QJC.coreGlossary（生活类核心词）互补、自动合并，
   只需在下面 glossary 里「按字母/主题随意增删」即可扩展。

   —— 如何自主更新（很重要）——
   1. 打开本文件，在 glossary 对象里加一行：
        "中文词": { en: "English", region: "重庆" },
      region 取值：重庆 / 巴渝。
   2. 改完记得把 index.html 里 <script src="js/corpus.js?v=N"> 的 N 加 1
      （浏览器缓存会记住旧版本号，不加号你刷新也看不到新词）。
   3. 保存、git 提交、push，Netlify 自动重新部署即可。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.corpus = {
  glossary: {
    /* —— 地标 · 街巷 · 建筑（重庆）—— */
    "吊脚楼":       { en: "Diaojiaolou (stilt house)", region: "巴渝" },
    "湖广会馆":     { en: "Huguang Guild Hall", region: "重庆" },
    "山城巷":       { en: "Shancheng Lane", region: "重庆" },
    "十八梯":       { en: "Shiba Ti (Eighteen Steps)", region: "重庆" },
    "龙门浩":       { en: "Longmenhao", region: "重庆" },
    "下浩里":       { en: "Xiahapoli", region: "重庆" },
    "弹子石老街":   { en: "Danzishi Old Street", region: "重庆" },
    "白象居":       { en: "Baixiangju Community", region: "重庆" },
    "磁器口":       { en: "Ciqikou Ancient Town", region: "重庆" },
    "解放碑":       { en: "Jiefangbei (People's Liberation Monument)", region: "重庆" },
    "朝天门":       { en: "Chaotianmen", region: "重庆" },
    "长江索道":     { en: "Yangtze River Cableway", region: "重庆" },
    "大足石刻":     { en: "Dazu Rock Carvings", region: "重庆" },
    "钓鱼城":       { en: "Diaoyu Fortress", region: "重庆" },
    "鹅岭贰厂":     { en: "Eling No.2 Factory Cultural and Creative Park", region: "重庆" },
    "龚滩古镇":     { en: "Gongtan Ancient Town", region: "重庆" },
    "三峡移民纪念馆": { en: "Three Gorges Migration Memorial Hall", region: "重庆" },

    /* —— 非遗 · 艺术（巴渝）—— */
    "川剧":         { en: "Sichuan Opera (Chuanju)", region: "巴渝" },
    "铜梁龙舞":     { en: "Tongliang Dragon Dance", region: "重庆" },
    "龙灯彩扎":     { en: "Dragon Lantern Making", region: "重庆" },
    "摆手舞":       { en: "Baishou Dance (hand-waving dance)", region: "重庆" },
    "秀山花灯":     { en: "Xiushan Flower Lantern", region: "重庆" },
    "木洞山歌":     { en: "Mudong Mountain Songs", region: "重庆" },
    "四川清音":     { en: "Sichuan Qingyin (clear tune)", region: "巴渝" },
    "走马镇民间故事": { en: "Zouma Town Folk Tales", region: "重庆" },
    "梁山灯戏":     { en: "Liangshan Lantern Drama", region: "重庆" },
    "荣昌陶器":     { en: "Rongchang Pottery", region: "重庆" },
    "涪陵榨菜":     { en: "Fuling Zhacai (pickled mustard tuber)", region: "重庆" },
    "綦江农民版画": { en: "Qijiang Farmers' Printmaking", region: "重庆" },
    "丰都庙会":     { en: "Fengdu Temple Fair", region: "重庆" },

    /* —— 历史 · 人物 · 红岩 —— */
    "巴国":         { en: "the State of Ba", region: "巴渝" },
    "巴蔓子":       { en: "Bamanzi (a general of the State of Ba)", region: "重庆" },
    "廪君":         { en: "Linjun (founder of the Ba people)", region: "巴渝" },
    "巴渝舞":       { en: "Bayu Dance", region: "巴渝" },
    "涂山":         { en: "Tushan Mountain", region: "重庆" },
    "大禹":         { en: "Yu the Great", region: "巴渝" },
    "严颜":         { en: "Yan Yan", region: "重庆" },
    "彭大雅":       { en: "Peng Daya", region: "重庆" },
    "余玠":         { en: "Yu Jie", region: "重庆" },
    "王坚":         { en: "Wang Jian", region: "重庆" },
    "张珏":         { en: "Zhang Jue", region: "重庆" },
    "秦良玉":       { en: "Qin Liangyu", region: "重庆" },
    "红岩村":       { en: "Hongyan Village", region: "重庆" },
    "红岩精神":     { en: "Hongyan Spirit", region: "重庆" },
    "南方局":       { en: "the Southern Bureau of the CPC Central Committee", region: "重庆" },

    /* —— 方言 · 市井 —— */
    "坝坝茶":       { en: "Baba Tea (open-air tea gathering)", region: "重庆" },
    "雄起":         { en: "Xiongqi (cheer on; rise up)", region: "重庆" },
    "爬坡上坎":     { en: "climbing slopes and steps (the daily uphill grind)", region: "重庆" },
    "要得":         { en: "Yaode (okay, sure)", region: "重庆" },
    "打望":         { en: "Dawang (people-watching / checking someone out)", region: "重庆" },
    "好耍":         { en: "fun, enjoyable", region: "重庆" },
    "纤夫":         { en: "boat trackers", region: "重庆" },

    /* —— 城市符号 —— */
    "8D魔幻城市":   { en: "8D Magic City", region: "重庆" }
  }
};
