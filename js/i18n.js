/* ==========================================================================
   桥见巴渝 · 界面语言 i18n
   静态 HTML 用 data-i18n / data-i18n-placeholder / data-i18n-title 标记；
   动态 JS 字符串用 QJC.i18n.t(key, vars) 取文案。
   AI prompt 不做 i18n（内部指令，非用户可见）。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.i18n = (function () {
  "use strict";

  var dict = {
    zh: {
      /* 通用 chrome */
      navTool: "使用工具",
      navProfile: "我的画像",
      navAbout: "关于项目",
      brandTag: "AI 改稿助手",
      brandProfile: "我的画像",
      footerTagline: "巴渝中译英 AI 改稿助手",
      backTool: "返回工具",

      /* 首页 hero + 板块 tab */
      tabTranslate: "翻译",
      tabCulture: "文化检索",
      heroKicker: "巴渝中译英 · 跨文化编辑",
      heroTitlePrefix: "让世界读懂",
      heroTitleEm: "巴渝",
      heroTitleSuffix: "故事",
      heroSub: "粘贴中文原稿，自动识别巴渝文化表达、生成英文译文，并可针对任意段落对话协商改稿。",
      examplesLabel: "试一个示例：",
      caseChongqing: "🌶 重庆江湖",
      caseFeiyi: "🎭 巴渝非遗",
      caseLandmark: "🌆 重庆地标",

      /* 输入区 */
      originPh_zh2en: "在此粘贴你的中文原稿，例如：重庆是一座建在山上的城市，人称山城，又多雾，故又称雾都。夜幕降临时，洪崖洞的吊脚楼灯火通明……",
      originPh_en2zh: "Paste your English text here, e.g.: Chongqing is a mountain city, nicknamed the Mountain City, and often shrouded in fog, hence the Fog City...",
      dirZh2en: "中译英",
      dirEn2zh: "英译中",
      modeOneclick: "⚡ 一键翻译",
      modeCollab: "💬 对话协作",
      uploadDoc: "📄 上传文档",
      analyzeTranslate: "开始翻译 →",
      analyzeCollab: "开始逐段协作 →",
      analyzeCulture: "开始检索 →",
      modeBadgeAI: "AI 模式 · DeepSeek",
      modeBadgeFallback: "兜底模式 · 免费机翻",
      modeBadgeProbing: "探测中…",

      /* 结果区 */
      resultTitle: "中英对照 · 对话改稿",
      leftColTranslate: "中英对照",
      leftColCulture: "文化检索",
      saveDraft: "保存成稿",
      exportTxt: "导出 .txt",
      legendCultural: "文化负载词",
      legendMetaphor: "隐喻意象",
      legendContext: "强语境依赖",
      chatPanelTitle: "对话改稿",
      chatSend: "发送",
      chatPh: "例如：把这段的「火锅」翻成 hotpot，并说明是重庆麻辣……",

      /* 统计 */
      statRecognized: "识别 {n} 处文化表达",
      statHigh: "高",
      statMid: "中",
      statLow: "低",

      /* 设置弹层 */
      settingsTitle: "偏好设置",
      settingsSub: "这些偏好会注入 AI 改稿的「用户画像」，让译文更贴合你的写作习惯。",
      setAudience: "目标读者",
      audienceGeneral: "通用读者",
      audienceNews: "新闻读者",
      audienceAcademic: "学术读者",
      audienceYouth: "年轻读者",
      setTone: "语气偏好",
      toneFaithful: "忠实原文",
      toneFluent: "流畅归化",
      toneConcise: "精简",
      setKey: "DeepSeek API Key（自填）",
      setKeyPh: "sk-… 填入你自己的 key",
      setKeyNote: "留空则无法使用 AI，只能走免费机翻。key 只存在你浏览器本机，不随导出打包。",
      setAnnotate: "文化词首见处加括号注释",
      setDomestication: "归化倾向（贴近英语读者）",
      setProfile: "开启用户画像（关闭后不再累积或读取你的写作数据）",
      cancel: "取消",
      save: "保存",
      settingsNote: "提示：AI 模式需在本机双击 run-ai.bat 启动本地脚本（详见 README）。",

      /* 历史弹层 */
      historyTitle: "📜 历史记录",
      historySub: "已保存的翻译成稿与对话记录。点「打开」可恢复当时的原文、译文与对话。",
      clearHistory: "清空历史",
      close: "关闭",

      /* 登录 */
      loginTitle: "🔒 访问需要密码",
      loginSub: "本工具内置了作者的 AI 密钥，请输入访问密码后使用。",
      loginPass: "访问密码",
      loginPh: "请输入访问密码",
      loginError: "密码错误，请重试。",
      loginEnter: "进入",

      /* chat 动态 */
      hintCultureEmpty: "输入一段巴渝相关文字，点「开始检索」识别文化词，再在下方追问。",
      hintCultureFound: "已识别 {n} 处文化词，点词卡「追问」或在下方直接提问。",
      hintCultureNone: "未识别到文化词，可直接在下方提问任何巴渝文化相关的问题。",
      hintNoTranslate: "先翻译一篇文章，再点击左侧段落开始改稿。",
      hintEditing: "当前编辑：第 {n} 段",
      hintCollab: "逐段协作：点击左侧某段，再在下方输入怎么翻这一段（如「翻这段，保留专名音译」）。",
      hintSelect: "点击左侧任意段落，针对它对话改稿。",
      msgNeedTranslate: "请先翻译一篇文章。",
      msgNeedSelect: "请先点击左侧某个段落，告诉我想改哪一段。",
      msgEditing: "改稿中…",
      msgThinking: "正在想怎么改…",
      msgUpdated: "已更新。",
      msgRewriteFail: "改稿失败：{err}",
      msgAnswering: "回答中…",
      msgLooking: "正在查阅…",
      msgNeedCultureInput: "请先输入一段文字并点「开始检索」。",
      msgCultureNoReply: "抱歉，暂时没能回答这个问题。",
      msgCultureFail: "查询失败：{err}",
      msgFallbackGuide: "当前是「兜底模式」（免费机翻 + 词典识别），对话改稿需 AI。\n\n请在本机双击 run-ai.bat 启动 AI 脚本，再刷新页面。",
      msgYou: "你",
      msgAssistant: "助手",

      /* render 状态 */
      segTranslating: "翻译中…",
      segFailed: "翻译失败，请重试",
      segEditing: "编辑中",
      risk: "风险",

      /* culture 词卡 */
      cultureEmpty: "未识别到文化词。<br>换一段巴渝相关文字试试，或直接在右侧对话框里提问。",
      cultureAskBtn: "追问「{term}」",
      cultureAskPre: "「{term}」是什么意思？能再讲讲它的文化背景和英文译法吗？",

      /* 提示 */
      saveDone: "已保存 ✓",
      needTranslation: "尚未生成译文，无法保存。",
      exportNoText: "暂无译文可导出，请先翻译。",
      fileReadFail: "文件读取失败，请重试。",
      wordNotLoaded: "Word 解析组件未加载，请刷新页面后重试。",
      wordNoText: "未能从该 Word 文档中提取到文本。",
      wordParseFail: "Word 解析失败：{err}",
      fileTypeUnsupported: "仅支持 .txt 或 .docx 文档（老式 .doc 请先在 Word 里另存为 .docx）。",
      historyMissing: "记录不存在，可能已被清空。",
      confirmClearHistory: "确定清空全部历史记录？此操作不可撤销。",
      importOk: "导入成功",
      importFail: "导入失败：{err}",
      langLabel: "EN",

      /* profile 页 */
      profileTitle: "我的写作画像",
      profileSub: "基于你翻译过的稿件与改稿对话，自动生成的撰稿风格画像。",
      profileTotalCap: "累计稿件",
      profileExport: "导出画像 (.json)",
      profileImport: "导入画像",
      profileClear: "清空数据",
      profileStylePanel: "写作风格画像",
      profileStyleSub: "AI 生成的风格摘要（无 AI 时为前端即时归纳）。",
      profileDomainPanel: "领域占比",
      profileDomainSub: "你常写的内容领域（写什么）。",
      profileGenrePanel: "体裁占比",
      profileGenreSub: "你常采用的新闻体裁。",
      profileStyleDimPanel: "写作风格维度",
      profileStyleDimSub: "各维度最常出现的倾向（怎么写，画像核心）。",
      profilePrefPanel: "我的习惯偏好",
      profilePrefSub: "这些偏好会注入 AI 改稿，让译文贴合你的风格（可在工具页「设置」里修改）。",
      prefLabelAudience: "目标读者",
      prefLabelTone: "语气偏好",
      prefLabelAnnotate: "文化词注释",
      prefLabelDomestication: "文化处理倾向",
      prefLabelTerms: "已确认术语",
      prefLabelRules: "已提取规则",
      profileDisabled: "已关闭",
      profileDisabledRow: "用户画像已关闭",
      profileDisabledSummary: "用户画像已在设置中关闭，不再累积或读取任何统计数据。",
      profileNoData: "暂无数据",
      profileEmptySummary: "暂无数据——先去翻译几篇文章，画像会自动生成。",
      profileTotalX: "{n} 篇",
      profileBarVal: "{count} 篇 · {pct}%",
      profileAnnotateOn: "文化词首见处加注释",
      profileAnnotateOff: "尽量不加注释",
      profileDomesticationOn: "归化（贴近英语读者）",
      profileDomesticationOff: "异化（保留源语色彩）",
      profileTerms: "{n} 组术语",
      profileRules: "{n} 条规则",
      profileExportName: "桥见巴渝-画像.json",
      profileConfirmClear: "确定清空所有画像与历史数据？此操作不可撤销。",

      /* about 页 */
      aboutCta: "立即使用工具 →"
    },

    en: {
      /* chrome */
      navTool: "Use Tool",
      navProfile: "My Profile",
      navAbout: "About",
      brandTag: "AI Editing Assistant",
      brandProfile: "My Profile",
      footerTagline: "Bayu Chinese-English AI Editing Assistant",
      backTool: "Back to Tool",

      /* hero + tabs */
      tabTranslate: "Translate",
      tabCulture: "Culture Search",
      heroKicker: "Bayu Zh→En · Cross-cultural Editing",
      heroTitlePrefix: "Let the world understand ",
      heroTitleEm: "Bayu",
      heroTitleSuffix: " stories",
      heroSub: "Paste Chinese source text, auto-detect Bayu cultural expressions, generate an English translation, and refine any paragraph through dialogue.",
      examplesLabel: "Try an example:",
      caseChongqing: "🌶 Chongqing Jianghu",
      caseFeiyi: "🎭 Bayu Heritage",
      caseLandmark: "🌆 Chongqing Landmarks",

      /* input */
      originPh_zh2en: "Paste your Chinese source text here, e.g.: 重庆是一座建在山上的城市，人称山城，又多雾，故又称雾都。夜幕降临时，洪崖洞的吊脚楼灯火通明……",
      originPh_en2zh: "Paste your English text here, e.g.: Chongqing is a mountain city, nicknamed the Mountain City, and often shrouded in fog, hence the Fog City...",
      dirZh2en: "Zh → En",
      dirEn2zh: "En → Zh",
      modeOneclick: "⚡ One-click",
      modeCollab: "💬 Collab",
      uploadDoc: "📄 Upload",
      analyzeTranslate: "Translate →",
      analyzeCollab: "Collaborate →",
      analyzeCulture: "Search →",
      modeBadgeAI: "AI mode · DeepSeek",
      modeBadgeFallback: "Fallback · Free MT",
      modeBadgeProbing: "Detecting…",

      /* results */
      resultTitle: "Bilingual · Chat Editing",
      leftColTranslate: "Bilingual",
      leftColCulture: "Culture Search",
      saveDraft: "Save",
      exportTxt: "Export .txt",
      legendCultural: "Culture-loaded terms",
      legendMetaphor: "Metaphors",
      legendContext: "Context-dependent",
      chatPanelTitle: "Chat Editing",
      chatSend: "Send",
      chatPh: "e.g.: Translate \"火锅\" as \"hotpot\" and note it's Chongqing spicy...",

      /* stats */
      statRecognized: "Detected {n} cultural expressions",
      statHigh: "High",
      statMid: "Mid",
      statLow: "Low",

      /* settings */
      settingsTitle: "Preferences",
      settingsSub: "These preferences feed into the AI editing \"user profile\" to match your writing habits.",
      setAudience: "Target audience",
      audienceGeneral: "General readers",
      audienceNews: "News readers",
      audienceAcademic: "Academic readers",
      audienceYouth: "Young readers",
      setTone: "Tone",
      toneFaithful: "Faithful",
      toneFluent: "Fluent",
      toneConcise: "Concise",
      setKey: "DeepSeek API Key (self-provided)",
      setKeyPh: "sk-… enter your own key",
      setKeyNote: "Leave empty to disable AI (free machine translation only). The key stays in your browser and is never bundled into exports.",
      setAnnotate: "Add parenthetical notes for culture-loaded terms on first occurrence",
      setDomestication: "Domestication (closer to English readers)",
      setProfile: "Enable user profile (disable to stop collecting/reading your writing data)",
      cancel: "Cancel",
      save: "Save",
      settingsNote: "Note: AI mode requires running run-ai.bat locally (see README).",

      /* history */
      historyTitle: "📜 History",
      historySub: "Saved drafts and chat records. Click \"Open\" to restore the original text, translation and dialogue.",
      clearHistory: "Clear",
      close: "Close",

      /* login */
      loginTitle: "🔒 Password required",
      loginSub: "This tool ships with the author's AI key. Enter the access password to continue.",
      loginPass: "Password",
      loginPh: "Enter the access password",
      loginError: "Wrong password, please retry.",
      loginEnter: "Enter",

      /* chat */
      hintCultureEmpty: "Enter some Bayu-related text, click \"Search\" to detect cultural terms, then ask below.",
      hintCultureFound: "Detected {n} cultural terms. Click \"Ask\" on a card or type a question below.",
      hintCultureNone: "No cultural terms detected. You can still ask anything about Bayu culture below.",
      hintNoTranslate: "Translate an article first, then click a paragraph on the left to edit.",
      hintEditing: "Editing: paragraph {n}",
      hintCollab: "Collab mode: click a paragraph on the left, then tell me how to translate it (e.g. \"Keep the proper noun transliterated\").",
      hintSelect: "Click any paragraph on the left to edit it via dialogue.",
      msgNeedTranslate: "Please translate an article first.",
      msgNeedSelect: "Please click a paragraph on the left to tell me which one to edit.",
      msgEditing: "Editing…",
      msgThinking: "Thinking…",
      msgUpdated: "Updated.",
      msgRewriteFail: "Edit failed: {err}",
      msgAnswering: "Answering…",
      msgLooking: "Looking up…",
      msgNeedCultureInput: "Please enter some text and click \"Search\" first.",
      msgCultureNoReply: "Sorry, I couldn't answer that question.",
      msgCultureFail: "Query failed: {err}",
      msgFallbackGuide: "You are in \"Fallback mode\" (free MT + dictionary detection); dialogue editing needs AI.\n\nRun run-ai.bat locally, then refresh the page.",
      msgYou: "You",
      msgAssistant: "Assistant",

      /* render */
      segTranslating: "Translating…",
      segFailed: "Translation failed, retry",
      segEditing: "Editing",
      risk: "risk",

      /* culture */
      cultureEmpty: "No cultural terms detected.<br>Try another Bayu-related passage, or ask a question in the chat on the right.",
      cultureAskBtn: "Ask \"{term}\"",
      cultureAskPre: "What does \"{term}\" mean? Can you explain its cultural background and suggest an English translation?",

      /* misc */
      saveDone: "Saved ✓",
      needTranslation: "No translation generated yet.",
      exportNoText: "No translation to export yet.",
      fileReadFail: "File read failed, retry.",
      wordNotLoaded: "Word parser not loaded, refresh and retry.",
      wordNoText: "Could not extract text from this Word document.",
      wordParseFail: "Word parsing failed: {err}",
      fileTypeUnsupported: "Only .txt or .docx are supported (save legacy .doc as .docx first).",
      historyMissing: "Record not found, may have been cleared.",
      confirmClearHistory: "Clear all history? This cannot be undone.",
      importOk: "Imported",
      importFail: "Import failed: {err}",
      langLabel: "中",

      /* profile */
      profileTitle: "My Writing Profile",
      profileSub: "An auto-generated writing-style profile based on the drafts you've translated and your editing chats.",
      profileTotalCap: "Total drafts",
      profileExport: "Export profile (.json)",
      profileImport: "Import profile",
      profileClear: "Clear data",
      profileStylePanel: "Writing Style Profile",
      profileStyleSub: "AI-generated style summary (instant front-end summary when no AI).",
      profileDomainPanel: "Domains",
      profileDomainSub: "The content domains you write about (what).",
      profileGenrePanel: "Genres",
      profileGenreSub: "The journalistic genres you commonly use.",
      profileStyleDimPanel: "Style Dimensions",
      profileStyleDimSub: "The most frequent tendency per dimension (how you write — the core of the profile).",
      profilePrefPanel: "My Preferences",
      profilePrefSub: "These preferences feed AI editing to match your style (editable in the tool's Settings).",
      prefLabelAudience: "Target audience",
      prefLabelTone: "Tone",
      prefLabelAnnotate: "Culture notes",
      prefLabelDomestication: "Culture handling",
      prefLabelTerms: "Confirmed terms",
      prefLabelRules: "Extracted rules",
      profileDisabled: "Disabled",
      profileDisabledRow: "Profile disabled",
      profileDisabledSummary: "The user profile is disabled in Settings; no statistics are collected or read.",
      profileNoData: "No data yet",
      profileEmptySummary: "No data yet — translate a few articles and the profile will generate automatically.",
      profileTotalX: "{n} drafts",
      profileBarVal: "{count} drafts · {pct}%",
      profileAnnotateOn: "Add notes at first occurrence",
      profileAnnotateOff: "Minimize notes",
      profileDomesticationOn: "Domestication (closer to English readers)",
      profileDomesticationOff: "Foreignization (keep source flavor)",
      profileTerms: "{n} terms",
      profileRules: "{n} rules",
      profileExportName: "bayu-profile.json",
      profileConfirmClear: "Clear all profile and history data? This cannot be undone.",

      /* about */
      aboutCta: "Use the tool →"
    }
  };

  var lang = "zh";
  var onLangChange = null;

  function t(key, vars) {
    var s = (dict[lang] && dict[lang][key]) || dict.zh[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp("\\{" + k + "\\}", "g"), String(vars[k]));
      });
    }
    return s;
  }

  function getLang() { return lang; }

  function setOnLangChange(fn) { onLangChange = fn; }

  function setLang(l) {
    lang = l === "en" ? "en" : "zh";
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";

    // 静态文案：data-i18n → textContent
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    // placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    // title / aria-label
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });

    // 语言切换按钮文字
    var btn = document.getElementById("langBtn");
    if (btn) btn.textContent = t("langLabel");

    // 持久化 uiLang（storage 可能未加载，容错）
    try {
      var s = QJC.storage.loadSettings();
      s.uiLang = lang;
      QJC.storage.saveSettings(s);
    } catch (e) { /* 忽略 */ }

    // 触发动态字符串重渲染
    if (onLangChange) onLangChange(lang);
  }

  return {
    t: t,
    getLang: getLang,
    setLang: setLang,
    setOnLangChange: setOnLangChange
  };
})();
