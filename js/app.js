/* ==========================================================================
   桥见中国 · 工具交互逻辑（单页流畅体验）
   打开即用：粘贴/选示例 → 分析 → 诊断/改写/多语种/高亮 四个结果页签。
   纯前端：词典规则匹配 + 预编案例，无外部 API。
   ========================================================================== */
(function () {
  "use strict";

  var FLAG = { "中": "中", "英": "EN", "日": "日", "德": "DE" };
  var CODE_FLAG = { en: "EN", ja: "日", de: "DE" };
  var LEVEL_TAG = { "高": "tag-red", "中": "tag-gold", "低": "tag-green" };

  var state = {
    languages: ["en", "ja", "de"],
    source: "",
    caseId: null,
    matches: [],
    analyzed: false
  };

  var $ = function (id) { return document.getElementById(id); };

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getCaseById(id) {
    for (var i = 0; i < QJC.cases.length; i++) if (QJC.cases[i].id === id) return QJC.cases[i];
    return null;
  }

  /* 词典匹配（按出现顺序，重叠处保留先出现者） */
  function findMatches(text) {
    var matches = [];
    QJC.dictionary.forEach(function (entry) {
      var idx = 0;
      while (true) {
        var pos = text.indexOf(entry.term, idx);
        if (pos === -1) break;
        matches.push({
          start: pos, end: pos + entry.term.length, term: entry.term,
          category: entry.category, level: entry.level, reason: entry.reason,
          suggestions: entry.suggestions.slice(), adopted: 0
        });
        idx = pos + entry.term.length;
      }
    });
    matches.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var filtered = [], lastEnd = -1;
    matches.forEach(function (m) { if (m.start >= lastEnd) { filtered.push(m); lastEnd = m.end; } });
    return filtered;
  }

  /* 长文本按句切分，避免超过免费接口单次长度限制 */
  function splitText(text, maxLen) {
    if (text.length <= maxLen) return [text];
    var sentences = text.match(/[^。！？!?；;]+[。！？!?；;]?/g) || [text];
    var chunks = [], cur = "";
    sentences.forEach(function (s) {
      if ((cur + s).length > maxLen && cur) { chunks.push(cur); cur = s; }
      else { cur += s; }
    });
    if (cur) chunks.push(cur);
    return chunks;
  }

  /* 调用 MyMemory 免费翻译接口（无需密钥，匿名限额约 5000 字/天） */
  function translateText(text, from, to, callback) {
    var chunks = splitText(text, 400);
    var results = [], pending = chunks.length, failed = false;
    chunks.forEach(function (chunk, i) {
      var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(chunk) + "&langpair=" + from + "|" + to;
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            results[i] = data.responseData.translatedText;
          } else { failed = true; results[i] = ""; }
        })
        .catch(function () { failed = true; results[i] = ""; })
        .then(function () {
          pending--;
          if (pending === 0) {
            if (failed) callback(new Error("翻译失败：可能超出免费接口每日限额，或网络异常"));
            else callback(null, results.join(""));
          }
        });
    });
  }

  /* ---------- 语言选择 ---------- */
  function renderLangChips() {
    var html = "";
    QJC.languages.forEach(function (lg) {
      var on = state.languages.indexOf(lg.code) !== -1;
      html += '<div class="lang-chip' + (on ? " on" : "") + '" data-code="' + lg.code + '">' +
        '<span class="ck">' + (on ? "✓" : "") + '</span>' + lg.label + '</div>';
    });
    $("langChips").innerHTML = html;
  }

  /* ---------- 分析 ---------- */
  function analyze() {
    var text = $("originText").value.trim();
    if (!text) {
      $("originText").focus();
      $("originText").style.borderColor = "var(--cinnabar)";
      setTimeout(function () { $("originText").style.borderColor = ""; }, 1200);
      return;
    }
    state.source = text;
    state.matches = findMatches(text);
    state.analyzed = true;

    renderStats();
    renderDiag();
    renderSug();
    renderLang();
    renderText();

    $("results").hidden = false;
    switchTab("diag");
    $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderStats() {
    var n = state.matches.length;
    var high = 0, mid = 0, low = 0;
    state.matches.forEach(function (m) {
      if (m.level === "高") high++; else if (m.level === "中") mid++; else low++;
    });
    var html = '<span class="rs-pill">识别 <b>' + n + '</b> 处</span>';
    if (high) html += '<span class="rs-pill" style="color:var(--risk-high)">高风险 <b>' + high + '</b></span>';
    if (mid) html += '<span class="rs-pill" style="color:var(--risk-mid)">中风险 <b>' + mid + '</b></span>';
    if (low) html += '<span class="rs-pill" style="color:var(--risk-low)">低风险 <b>' + low + '</b></span>';
    $("resultStats").innerHTML = html;
  }

  /* ---------- 诊断报告 ---------- */
  function renderDiag() {
    var el = $("panel-diag");
    if (!state.matches.length) { el.innerHTML = emptyMsg("未识别到文化敏感点，换个文本或试试示例。"); return; }
    var html = "";
    state.matches.forEach(function (m, i) {
      html += '<div class="diag-item ' + m.level + '" data-idx="' + i + '">' +
        '<div class="diag-top">' +
          '<span class="diag-term">「' + escapeHtml(m.term) + '」</span>' +
          '<span class="tag tag-gray">' + QJC.categoryNames[m.category] + '</span>' +
          '<span class="tag ' + LEVEL_TAG[m.level] + '"><span class="dot dot-' + m.level + '" style="display:inline-block;margin-right:5px;"></span>风险 ' + m.level + '</span>' +
        '</div>' +
        '<div class="diag-reason"><b style="color:var(--ink);">成因：</b>' + escapeHtml(m.reason) + '</div>' +
      '</div>';
    });
    el.innerHTML = html;
  }

  /* ---------- 改写建议 ---------- */
  function renderSug() {
    var el = $("panel-sug");
    if (!state.matches.length) { el.innerHTML = emptyMsg("暂无可处理的敏感点。"); return; }
    var html = "";
    state.matches.forEach(function (m, i) {
      var opts = m.suggestions.map(function (s, si) {
        var adopted = m.adopted === si ? " adopted" : "";
        return '<div class="sug-opt' + adopted + '" data-idx="' + i + '" data-si="' + si + '">' +
          '<span class="radio"></span><span class="sug-text">' + escapeHtml(s) + '</span></div>';
      }).join("");
      html += '<div class="sug-item" data-idx="' + i + '">' +
        '<div class="sug-head">' +
          '<span style="font-family:var(--font-serif);font-size:17px;font-weight:700;">「' + escapeHtml(m.term) + '」</span>' +
          '<span class="tag ' + LEVEL_TAG[m.level] + '">风险 ' + m.level + '</span>' +
        '</div>' +
        '<div class="sug-options">' + opts + '</div>' +
        '<textarea class="edit-box" data-idx="' + i + '" rows="2" placeholder="采纳建议后，可在此手动调整最终表述……"></textarea>' +
      '</div>';
    });
    el.innerHTML = html;

    el.querySelectorAll(".sug-opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        var idx = parseInt(opt.getAttribute("data-idx"), 10);
        var si = parseInt(opt.getAttribute("data-si"), 10);
        state.matches[idx].adopted = si;
        renderSug();
        var edit = el.querySelector('.edit-box[data-idx="' + idx + '"]');
        if (edit) edit.value = state.matches[idx].customText || state.matches[idx].suggestions[si];
      });
    });
    el.querySelectorAll(".edit-box").forEach(function (box) {
      box.addEventListener("input", function () {
        var idx = parseInt(box.getAttribute("data-idx"), 10);
        state.matches[idx].customText = box.value;
      });
    });
  }

  /* ---------- 多语种输出 ---------- */
  function renderLang() {
    var el = $("panel-lang");
    var c = state.caseId ? getCaseById(state.caseId) : null;
    if (c) {
      var html = '<div class="lang-grid">';
      var codeMap = { "英": "en", "日": "ja", "德": "de" };
      c.targets.forEach(function (t) {
        var show = t.lang === "中" || state.languages.indexOf(codeMap[t.lang]) !== -1;
        if (!show) return;
        html += '<div class="lang-panel">' +
          '<div class="lp-head"><span class="lp-lang"><span class="lp-flag">' + (FLAG[t.lang] || t.lang) + '</span>' + t.langFull + '</span>' +
          '<span class="tag tag-gray">' + t.lang + '</span></div>' +
          '<div class="lp-body">' + escapeHtml(t.text) + '</div>' +
          '<div class="lp-strategy"><b>文化处理策略：</b>' + escapeHtml(t.strategy) + '</div>' +
        '</div>';
      });
      html += "</div>";
      el.innerHTML = html;
    } else {
      var h = '<div class="hint-box" style="margin-bottom:18px;">以下译文由通用机器翻译生成，<b>未做文化适配</b>；请结合「改写建议」页签，手动调整被高亮的文化敏感处。</div>';
      h += '<div class="lang-grid">';
      h += '<div class="lang-panel"><div class="lp-head"><span class="lp-lang"><span class="lp-flag">中</span>中文（原稿）</span></div>' +
        '<div class="lp-body">' + escapeHtml(state.source) + '</div></div>';
      var targets = QJC.languages.filter(function (lg) { return state.languages.indexOf(lg.code) !== -1; });
      targets.forEach(function (lg) {
        h += '<div class="lang-panel" id="lang-panel-' + lg.code + '">' +
          '<div class="lp-head"><span class="lp-lang"><span class="lp-flag">' + CODE_FLAG[lg.code] + '</span>' + lg.full + '</span>' +
          '<span class="tag tag-gray">机翻</span></div>' +
          '<div class="lp-body" style="color:var(--ink-faint);">翻译中…</div></div>';
      });
      if (state.matches.length) {
        h += '<div class="lang-panel"><div class="lp-head"><span class="lp-lang">适配改写策略</span><span class="tag tag-red">' + state.matches.length + ' 处</span></div>' +
          '<div class="lp-body" style="font-size:14px;">' +
          state.matches.map(function (m) {
            return '<p style="margin-bottom:14px;"><b>「' + escapeHtml(m.term) + '」</b>（' + QJC.categoryNames[m.category] + '，风险' + m.level + '）<br>' +
              '<span style="color:var(--ink-soft);">' + escapeHtml(m.suggestions[0] || m.reason) + '</span></p>';
          }).join("") + '</div></div>';
      }
      h += "</div>";
      el.innerHTML = h;

      // 异步调用免费翻译接口
      targets.forEach(function (lg) {
        translateText(state.source, "zh-CN", lg.code, function (err, translated) {
          var panel = document.getElementById("lang-panel-" + lg.code);
          if (!panel) return;
          var body = panel.querySelector(".lp-body");
          if (err) {
            body.innerHTML = '<span style="color:var(--cinnabar);">' + escapeHtml(err.message) + '</span>';
          } else {
            body.style.color = "var(--ink)";
            body.textContent = translated;
          }
        });
      });
    }
  }

  /* ---------- 原文高亮 ---------- */
  function renderText() {
    var el = $("panel-text");
    if (!state.source) { el.innerHTML = ""; return; }
    var html = "", lastIdx = 0;
    state.matches.forEach(function (m, i) {
      html += escapeHtml(state.source.slice(lastIdx, m.start));
      html += '<mark class="hl ' + m.category + '" data-idx="' + i + '">' + escapeHtml(m.term) + '</mark>';
      lastIdx = m.end;
    });
    html += escapeHtml(state.source.slice(lastIdx));
    el.innerHTML = '<div class="text-stage"><div class="parsed">' + html + '</div></div>' +
      '<ul class="legend">' +
        '<li><span class="sw sw-cultural"></span>文化负载词</li>' +
        '<li><span class="sw sw-metaphor"></span>隐喻意象</li>' +
        '<li><span class="sw sw-context"></span>强语境依赖表达</li>' +
      '</ul>';
    el.querySelectorAll("mark.hl").forEach(function (mk) {
      mk.addEventListener("click", function () {
        var idx = parseInt(mk.getAttribute("data-idx"), 10);
        switchTab("diag");
        var items = document.querySelectorAll(".diag-item");
        if (items[idx]) {
          items[idx].scrollIntoView({ behavior: "smooth", block: "center" });
          items[idx].style.boxShadow = "0 0 0 4px rgba(194,64,42,.35)";
          setTimeout(function () { items[idx].style.boxShadow = ""; }, 900);
        }
      });
    });
  }

  function emptyMsg(t) {
    return '<div class="hint-box">' + t + '</div>';
  }

  /* ---------- 页签切换 ---------- */
  function switchTab(name) {
    document.querySelectorAll("#tabs .tab").forEach(function (tb) {
      tb.classList.toggle("active", tb.getAttribute("data-tab") === name);
    });
    ["diag", "sug", "lang", "text"].forEach(function (n) {
      $("panel-" + n).classList.toggle("active", n === name);
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    renderLangChips();

    $("langChips").addEventListener("click", function (e) {
      var chip = e.target.closest(".lang-chip");
      if (!chip) return;
      var code = chip.getAttribute("data-code");
      var i = state.languages.indexOf(code);
      if (i === -1) state.languages.push(code);
      else if (state.languages.length > 1) state.languages.splice(i, 1);
      renderLangChips();
      if (state.analyzed) renderLang();
    });

    document.querySelectorAll(".examples .chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var c = getCaseById(chip.getAttribute("data-case"));
        if (!c) return;
        state.caseId = c.id;
        $("originText").value = c.source;
        $("originText").focus();
      });
    });

    $("analyzeBtn").addEventListener("click", analyze);

    document.querySelectorAll("#tabs .tab").forEach(function (tb) {
      tb.addEventListener("click", function () { switchTab(tb.getAttribute("data-tab")); });
    });

    // 支持 Ctrl/Cmd + Enter 快捷分析
    $("originText").addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
