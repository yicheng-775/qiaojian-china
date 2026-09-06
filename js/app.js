/* ==========================================================================
   桥见川渝 · 工具主链路
   打开即用：粘贴 → 分析 → 中英对照 + 对话改稿。
   双模式：AI 模式（本地脚本已启动，DeepSeek）| 兜底模式（词典 + MyMemory）。
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var state = {
    segments: [],       // [{id, source, translation}]
    matches: [],        // 全文词典匹配结果
    selectedIds: [],    // 当前选中的段落 id
    source: "",
    caseId: null,
    analyzed: false,
    lastClassify: null  // 最近一次分类结果 {domain, genre}
  };

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 词典匹配（按出现顺序，重叠处保留先出现者）——复用自原 app.js */
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
          suggestions: entry.suggestions.slice()
        });
        idx = pos + entry.term.length;
      }
    });
    matches.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var filtered = [], lastEnd = -1;
    matches.forEach(function (m) { if (m.start >= lastEnd) { filtered.push(m); lastEnd = m.end; } });
    return filtered;
  }

  /* ---------- 状态徽标 ---------- */
  function renderModeBadge(aiEnabled) {
    var el = $("modeBadge");
    if (!el) return;
    if (aiEnabled) {
      el.textContent = "AI 模式 · DeepSeek";
      el.className = "mode-badge mode-ai";
    } else {
      el.textContent = "兜底模式 · 免费机翻";
      el.className = "mode-badge mode-fallback";
    }
  }

  function renderStats() {
    var n = state.matches.length;
    var high = 0, mid = 0, low = 0;
    state.matches.forEach(function (m) {
      if (m.level === "高") high++; else if (m.level === "中") mid++; else low++;
    });
    var html = '<span class="rs-pill">识别 <b>' + n + '</b> 处文化表达</span>';
    if (high) html += '<span class="rs-pill" style="color:var(--risk-high)">高 <b>' + high + '</b></span>';
    if (mid) html += '<span class="rs-pill" style="color:var(--risk-mid)">中 <b>' + mid + '</b></span>';
    if (low) html += '<span class="rs-pill" style="color:var(--risk-low)">低 <b>' + low + '</b></span>';
    if (state.lastClassify) {
      html += '<span class="rs-pill rs-tag">' + escapeHtml(state.lastClassify.domain + " · " + state.lastClassify.genre) + '</span>';
    }
    $("resultStats").innerHTML = html;
  }

  /* ---------- 主流程：分析 ---------- */
  function analyze() {
    var text = $("originText").value.trim();
    if (!text) {
      $("originText").focus();
      $("originText").style.borderColor = "var(--cinnabar)";
      setTimeout(function () { $("originText").style.borderColor = ""; }, 1200);
      return;
    }

    state.source = text;
    state.segments = QJC.segments.splitSegments(text);
    state.matches = findMatches(text);
    state.selectedIds = [];
    state.lastClassify = null;
    state.analyzed = true;

    QJC.chat.reset();
    $("workspace").hidden = false;
    $("results").hidden = false;
    $("saveBtn").hidden = false;
    renderStats();
    QJC.render.renderCompare(state, $("compareView"));
    $("workspace").scrollIntoView({ behavior: "smooth", block: "start" });

    var dictHints = state.matches.map(function (m) {
      return { term: m.term, suggestions: m.suggestions, reason: m.reason };
    });
    var profileContext = QJC.profile.buildProfileContext();

    QJC.api.translate(state.segments, profileContext, dictHints)
      .then(function () {
        QJC.render.renderCompare(state, $("compareView"));
        // AI 模式：并行分类，累积画像
        if (QJC.api.isAI()) {
          QJC.api.classify(state.source).then(function (result) {
            state.lastClassify = result;
            QJC.profile.recordClassification(result);
            renderStats();
          }).catch(function () { /* 分类失败不阻塞 */ });
        }
      })
      .catch(function (err) {
        QJC.render.renderCompare(state, $("compareView"));
        var hint = $("translateError");
        if (hint) {
          hint.hidden = false;
          hint.textContent = "翻译出错：" + (err && err.message ? err.message : err) + "（可尝试稍后重试，或启动本地 AI 脚本）";
        }
      });
  }

  /* ---------- 示例 ---------- */
  function loadCase(id) {
    var c = null;
    for (var i = 0; i < QJC.cases.length; i++) if (QJC.cases[i].id === id) c = QJC.cases[i];
    if (!c) return;
    state.caseId = c.id;
    $("originText").value = c.source;
    $("originText").focus();
  }

  /* ---------- 保存成稿（写历史记录） ---------- */
  function saveDraft() {
    if (!state.analyzed || !state.segments.length) return;
    var finalText = state.segments.map(function (s) { return s.translation; }).join("\n\n");
    if (!finalText) { alert("尚未生成译文，无法保存。"); return; }
    var record = {
      id: "u-" + Date.now(),
      title: state.source.slice(0, 20),
      domain: state.lastClassify ? state.lastClassify.domain : "未分类",
      genre: state.lastClassify ? state.lastClassify.genre : "未分类",
      sourceExcerpt: state.source.slice(0, 200),
      finalTranslation: finalText,
      segments: state.segments,
      createdAt: Date.now()
    };
    var hist = QJC.storage.loadHistory();
    hist.push(record);
    QJC.storage.saveHistory(hist.slice(-(QJC.config.historyLimit)));
    var btn = $("saveBtn");
    var old = btn.textContent;
    btn.textContent = "已保存 ✓";
    btn.disabled = true;
    setTimeout(function () { btn.textContent = old; btn.disabled = false; }, 1600);
  }

  /* ---------- 设置弹层 ---------- */
  function openSettings() { $("settingsModal").hidden = false; }
  function closeSettings() { $("settingsModal").hidden = true; }
  function loadSettingsIntoForm() {
    var s = QJC.storage.loadSettings();
    $("setAudience").value = s.audience;
    $("setTone").value = s.tone;
    $("setAnnotate").checked = !!s.annotate;
    $("setDomestication").checked = !!s.domestication;
    $("setDeepseekKey").value = s.deepseekKey || "";
  }
  function saveSettingsFromForm() {
    var s = QJC.storage.loadSettings();
    s.audience = $("setAudience").value;
    s.tone = $("setTone").value;
    s.annotate = $("setAnnotate").checked;
    s.domestication = $("setDomestication").checked;
    s.deepseekKey = ($("setDeepseekKey").value || "").trim();
    QJC.storage.saveSettings(s);
    closeSettings();
  }

  /* ---------- 登录门 ---------- */
  function isUnlocked() { return sessionStorage.getItem("qjc_unlocked") === "1"; }
  function setLock(locked) {
    var m = $("loginModal");
    if (m) m.hidden = !locked;
  }
  function tryLogin() {
    var val = ($("loginPass").value || "").trim();
    if (val === QJC.config.authPassword) {
      sessionStorage.setItem("qjc_unlocked", "1");
      setLock(false);
    } else {
      var err = $("loginError");
      if (err) err.hidden = false;
      $("loginPass").value = "";
      $("loginPass").focus();
    }
  }

  /* ---------- 初始化 ---------- */
  function init() {
    setLock(!isUnlocked());
    $("loginBtn").addEventListener("click", tryLogin);
    $("loginPass").addEventListener("keydown", function (e) { if (e.key === "Enter") tryLogin(); });

    document.querySelectorAll(".examples .chip").forEach(function (chip) {
      chip.addEventListener("click", function () { loadCase(chip.getAttribute("data-case")); });
    });

    $("analyzeBtn").addEventListener("click", analyze);
    $("saveBtn").addEventListener("click", saveDraft);
    $("openSettings").addEventListener("click", function () { loadSettingsIntoForm(); openSettings(); });
    $("closeSettings").addEventListener("click", closeSettings);
    var cs2 = $("closeSettings2");
    if (cs2) cs2.addEventListener("click", closeSettings);
    $("settingsModal").addEventListener("click", function (e) { if (e.target === this) closeSettings(); });
    $("saveSettingsBtn").addEventListener("click", saveSettingsFromForm);

    $("originText").addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze();
    });

    QJC.chat.init({
      state: state,
      compareContainer: $("compareView"),
      messagesEl: $("chatMessages"),
      inputEl: $("chatInput"),
      sendEl: $("chatSend"),
      hintEl: $("chatHint")
    });

    // 探测 AI 代理并更新徽标
    QJC.api.probeAI().then(function (ok) { renderModeBadge(ok); });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
