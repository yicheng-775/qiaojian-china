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
    lastClassify: null, // 最近一次分类结果 {domain, genre}
    mode: "oneclick"    // 翻译方式：oneclick 一键整篇 | collab 对话逐段协作
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

  /* ---------- 翻译方式切换（一键整篇 / 对话逐段协作） ---------- */
  function setMode(mode) {
    state.mode = mode === "collab" ? "collab" : "oneclick";
    document.querySelectorAll(".mode-toggle .mt-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-mode") === state.mode);
    });
    var btn = $("analyzeBtn");
    if (btn) btn.textContent = state.mode === "collab" ? "开始逐段协作 →" : "开始翻译 →";
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

  /* ---------- 工作台持久化：跳页不丢原稿/译文/对话 ---------- */
  function persistWorkspace() {
    if (!state.source) return;
    QJC.storage.saveWorkspace({
      source: state.source,
      caseId: state.caseId,
      segments: state.segments,
      selectedIds: state.selectedIds,
      lastClassify: state.lastClassify,
      mode: state.mode,
      chatHistory: QJC.chat.getMessages(),
      savedAt: Date.now()
    });
  }

  function restoreWorkspace() {
    var ws = QJC.storage.loadWorkspace();
    if (!ws || !ws.source) return false;
    $("originText").value = ws.source;
    state.source = ws.source;
    state.caseId = ws.caseId || null;
    state.segments = ws.segments || [];
    state.matches = findMatches(ws.source);
    state.selectedIds = ws.selectedIds || [];
    state.lastClassify = ws.lastClassify || null;
    state.analyzed = state.segments.length > 0;
    if (ws.mode) setMode(ws.mode);

    if (state.segments.length) {
      $("workspace").hidden = false;
      $("results").hidden = false;
      $("saveBtn").hidden = false;
      renderStats();
      QJC.render.renderCompare(state, $("compareView"));
    }
    QJC.chat.restoreMessages(ws.chatHistory || []);
    return true;
  }

  /* ---------- 导出中英对照 .txt ---------- */
  function exportDraft() {
    if (!state.analyzed || !state.segments.length) { alert("暂无译文可导出，请先翻译。"); return; }
    var lines = ["桥见川渝 · 翻译成稿", "导出时间：" + new Date().toLocaleString(), ""];
    state.segments.forEach(function (s, i) {
      lines.push("【第 " + (i + 1) + " 段】");
      lines.push("中文：" + s.source);
      lines.push("英文：" + (s.translation || "（未翻译）"));
      lines.push("");
    });
    var text = lines.join("\n");
    var blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }); // BOM 防中文乱码
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "桥见川渝-翻译成稿.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- 文件上传：.txt / .docx（Word） ---------- */
  function handleFileUpload(file) {
    if (!file) return;
    var name = (file.name || "").toLowerCase();
    if (name.slice(-4) === ".txt") {
      var r = new FileReader();
      r.onload = function () { $("originText").value = r.result; $("originText").focus(); };
      r.onerror = function () { alert("文件读取失败，请重试。"); };
      r.readAsText(file, "utf-8");
    } else if (name.slice(-5) === ".docx") {
      if (typeof mammoth === "undefined") { alert("Word 解析组件未加载，请刷新页面后重试。"); return; }
      var fr = new FileReader();
      fr.onload = function () {
        mammoth.extractRawText({ arrayBuffer: fr.result })
          .then(function (result) {
            var t = (result.value || "").trim();
            if (!t) { alert("未能从该 Word 文档中提取到文本。"); return; }
            $("originText").value = t;
            $("originText").focus();
          })
          .catch(function (err) { alert("Word 解析失败：" + (err && err.message ? err.message : err)); });
      };
      fr.onerror = function () { alert("文件读取失败，请重试。"); };
      fr.readAsArrayBuffer(file);
    } else {
      alert("仅支持 .txt 或 .docx 文档（老式 .doc 请先在 Word 里另存为 .docx）。");
    }
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
    persistWorkspace(); // 先存原稿（译文尚未生成）

    // AI 模式：并行分类，累积画像（一键 / 协作两种模式都做）
    if (QJC.api.isAI()) {
      QJC.api.classify(state.source).then(function (result) {
        state.lastClassify = result;
        QJC.profile.recordClassification(result);
        renderStats();
        persistWorkspace();
      }).catch(function () { /* 分类失败不阻塞 */ });
    }

    // 对话协作模式：不整篇翻译，逐段通过对话生成 / 修改
    if (state.mode === "collab") return;

    // 一键翻译模式：整篇一次生成
    var dictHints = state.matches.map(function (m) {
      return { term: m.term, suggestions: m.suggestions, reason: m.reason };
    });
    var profileContext = QJC.profile.buildProfileContext();

    QJC.api.translate(state.segments, profileContext, dictHints)
      .then(function () {
        QJC.render.renderCompare(state, $("compareView"));
        persistWorkspace(); // 存译文
      })
      .catch(function (err) {
        QJC.render.renderCompare(state, $("compareView"));
        persistWorkspace(); // 翻译失败也保留原稿与对话
        var hint = $("translateError");
        if (hint) {
          hint.hidden = false;
          hint.textContent = "翻译出错：" + (err && err.message ? err.message : err);
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
      chatHistory: QJC.chat.getMessages(),
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

  /* ---------- 历史记录：查看 + 恢复 ---------- */
  function renderHistory() {
    var list = $("historyList");
    if (!list) return;
    var hist = QJC.storage.loadHistory();
    if (!hist.length) {
      list.innerHTML = '<div class="hist-empty">暂无历史记录。翻译并「保存成稿」后会自动出现在这里。</div>';
      return;
    }
    var html = "";
    hist.slice().reverse().forEach(function (h) {
      var meta = [h.domain || "未分类", h.genre || "", fmtTime(h.createdAt)].filter(Boolean).join(" · ");
      html += '<div class="hist-item">' +
        '<div class="hist-main">' +
          '<div class="hist-title">' + escapeHtml(h.title || "（无标题）") + '</div>' +
          '<div class="hist-meta">' + escapeHtml(meta) + '</div>' +
        '</div>' +
        '<button class="hist-open" data-id="' + escapeHtml(h.id) + '">打开</button>' +
      '</div>';
    });
    list.innerHTML = html;
    list.querySelectorAll(".hist-open").forEach(function (btn) {
      btn.addEventListener("click", function () { restoreHistory(btn.getAttribute("data-id")); });
    });
  }

  function fmtTime(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function openHistory() { renderHistory(); $("historyModal").hidden = false; }
  function closeHistory() { $("historyModal").hidden = true; }

  function restoreHistory(id) {
    var hist = QJC.storage.loadHistory();
    var rec = null;
    for (var i = 0; i < hist.length; i++) if (hist[i].id === id) rec = hist[i];
    if (!rec) { alert("记录不存在，可能已被清空。"); return; }

    var segs = (rec.segments && rec.segments.length) ? rec.segments : [];
    // 用逐段中文拼回全文（segments 里保存了完整原稿）
    var srcText = segs.length ? segs.map(function (s) { return s.source; }).join("\n\n") : (rec.sourceExcerpt || "");

    state.source = srcText;
    state.segments = segs.length ? segs : QJC.segments.splitSegments(srcText);
    state.matches = findMatches(srcText);
    state.selectedIds = [];
    state.lastClassify = { domain: rec.domain || "未分类", genre: rec.genre || "未分类" };
    state.analyzed = state.segments.length > 0;
    state.caseId = null;

    $("originText").value = srcText;
    $("workspace").hidden = false;
    $("results").hidden = false;
    $("saveBtn").hidden = false;
    renderStats();
    QJC.render.renderCompare(state, $("compareView"));
    QJC.chat.restoreMessages(rec.chatHistory || []);
    persistWorkspace();
    closeHistory();
    $("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearHistory() {
    if (!confirm("确定清空全部历史记录？此操作不可撤销。")) return;
    QJC.storage.saveHistory([]);
    renderHistory();
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
      hintEl: $("chatHint"),
      onStateChange: persistWorkspace
    });

    // 上传 / 导出按钮
    $("uploadBtn").addEventListener("click", function () { $("fileInput").click(); });
    $("fileInput").addEventListener("change", function (e) {
      handleFileUpload(e.target.files[0]);
      e.target.value = "";
    });
    $("exportBtn").addEventListener("click", exportDraft);

    // 翻译方式切换（一键整篇 / 对话逐段协作）
    document.querySelectorAll(".mode-toggle .mt-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { setMode(btn.getAttribute("data-mode")); });
    });

    // 历史记录
    $("openHistory").addEventListener("click", openHistory);
    $("closeHistory").addEventListener("click", closeHistory);
    var ch2 = $("closeHistory2");
    if (ch2) ch2.addEventListener("click", closeHistory);
    $("historyModal").addEventListener("click", function (e) { if (e.target === this) closeHistory(); });
    $("clearHistory").addEventListener("click", clearHistory);

    // 探测 AI 代理并更新徽标
    QJC.api.probeAI().then(function (ok) { renderModeBadge(ok); });

    // 恢复上次工作台（原稿/译文/对话），跳页回来不丢
    restoreWorkspace();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
