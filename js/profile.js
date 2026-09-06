/* ==========================================================================
   桥见川渝 · 用户画像层
   三层画像：领域×体裁（写什么）+ 写作风格（怎么写，核心）+ 习惯偏好（元习惯）。
   占比由前端计算（AI 只写文字），并生成注入 prompt 的画像上下文。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.profile = (function () {
  "use strict";

  /* ---------- 累积一篇的分类结果 ---------- */
  function recordClassification(result) {
    if (!result) return;
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
    var p = QJC.storage.loadProfile();
    var s = QJC.storage.loadSettings();
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
    var r = computeRatios();
    var p = QJC.storage.loadProfile();
    var total = totalCount();

    setText("profileTotal", total + " 篇");
    setHTML("domainBars", barsHTML(r.topDomains, "domain"));
    setHTML("genreBars", barsHTML(r.topGenres, "genre"));
    setHTML("styleBars", styleBarsHTML(r.styleStats));
    setText("portraitSummary",
      (p.portrait && p.portrait.styleSummary) ||
      (total ? styleProfileText() + "。" : "暂无数据——先去翻译几篇文章，画像会自动生成。"));
    renderPrefs(p);
  }

  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

  function barsHTML(arr, prefix) {
    if (!arr.length) return emptyRow("暂无数据");
    var max = arr[0].count;
    return arr.map(function (item, i) {
      var w = Math.max(4, Math.round(item.ratio * 100));
      return '<div class="bar-row">' +
        '<span class="bar-label">' + esc(item.name) + '</span>' +
        '<span class="bar-track"><span class="bar-fill" data-prefix="' + prefix + i + '" style="width:' + w + '%"></span></span>' +
        '<span class="bar-val">' + item.count + ' 篇 · ' + Math.round(item.ratio * 100) + '%</span>' +
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

    return rows.length ? rows.join("") : emptyRow("暂无数据");
  }

  function renderPrefs(p) {
    var s = QJC.storage.loadSettings();
    var toneMap = { faithful: "忠实原文", fluent: "流畅归化", concise: "精简" };
    var audienceMap = { general: "通用读者", news: "新闻读者", academic: "学术读者", youth: "年轻读者" };
    setText("prefAudience", audienceMap[s.audience] || s.audience);
    setText("prefTone", toneMap[s.tone] || s.tone);
    setText("prefAnnotate", s.annotate ? "文化词首见处加注释" : "尽量不加注释");
    setText("prefDomestication", s.domestication ? "归化（贴近英语读者）" : "异化（保留源语色彩）");
    setText("prefTerms", Object.keys(p.extractedPrefs.preferredTerms || {}).length + " 组术语");
    setText("prefRules", (p.extractedPrefs.rules || []).length + " 条规则");
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
