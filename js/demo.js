/* ==========================================================================
   桥见中国 · 工具演示交互逻辑
   纯前端：词典规则匹配 + 预编案例，无外部 API。
   ========================================================================== */
(function () {
  "use strict";

  var STEPS = [
    { n: 1, lbl: "项目设置" },
    { n: 2, lbl: "原稿解析" },
    { n: 3, lbl: "诊断报告" },
    { n: 4, lbl: "改写建议" },
    { n: 5, lbl: "多语种输出" }
  ];

  var state = {
    languages: ["en", "ja", "de"],   // 选中的目标语言 code
    source: "",                      // 原稿文本
    caseId: null,                    // 内置案例 id
    matches: [],                     // 识别到的敏感点
    parsed: false                    // 是否已解析
  };

  var FLAG = { "中": "中", "英": "EN", "日": "日", "德": "DE" };
  var LEVEL_TAG = { "高": "tag-red", "中": "tag-gold", "低": "tag-green" };

  /* ---------- DOM 引用 ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var originText = $("originText");

  /* ---------- 工具函数 ---------- */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getCaseById(id) {
    for (var i = 0; i < QJC.cases.length; i++) {
      if (QJC.cases[i].id === id) return QJC.cases[i];
    }
    return null;
  }

  /* ---------- 词典匹配（处理重叠，保留先出现者） ---------- */
  function findMatches(text) {
    var matches = [];
    QJC.dictionary.forEach(function (entry) {
      var idx = 0;
      while (true) {
        var pos = text.indexOf(entry.term, idx);
        if (pos === -1) break;
        matches.push({
          start: pos,
          end: pos + entry.term.length,
          term: entry.term,
          category: entry.category,
          level: entry.level,
          reason: entry.reason,
          suggestions: entry.suggestions.slice(),
          adopted: 0
        });
        idx = pos + entry.term.length;
      }
    });
    matches.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var filtered = [], lastEnd = -1;
    matches.forEach(function (m) {
      if (m.start >= lastEnd) { filtered.push(m); lastEnd = m.end; }
    });
    return filtered;
  }

  /* ---------- 步骤指示器 ---------- */
  function renderStepper() {
    var html = "";
    STEPS.forEach(function (s) {
      html += '<div class="step-dot" data-step="' + s.n + '">' +
        '<span class="n">' + s.n + '</span>' +
        '<span class="lbl">' + s.lbl + '</span></div>';
    });
    $("stepper").innerHTML = html;
    $("stepper").addEventListener("click", function (e) {
      var dot = e.target.closest(".step-dot");
      if (dot) goToStep(parseInt(dot.getAttribute("data-step"), 10));
    });
  }

  function updateStepper(cur) {
    var dots = document.querySelectorAll(".step-dot");
    dots.forEach(function (dot) {
      var n = parseInt(dot.getAttribute("data-step"), 10);
      dot.classList.remove("active", "done");
      if (n === cur) dot.classList.add("active");
      else if (n < cur) dot.classList.add("done");
    });
  }

  /* ---------- 语言 chips ---------- */
  function renderLangChips() {
    var html = "";
    QJC.languages.forEach(function (lg) {
      var on = state.languages.indexOf(lg.code) !== -1;
      html += '<div class="lang-chip' + (on ? " on" : "") + '" data-code="' + lg.code + '">' +
        '<span class="ck">' + (on ? "✓" : "") + '</span>' + lg.label + "（" + lg.full + "）</div>";
    });
    $("langChips").innerHTML = html;
    $("langChips").addEventListener("click", function (e) {
      var chip = e.target.closest(".lang-chip");
      if (!chip) return;
      var code = chip.getAttribute("data-code");
      var i = state.languages.indexOf(code);
      if (i === -1) state.languages.push(code);
      else if (state.languages.length > 1) state.languages.splice(i, 1);
      renderLangChips();
    });
  }

  /* ---------- 案例选择 ---------- */
  function renderCasePick() {
    var html = "";
    QJC.cases.forEach(function (c) {
      var sel = state.caseId === c.id ? " selected" : "";
      html += '<div class="case-pick-item' + sel + '" data-id="' + c.id + '">' +
        '<div class="cp-txt"><div class="cp-title">' + c.title + '</div>' +
        '<div class="cp-sum">' + c.tag + '</div></div>' +
        '<span class="tag ' + c.tagClass + '">载入</span></div>';
    });
    $("casePick").innerHTML = html;
    $("casePick").addEventListener("click", function (e) {
      var item = e.target.closest(".case-pick-item");
      if (!item) return;
      loadCase(item.getAttribute("data-id"));
    });
  }

  function loadCase(id) {
    var c = getCaseById(id);
    if (!c) return;
    state.caseId = id;
    state.source = c.source;
    originText.value = c.source;
    renderCasePick();
  }

  /* ---------- 解析与渲染 ---------- */
  function parseAndRender() {
    var text = originText.value.trim();
    if (!text) {
      var c = state.caseId ? getCaseById(state.caseId) : null;
      if (c) text = c.source;
      else { alert("请先粘贴中文原稿，或选用右侧内置示范案例。"); return false; }
    }
    state.source = text;
    state.matches = findMatches(text);
    state.parsed = true;

    // 高亮渲染
    var html = "", lastIdx = 0;
    state.matches.forEach(function (m, i) {
      html += escapeHtml(text.slice(lastIdx, m.start));
      html += '<mark class="hl ' + m.category + '" data-idx="' + i + '">' + escapeHtml(m.term) + "</mark>";
      lastIdx = m.end;
    });
    html += escapeHtml(text.slice(lastIdx));
    $("parsedText").innerHTML = html;
    $("statTotal").textContent = state.matches.length;

    // 绑定高亮点击
    document.querySelectorAll("#parsedText mark.hl").forEach(function (mk) {
      mk.addEventListener("click", function () {
        var idx = parseInt(mk.getAttribute("data-idx"), 10);
        goToStep(3);
        flashDiag(idx);
      });
    });

    renderDiag();
    renderSug();
    renderLang();
    return true;
  }

  function flashDiag(idx) {
    var items = document.querySelectorAll(".diag-item");
    if (items[idx]) {
      items[idx].scrollIntoView({ behavior: "smooth", block: "center" });
      items[idx].style.boxShadow = "0 0 0 4px rgba(194,64,42,.35)";
      setTimeout(function () { items[idx].style.boxShadow = ""; }, 900);
    }
  }

  /* ---------- 诊断报告 ---------- */
  function renderDiag() {
    var list = $("diagList");
    if (!state.matches.length) {
      list.innerHTML = '<div class="hint-box" style="margin-top:0;">未在文本中识别到文化敏感点。可返回上一步选用内置示范案例查看完整流程。</div>';
      return;
    }
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
    list.innerHTML = html;
  }

  /* ---------- 改写建议 ---------- */
  function renderSug() {
    var list = $("sugList");
    if (!state.matches.length) {
      list.innerHTML = '<div class="hint-box" style="margin-top:0;">暂无可处理的敏感点。返回上一步选用内置案例。</div>';
      return;
    }
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
        '<span class="field-label" style="margin-bottom:6px;">人工编辑（采纳后可自定义修改）</span>' +
        '<textarea class="edit-box" data-idx="' + i + '" rows="2" placeholder="在采纳建议基础上，可在此手动调整最终表述……"></textarea>' +
      '</div>';
    });
    list.innerHTML = html;

    // 方案选择
    list.querySelectorAll(".sug-opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        var idx = parseInt(opt.getAttribute("data-idx"), 10);
        var si = parseInt(opt.getAttribute("data-si"), 10);
        state.matches[idx].adopted = si;
        renderSug();
        // 恢复编辑框内容
        var edit = list.querySelector('.edit-box[data-idx="' + idx + '"]');
        if (edit && state.matches[idx].customText) edit.value = state.matches[idx].customText;
        else if (edit) edit.value = state.matches[idx].suggestions[si];
      });
    });

    // 人工编辑
    list.querySelectorAll(".edit-box").forEach(function (box) {
      box.addEventListener("input", function () {
        var idx = parseInt(box.getAttribute("data-idx"), 10);
        state.matches[idx].customText = box.value;
      });
    });
  }

  /* ---------- 多语种输出 ---------- */
  function renderLang() {
    var out = $("langOutput");
    var c = state.caseId ? getCaseById(state.caseId) : null;
    if (c) {
      var html = '<div class="lang-grid">';
      c.targets.forEach(function (t) {
        var show = t.lang === "中";
        if (!show) {
          var codeMap = { "英": "en", "日": "ja", "德": "de" };
          show = state.languages.indexOf(codeMap[t.lang]) !== -1;
        }
        if (!show) return;
        html += '<div class="lang-panel">' +
          '<div class="lp-head"><span class="lp-lang"><span class="lp-flag">' + (FLAG[t.lang] || t.lang) + '</span>' + t.langFull + '</span>' +
          '<span class="tag tag-gray">' + t.lang + '</span></div>' +
          '<div class="lp-body">' + escapeHtml(t.text) + '</div>' +
          '<div class="lp-strategy"><b>文化处理策略：</b>' + escapeHtml(t.strategy) + '</div>' +
        '</div>';
      });
      html += "</div>";
      out.innerHTML = html;
    } else {
      // 自定义文本：无法真正生成译文，展示识别结果与建议策略
      var h = '<div class="hint-box" style="margin-bottom:18px;">当前为自定义文本，完整译文需接入 AI 翻译 API（原型暂未接入）。以下为基于词典规则识别到的敏感点及其建议文化处理策略。</div>';
      h += '<div class="lang-grid">';
      h += '<div class="lang-panel"><div class="lp-head"><span class="lp-lang"><span class="lp-flag">中</span>中文（原稿）</span></div>' +
        '<div class="lp-body">' + escapeHtml(state.source) + '</div></div>';
      if (state.matches.length) {
        h += '<div class="lang-panel"><div class="lp-head"><span class="lp-lang">适配改写策略建议</span><span class="tag tag-red">' + state.matches.length + ' 处</span></div>' +
          '<div class="lp-body" style="font-size:14px;">' +
          state.matches.map(function (m) {
            return '<p style="margin-bottom:14px;"><b>「' + escapeHtml(m.term) + '」</b>（' + QJC.categoryNames[m.category] + '，风险' + m.level + '）<br>' +
              '<span style="color:var(--ink-soft);">' + escapeHtml(m.suggestions[0] || m.reason) + '</span></p>';
          }).join("") +
          '</div></div>';
      }
      h += "</div>";
      out.innerHTML = h;
    }
  }

  /* ---------- 步骤切换 ---------- */
  function showStep(n) {
    STEPS.forEach(function (s) {
      var p = $("step-" + s.n);
      if (p) p.classList.toggle("active", s.n === n);
    });
    $("prevBtn").style.visibility = n === 1 ? "hidden" : "visible";
    $("nextBtn").innerHTML = n === 5 ? "完成 · 返回首页" : "下一步 →";
    updateStepper(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(n) {
    if (n < 1 || n > 5) return;
    if (n > 1 && !state.parsed) {
      if (!parseAndRender()) return;
    }
    if (n >= 2 && state.parsed) { /* 已解析 */ }
    showStep(n);
  }

  /* ---------- 上下步按钮 ---------- */
  var curStep = 1;
  function nav(delta) {
    var next = curStep + delta;
    if (next < 1 || next > 5) return;
    curStep = next;
    goToStep(curStep);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    renderStepper();
    renderLangChips();
    renderCasePick();

    // URL 参数自动载入案例
    var params = new URLSearchParams(window.location.search);
    var caseParam = params.get("case");
    if (caseParam && getCaseById(caseParam)) {
      loadCase(caseParam);
    }

    $("nextBtn").addEventListener("click", function () {
      if (curStep === 5) { window.location.href = "index.html"; return; }
      nav(1);
    });
    $("prevBtn").addEventListener("click", function () { nav(-1); });
    showStep(1);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
