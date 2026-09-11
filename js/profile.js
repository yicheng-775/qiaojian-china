/* ==========================================================================
   桥见巴渝 · 用户画像层
   三层画像：领域×体裁（写什么）+ 写作风格（怎么写，核心）+ 习惯偏好（元习惯）。
   占比由前端计算（AI 只写文字），并生成注入 prompt 的画像上下文。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.profile = (function () {
  "use strict";

  /* ---------- 累积一篇的分类结果 ---------- */
  function recordClassification(result) {
    if (!result) return;
    if (!QJC.storage.loadSettings().profileEnabled) return; // 画像已关闭：不累积
    var p = QJC.storage.loadProfile();
    var now = Date.now();
    if (result.domain) bump(p.domainStats, result.domain, now);
    if (result.genre) bump(p.genreStats, result.genre, now);
    if (result.styleTags) {
      Object.keys(result.styleTags).forEach(function (dim) {
        var val = result.styleTags[dim];
        if (val && QJC.styleDims[dim]) {
          p.styleStats[dim] = p.styleStats[dim] || {};
          p.styleStats[dim][val] = (p.styleStats[dim][val] || 0) + 1;
        }
      });
    }
    QJC.storage.saveProfile(p);
  }

  function bump(obj, name, ts) {
    obj[name] = obj[name] || { count: 0, last: 0 };
    obj[name].count += 1;
    obj[name].last = ts;
  }

  /* ---------- 占比计算（前端即时，AI 不参与算术） ---------- */
  function ratios(stats) {
    var total = 0;
    Object.keys(stats || {}).forEach(function (k) { total += stats[k].count; });
    if (!total) return [];
    return Object.keys(stats).map(function (k) {
      return { name: k, count: stats[k].count, ratio: stats[k].count / total };
    }).sort(function (a, b) { return b.ratio - a.ratio; });
  }

  function computeRatios() {
    var p = QJC.storage.loadProfile();
    return {
      topDomains: ratios(p.domainStats),
      topGenres: ratios(p.genreStats),
      styleStats: p.styleStats || {}
    };
  }

  /* 总篇数 */
  function totalCount() {
    var r = computeRatios();
    var n = 0;
    r.topDomains.forEach(function (d) { n += d.count; });
    return n;
  }

  /* ---------- 风格画像文字（前端即时版，每个维度取最高频选项） ---------- */
  function styleProfileText() {
    var p = QJC.storage.loadProfile();
    var parts = [];
    Object.keys(QJC.styleDims || {}).forEach(function (dim) {
      var stats = (p.styleStats && p.styleStats[dim]) || {};
      var best = null, bestN = -1;
      Object.keys(stats).forEach(function (val) {
        if (stats[val] > bestN) { bestN = stats[val]; best = val; }
      });
      if (best) parts.push(QJC.styleDims[dim].label + "偏「" + best + "」");
    });
    return parts.join("，");
  }

  /* ---------- 构建注入 prompt 的画像上下文 ---------- */
  function buildProfileContext() {
    var s = QJC.storage.loadSettings();
    // 画像已关闭：仅保留用户手动设置的翻译偏好，不读取任何累积数据
    if (!s.profileEnabled) {
      return {
        topDomains: [], topGenres: [], styleProfile: "",
        preferredTerms: {}, bannedPhrases: [], rules: [],
        prefs: { audience: s.audience, tone: s.tone, annotate: s.annotate, domestication: s.domestication }
      };
    }
    var p = QJC.storage.loadProfile();
    var r = computeRatios();
    return {
      topDomains: r.topDomains.slice(0, 3).map(function (d) { return d.name; }),
      topGenres: r.topGenres.slice(0, 3).map(function (g) { return g.name; }),
      styleProfile: (p.portrait && p.portrait.styleSummary) || styleProfileText(),
      preferredTerms: (p.extractedPrefs && p.extractedPrefs.preferredTerms) || {},
      bannedPhrases: (p.extractedPrefs && p.extractedPrefs.bannedPhrases) || [],
      rules: (p.extractedPrefs && p.extractedPrefs.rules) || [],
      prefs: {
        audience: s.audience,
        tone: s.tone,
        annotate: s.annotate,
        domestication: s.domestication
      }
    };
  }

  /* ---------- 应用 AI 生成的画像文字 ---------- */
  function applyPortraitResult(obj) {
    if (!obj) return;
    var p = QJC.storage.loadProfile();
    p.portrait = p.portrait || {};
    p.portrait.styleSummary = obj.styleSummary || p.portrait.styleSummary || "";
    p.portrait.updatedAt = Date.now();
    if (obj.suggestedRules && obj.suggestedRules.length) {
      p.extractedPrefs.rules = obj.suggestedRules.map(function (r) { return r.rule; });
    }
    QJC.storage.saveProfile(p);
  }

  /* ---------- 从对话提取偏好（AI） ---------- */
  function extractPrefsFromDialogue(history) {
    if (!QJC.storage.loadSettings().profileEnabled) return Promise.resolve(null); // 画像已关闭
    var p = QJC.storage.loadProfile();
    var context = buildProfileContext();
    context.recentDialogue = history.slice(-10);
    return QJC.api.analyzeProfile(context).then(function (obj) {
      if (obj && obj.suggestedRules) {
        p.extractedPrefs.rules = obj.suggestedRules.map(function (r) { return r.rule; });
        QJC.storage.saveProfile(p);
      }
      return obj;
    });
  }

  /* ======================================================================
     画像报告渲染（profile.html 用）
     ====================================================================== */
  function renderReport() {
    var p = QJC.storage.loadProfile();

    // 画像已关闭：显示占位，不读统计数据
    if (!QJC.storage.loadSettings().profileEnabled) {
      var td = QJC.i18n.t;
      setText("profileTotal", td("profileDisabled"));
      setHTML("domainBars", emptyRow(td("profileDisabledRow")));
      setHTML("genreBars", emptyRow(td("profileDisabledRow")));
      setHTML("styleBars", emptyRow(td("profileDisabledRow")));
      setText("portraitSummary", td("profileDisabledSummary"));
      renderPrefs(p);
      setText("prefTerms", td("profileDisabled"));
      setText("prefRules", td("profileDisabled"));
      return;
    }

    var r = computeRatios();
    var total = totalCount();

    setText("profileTotal", QJC.i18n.t("profileTotalX", { n: total }));
    setHTML("domainBars", barsHTML(r.topDomains, "domain"));
    setHTML("genreBars", barsHTML(r.topGenres, "genre"));
    setHTML("styleBars", styleBarsHTML(r.styleStats));
    setText("portraitSummary",
      (p.portrait && p.portrait.styleSummary) ||
      (total ? styleProfileText() + "。" : QJC.i18n.t("profileEmptySummary")));
    renderPrefs(p);
  }

  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

  function barsHTML(arr, prefix) {
    if (!arr.length) return emptyRow(QJC.i18n.t("profileNoData"));
    var max = arr[0].count;
    return arr.map(function (item, i) {
      var w = Math.max(4, Math.round(item.ratio * 100));
      return '<div class="bar-row">' +
        '<span class="bar-label">' + esc(item.name) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" data-prefix="' + prefix + i + '" style="width:' + w + '%"></span></span>' +
        '<span class="bar-val">' + QJC.i18n.t("profileBarVal", { count: item.count, pct: Math.round(item.ratio * 100) }) + '</span>' +
      '</div>';
    }).join("");
  }

  function styleBarsHTML(styleStats) {
    var dims = Object.keys(QJC.styleDims || {});
    var rows = dims.map(function (dim) {
      var stats = styleStats[dim] || {};
      var options = QJC.styleDims[dim].options;
      var total = 0;
      options.forEach(function (o) { total += stats[o] || 0; });
      if (!total) return null;
      var maxN = 0;
      options.forEach(function (o) { if ((stats[o] || 0) > maxN) maxN = stats[o] || 0; });
      var opts = options.map(function (o) {
        var n = stats[o] || 0;
        var w = maxN ? Math.max(3, Math.round(n / maxN * 100)) : 0;
        return '<div class="style-opt">' +
          '<span class="style-opt-label">' + esc(o) + '</span>' +
          '<span class="style-opt-track"><span class="style-opt-fill" style="width:' + w + '%"></span></span>' +
          '<span class="style-opt-val">' + n + '</span>' +
        '</div>';
      }).join("");
      return '<div class="style-group">' +
        '<div class="style-group-title">' + esc(QJC.styleDims[dim].label) + '</div>' + opts + '</div>';
    }).filter(Boolean);

    return rows.length ? rows.join("") : emptyRow(QJC.i18n.t("profileNoData"));
  }

  function renderPrefs(p) {
    var s = QJC.storage.loadSettings();
    var t = QJC.i18n.t;
    var toneMap = { faithful: t("toneFaithful"), fluent: t("toneFluent"), concise: t("toneConcise") };
    var audienceMap = { general: t("audienceGeneral"), news: t("audienceNews"), academic: t("audienceAcademic"), youth: t("audienceYouth") };
    setText("prefAudience", audienceMap[s.audience] || s.audience);
    setText("prefTone", toneMap[s.tone] || s.tone);
    setText("prefAnnotate", s.annotate ? t("profileAnnotateOn") : t("profileAnnotateOff"));
    setText("prefDomestication", s.domestication ? t("profileDomesticationOn") : t("profileDomesticationOff"));
    setText("prefTerms", t("profileTerms", { n: Object.keys(p.extractedPrefs.preferredTerms || {}).length }));
    setText("prefRules", t("profileRules", { n: (p.extractedPrefs.rules || []).length }));
  }

  function emptyRow(t) { return '<div class="empty-row">' + t + '</div>'; }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  return {
    recordClassification: recordClassification,
    computeRatios: computeRatios,
    totalCount: totalCount,
    styleProfileText: styleProfileText,
    buildProfileContext: buildProfileContext,
    applyPortraitResult: applyPortraitResult,
    extractPrefsFromDialogue: extractPrefsFromDialogue,
    renderReport: renderReport
  };
})();
