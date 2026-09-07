/* ==========================================================================
   桥见川渝 · Prompt 层
   四套 DeepSeek system prompt（翻译 / 改稿 / 分类 / 画像）。
   均要求输出 JSON；术语表与用户偏好档案在此拼装注入。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.prompts = (function () {
  "use strict";

  /* ---------- 术语表文本（从 QJC.coreGlossary 生成） ---------- */
  function glossaryText() {
    var lines = [];
    Object.keys(QJC.coreGlossary || {}).forEach(function (term) {
      var g = QJC.coreGlossary[term];
      lines.push("「" + term + "」→ " + g.en + "（" + g.region + "）");
    });
    return lines.join("\n");
  }

  /* ---------- 用户偏好档案文本（从 profileContext 生成） ---------- */
  function prefsText(profileContext) {
    if (!profileContext) return "";
    var parts = [];
    if (profileContext.topDomains && profileContext.topDomains.length) {
      parts.push("主攻领域：" + profileContext.topDomains.join("、"));
    }
    if (profileContext.styleProfile) {
      parts.push("写作风格倾向：" + profileContext.styleProfile);
    }
    if (profileContext.preferredTerms && Object.keys(profileContext.preferredTerms).length) {
      parts.push("已确认术语：" + Object.keys(profileContext.preferredTerms).map(function (t) {
        return "「" + t + "」→ " + profileContext.preferredTerms[t];
      }).join("；"));
    }
    if (profileContext.bannedPhrases && profileContext.bannedPhrases.length) {
      parts.push("禁用译法：" + profileContext.bannedPhrases.join("、"));
    }
    if (profileContext.rules && profileContext.rules.length) {
      parts.push("行为规则：" + profileContext.rules.join("；"));
    }
    if (profileContext.prefs) {
      var toneMap = { faithful: "忠实原文", fluent: "流畅归化", concise: "精简" };
      if (profileContext.prefs.tone) parts.push("语气偏好：" + (toneMap[profileContext.prefs.tone] || profileContext.prefs.tone));
      if (profileContext.prefs.annotate != null) parts.push("文化词注释偏好：" + (profileContext.prefs.annotate ? "首见处加括号注释" : "尽量不加注释"));
      if (profileContext.prefs.domestication != null) parts.push("文化处理倾向：" + (profileContext.prefs.domestication ? "归化（贴近英语读者）" : "异化（保留源语色彩）"));
    }
    return parts.length ? parts.join("\n") : "";
  }

  function baseIdentity() {
    return "你是「桥见川渝」资深中英跨文化编辑，专长四川 + 重庆（巴蜀）文化对外传播，熟悉新闻稿件与特写的写作。";
  }

  /* ======================================================================
     1. 翻译 prompt
     ====================================================================== */
  function translate(segments, profileContext, dictHints) {
    var system =
      baseIdentity() +
      "\n任务：把给定的中文段落逐段翻译成英文，并针对「文化折扣」做适配改写。" +
      "\n\n铁律：" +
      "\n1. 忠实原意，但优先让英语读者「读懂」：文化负载词在首次出现处增译背景或加括号注释。" +
      "\n2. 川渝特色词按以下术语表处理（可扩展）：\n" + glossaryText() +
      "\n3. 保留原文节奏与画面感；新闻导语保持新闻语体；不做价值判断、不夹带政治立场。" +
      "\n4. 严格遵守「用户偏好档案」。" +
      "\n\n[用户偏好档案]\n" + (prefsText(profileContext) || "（无，按通用跨文化编辑标准处理）") +
      "\n\n输出（严格 JSON，无多余文字）：\n{\"paragraphs\":[{\"id\":\"p1\",\"translation\":\"...\"}]}" +
      "\n段落 id 必须与输入一一对应，不得增删。" +
      "\n\n请只输出 JSON，不要包含任何解释或 Markdown 代码块标记。";

    var user = "中文段落如下：\n" + segments.map(function (s) {
      return "[" + s.id + "] " + s.source;
    }).join("\n");

    if (dictHints && dictHints.length) {
      user += "\n\n【词典参考建议】（供术语处理参考，不一定照搬）：\n" + dictHints.map(function (h) {
        return "「" + h.term + "」：" + (h.suggestions && h.suggestions[0] ? h.suggestions[0] : h.reason);
      }).join("\n");
    }
    return { system: system, user: user };
  }

  /* ======================================================================
     2. 改稿对话 prompt
     ====================================================================== */
  function rewrite(payload) {
    var system =
      baseIdentity() +
      "\n任务：你正与创作者一起修改一篇中译英稿件。上下文含整篇中英对照（每段有 id）、用户当前选中的段落、以及最新指令。" +
      "\n\n规则：" +
      "\n1. 默认只修改用户选中的段落；除非用户明确说「全文/全部/所有段落」，才可返回多段。" +
      "\n2. 修改后务必用「中文」回复（1–3 句），像资深编辑和作者商量：先说明打算怎么改、为什么（针对文化折扣），语气亲切自然。" +
      "\n3. 术语必须与用户已确认的译法一致（术语表 + 偏好档案）。" +
      "\n4. 不改原文语义，只做翻译与跨文化适配。" +
      "\n\n术语表：\n" + glossaryText() +
      "\n\n[用户偏好档案]\n" + (prefsText(payload.profileContext) || "（无）") +
      "\n\n输出（严格 JSON，无多余文字）：\n{\"updatedParagraphs\":[{\"id\":\"p3\",\"translation\":\"新译文\"}],\"reply\":\"中文解释\"}" +
      "\n\n请只输出 JSON，不要包含任何解释或 Markdown 代码块标记。";

    // 只传选中段（默认改稿只改选中段，缩短 prompt、加快生成）
    var selectedIds = payload.selectedIds || [];
    var segs = selectedIds.length
      ? payload.segments.filter(function (s) { return selectedIds.indexOf(s.id) !== -1; })
      : payload.segments;

    var user = "中英对照（待改段）：\n" + segs.map(function (s) {
      return "[" + s.id + "] 中：" + s.source + "\n[" + s.id + "] 英：" + (s.translation || "（未翻译）");
    }).join("\n");

    user += "\n\n当前选中段落：" + selectedIds.join("、");
    user += "\n最新指令：" + payload.message;

    if (payload.history && payload.history.length) {
      var recent = payload.history.slice(-6); // 只保留最近 3 轮，控制长度
      user += "\n\n本文此前对话（最近几轮）：\n" + recent.map(function (m) {
        return (m.role === "user" ? "用户" : "助手") + "：" + m.content;
      }).join("\n");
    }
    return { system: system, user: user };
  }

  /* ======================================================================
     3. 领域 / 体裁 / 写作风格 分类 prompt
     ====================================================================== */
  function classify(source) {
    var system =
      baseIdentity() +
      "\n任务：给定一篇中文文章，判断其领域、体裁，并标注写作风格标签。" +
      "\n\n领域候选（单选）：" + (QJC.domains || []).join("/") +
      "\n体裁候选（单选）：" + (QJC.genres || []).join("/") +
      "\n写作风格维度（每个维度从候选中选 1 个）：" +
      "\n- 语体 register：正式书面/半正式/口语轻松" +
      "\n- 情感基调 sentiment：克制客观/温情感性/热情激昂" +
      "\n- 句式节奏 syntax：短句白描/长句铺陈/排比对仗/文白夹杂" +
      "\n- 修辞手法 rhetoric：善用比喻/引用用典/白描直叙/设问反问" +
      "\n- 成语四字格密度 idiom：高/中/低" +
      "\n- 口语方言化 colloquial：高/中/低" +
      "\n- 叙事视角 perspective：第一人称亲历/第三人称客观/夹叙夹议" +
      "\n- 结构组织 structure：开门见山/层层递进/小标题分段" +
      "\n\n输出（严格 JSON，无多余文字）：\n{\"domain\":\"文旅\",\"genre\":\"特写\",\"confidence\":0.9,\"keywords\":[\"火锅\",\"茶馆\"],\"styleTags\":{\"register\":\"半正式\",\"sentiment\":\"温情感性\",\"syntax\":\"短句白描\",\"rhetoric\":\"白描直叙\",\"idiom\":\"低\",\"colloquial\":\"中\",\"perspective\":\"第三人称客观\",\"structure\":\"层层递进\"}}" +
      "\n\n请只输出 JSON，不要包含任何解释或 Markdown 代码块标记。";

    return { system: system, user: "文章如下：\n" + source };
  }

  /* ======================================================================
     4. 画像分析 prompt
     ====================================================================== */
  function profile(profileContext) {
    var system =
      baseIdentity() +
      "\n任务：你是用户画像分析师。给定某创作者累计的领域/体裁统计、写作风格倾向、以及从改稿对话中提取的反馈，生成「写作风格画像」文字摘要与可执行的风格规则。" +
      "\n\n要求：摘要 2–4 句，口语自然，点出该创作者最鲜明的写作风格特征；规则要具体可执行（如「文化词首见处加括号注释」「短句为主，避免欧化长句」）。" +
      "\n\n输出（严格 JSON，无多余文字）：\n{\"styleSummary\":\"...\",\"suggestedRules\":[{\"rule\":\"...\",\"why\":\"...\"}]}" +
      "\n\n请只输出 JSON，不要包含任何解释或 Markdown 代码块标记。";

    var user = "累计画像数据：\n" + JSON.stringify(profileContext, null, 2);
    return { system: system, user: user };
  }

  return {
    translate: translate,
    rewrite: rewrite,
    classify: classify,
    profile: profile,
    glossaryText: glossaryText,
    prefsText: prefsText
  };
})();
