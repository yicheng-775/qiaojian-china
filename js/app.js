/* ==========================================================================
   桥见巴渝 · 工具主链路
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
    mode: "oneclick",   // 翻译方式：oneclick 一键整篇 | collab 对话逐段协作
    board: "translate", // 板块：translate 翻译 | culture 文化检索
    langDir: "zh2en",   // 翻译方向：zh2en 中译英 | en2zh 英译中
    translateFailed: false // 一键翻译是否失败（失败时对照区显示「翻译失败」而非「翻译中」）
  };

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------- 状态徽标 ---------- */
  function renderModeBadge() {
    var el = $("modeBadge");
    if (!el) return;
    if (!QJC.api.isProbed()) {
      el.textContent = QJC.i18n.t("modeBadgeProbing");
      el.className = "mode-badge mode-fallback";
    } else if (QJC.api.isAI()) {
      el.textContent = QJC.i18n.t("modeBadgeAI");
      el.className = "mode-badge mode-ai";
    } else {
      el.textContent = QJC.i18n.t("modeBadgeFallback");
      el.className = "mode-badge mode-fallback";
    }
  }

  /* ---------- 板块切换（翻译 / 文化检索） ---------- */
  function setBoard(board) {
    state.board = board === "culture" ? "culture" : "translate";
    document.querySelectorAll(".board-tab").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-board") === state.board);
    });
    var btn = $("analyzeBtn");
    if (btn) {
      btn.textContent = QJC.i18n.t(state.board === "culture" ? "analyzeCulture"
        : (state.mode === "collab" ? "analyzeCollab" : "analyzeTranslate"));
    }
    applyBoardLayout();
    QJC.chat.updateHint();
  }

  /* 结果区布局统一入口：板块（翻译/检索）× 翻译方式（一键/协作）决定显隐与单双栏 */
  function applyBoardLayout() {
    var culture = state.board === "culture";
    var compareView = $("compareView");
    var cultureView = $("cultureView");
    var legend = $("legend");
    var modeToggle = $("modeToggle");
    var dirToggle = $("dirToggle");
    var leftTitle = $("leftColTitle");
    if (compareView) compareView.hidden = culture;
    if (cultureView) cultureView.hidden = !culture;
    if (legend) legend.hidden = culture;
    if (modeToggle) modeToggle.style.display = culture ? "none" : "";
    if (dirToggle) dirToggle.style.display = culture ? "none" : "";
    if (leftTitle) leftTitle.textContent = QJC.i18n.t(culture ? "leftColCulture" : "leftColTranslate");
    var saveBtn = $("saveBtn");
    var exportBtn = $("exportBtn");
    if (saveBtn) saveBtn.hidden = culture || !state.analyzed;
    if (exportBtn) exportBtn.hidden = culture;
    // 文化检索始终双栏（左词卡 + 右追问）；翻译板块一键=单栏、协作=双栏
    var ws = $("workspace");
    var panel = document.querySelector(".chat-panel");
    var doubleCol = culture || state.mode === "collab";
    if (ws) ws.classList.toggle("single", !doubleCol);
    if (panel) panel.hidden = !doubleCol;
  }

  /* ---------- 翻译方式切换（一键整篇 / 对话逐段协作） ---------- */
  function setMode(mode) {
    state.mode = mode === "collab" ? "collab" : "oneclick";
    document.querySelectorAll("#modeToggle .mt-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-mode") === state.mode);
    });
    var btn = $("analyzeBtn");
    if (btn) btn.textContent = QJC.i18n.t(state.board === "culture" ? "analyzeCulture" : (state.mode === "collab" ? "analyzeCollab" : "analyzeTranslate"));
    applyModeLayout();
  }

  /* ---------- 翻译方向切换（中译英 / 英译中） ---------- */
  function setDir(dir) {
    state.langDir = dir === "en2zh" ? "en2zh" : "zh2en";
    document.querySelectorAll("#dirToggle .mt-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-dir") === state.langDir);
    });
    var s = QJC.storage.loadSettings();
    s.langDir = state.langDir;
    QJC.storage.saveSettings(s);
    var ta = $("originText");
    if (ta) {
      ta.placeholder = QJC.i18n.t(state.langDir === "en2zh" ? "originPh_en2zh" : "originPh_zh2en");
    }
  }

  /* 界面语言切换后重渲染动态字符串 */
  function refreshDynamicI18n() {
    renderModeBadge();
    if (state.analyzed) renderStats();
    var btn = $("analyzeBtn");
    if (btn) btn.textContent = QJC.i18n.t(state.board === "culture" ? "analyzeCulture" : (state.mode === "collab" ? "analyzeCollab" : "analyzeTranslate"));
    var ta = $("originText");
    if (ta) ta.placeholder = QJC.i18n.t(state.langDir === "en2zh" ? "originPh_en2zh" : "originPh_zh2en");
    applyBoardLayout();
    QJC.chat.updateHint();
    if (state.analyzed) {
      if (state.board === "culture") {
        QJC.culture.renderExplanation(state, $("cultureView"));
      } else {
        QJC.render.renderCompare(state, $("compareView"));
      }
    }
  }

  /* 结果区布局统一入口（保留此函数名以兼容旧调用） */
  function applyModeLayout() { applyBoardLayout(); }

  function renderStats() {
    var n = state.matches.length;
    var high = 0, mid = 0, low = 0;
    state.matches.forEach(function (m) {
      if (m.level === "高") high++; else if (m.level === "中") mid++; else low++;
    });
    var html = '<span class="rs-pill">' + QJC.i18n.t("statRecognized", { n: n }) + '</span>';
    if (high) html += '<span class="rs-pill" style="color:var(--risk-high)">' + QJC.i18n.t("statHigh") + ' <b>' + high + '</b></span>';
    if (mid) html += '<span class="rs-pill" style="color:var(--risk-mid)">' + QJC.i18n.t("statMid") + ' <b>' + mid + '</b></span>';
    if (low) html += '<span class="rs-pill" style="color:var(--risk-low)">' + QJC.i18n.t("statLow") + ' <b>' + low + '</b></span>';
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
      board: state.board,
      langDir: state.langDir,
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
    state.matches = QJC.render.findMatches(ws.source);
    state.selectedIds = ws.selectedIds || [];
    state.lastClassify = ws.lastClassify || null;
    state.analyzed = state.segments.length > 0;
    if (ws.board) setBoard(ws.board);
    if (ws.mode) setMode(ws.mode);
    if (ws.langDir) setDir(ws.langDir);

    if (state.board === "culture") {
      if (state.source) {
        $("workspace").hidden = false;
        $("results").hidden = false;
        QJC.culture.renderExplanation(state, $("cultureView"));
      }
    } else if (state.segments.length) {
      $("workspace").hidden = false;
      $("results").hidden = false;
      $("saveBtn").hidden = false;
      renderStats();
      QJC.render.renderCompare(state, $("compareView"));
    }
    applyBoardLayout();
    QJC.chat.restoreMessages(ws.chatHistory || []);
    return true;
  }

  /* ---------- 导出中英对照 .txt ---------- */
  function exportDraft() {
    if (!state.analyzed || !state.segments.length) { alert(QJC.i18n.t("exportNoText")); return; }
    var isEn2zh = state.langDir === "en2zh";
    var srcLabel = isEn2zh ? "英文" : "中文";
    var dstLabel = isEn2zh ? "中文" : "英文";
    var lines = ["桥见巴渝 · 翻译成稿", "导出时间：" + new Date().toLocaleString(), ""];
    state.segments.forEach(function (s, i) {
      lines.push("【第 " + (i + 1) + " 段】");
      lines.push(srcLabel + "：" + s.source);
      lines.push(dstLabel + "：" + (s.translation || "（未翻译）"));
      lines.push("");
    });
    var text = lines.join("\n");
    var blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }); // BOM 防中文乱码
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "桥见巴渝-翻译成稿.txt";
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
      r.onerror = function () { alert(QJC.i18n.t("fileReadFail")); };
      r.readAsText(file, "utf-8");
    } else if (name.slice(-5) === ".docx") {
      if (typeof mammoth === "undefined") { alert(QJC.i18n.t("wordNotLoaded")); return; }
      var fr = new FileReader();
      fr.onload = function () {
        mammoth.extractRawText({ arrayBuffer: fr.result })
          .then(function (result) {
            var t = (result.value || "").trim();
            if (!t) { alert(QJC.i18n.t("wordNoText")); return; }
            $("originText").value = t;
            $("originText").focus();
          })
          .catch(function (err) { alert(QJC.i18n.t("wordParseFail", { err: (err && err.message ? err.message : err) })); });
      };
      fr.onerror = function () { alert(QJC.i18n.t("fileReadFail")); };
      fr.readAsArrayBuffer(file);
    } else {
      alert(QJC.i18n.t("fileTypeUnsupported"));
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

    if (state.board === "culture") { analyzeCulture(text); return; }

    state.source = text;
    state.segments = QJC.segments.splitSegments(text, state.langDir);
    state.matches = state.langDir === "en2zh" ? [] : QJC.render.findMatches(text);
    state.selectedIds = [];
    state.lastClassify = null;
    state.translateFailed = false;
    state.analyzed = true;

    QJC.chat.reset();
    $("workspace").hidden = false;
    $("results").hidden = false;
    $("saveBtn").hidden = false;
    renderStats();
    QJC.render.renderCompare(state, $("compareView"));
    applyModeLayout(); // 按当前模式显示/隐藏对话面板
    $("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    persistWorkspace(); // 先存原稿（译文尚未生成）

    // AI 模式：并行分类，累积画像（一键 / 协作两种模式都做；画像关闭则跳过，省一次调用）
    if (QJC.api.isAI() && QJC.storage.loadSettings().profileEnabled) {
      QJC.api.classify(state.source).then(function (result) {
        state.lastClassify = result;
        QJC.profile.recordClassification(result);
        renderStats();
        persistWorkspace();
      }).catch(function () { /* 分类失败不阻塞 */ });
    }

    // 对话协作模式：不整篇翻译，逐段通过对话生成 / 修改
    if (state.mode === "collab") return;

    // 一键翻译模式：逐段翻译（每段独立调用，稳定不超时），带进度反馈
    var dictHints = state.matches.map(function (m) {
      return { term: m.term, suggestions: m.suggestions, reason: m.reason };
    });
    var profileContext = QJC.profile.buildProfileContext();

    setTranslateLoading(0, state.segments.length);

    QJC.api.translate(state.segments, profileContext, dictHints, state.langDir, function (done, total) {
      setTranslateLoading(done, total);
      QJC.render.renderCompare(state, $("compareView")); // 逐段实时回显
    })
      .then(function () {
        setTranslateLoading(false);
        QJC.render.renderCompare(state, $("compareView"));
        persistWorkspace(); // 存译文
      })
      .catch(function (err) {
        state.translateFailed = true;
        setTranslateLoading(false);
        QJC.render.renderCompare(state, $("compareView"));
        persistWorkspace(); // 翻译失败也保留原稿与对话
        var hint = $("translateError");
        if (hint) {
          hint.hidden = false;
          hint.textContent = "翻译出错：" + (err && err.message ? err.message : err);
        }
      });
  }

  /* ---------- 文化检索：识别文化词 → 词卡讲解（离线），追问走 AI ---------- */
  function analyzeCulture(text) {
    state.source = text;
    state.segments = QJC.segments.splitSegments(text);
    state.matches = QJC.render.findMatches(text);
    state.selectedIds = [];
    state.lastClassify = null;
    state.translateFailed = false;
    state.analyzed = true;

    QJC.chat.reset();
    $("workspace").hidden = false;
    $("results").hidden = false;
    $("saveBtn").hidden = true; // 检索板块无「保存成稿」
    QJC.culture.renderExplanation(state, $("cultureView"));
    applyBoardLayout(); // 双栏：左词卡 + 右追问
    QJC.chat.updateHint();
    $("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    persistWorkspace(); // 存检索文本

    // AI 模式：并行分类，累积画像（文化检索也参与画像；画像关闭则跳过）
    if (QJC.api.isAI() && QJC.storage.loadSettings().profileEnabled) {
      QJC.api.classify(state.source).then(function (result) {
        state.lastClassify = result;
        QJC.profile.recordClassification(result);
        renderStats();
        persistWorkspace();
      }).catch(function () { /* 分类失败不阻塞 */ });
    }
  }

  /* 一键翻译按钮的进行中状态（禁用 + 进度文字） */
  function setTranslateLoading(active, done, total) {
    var btn = $("analyzeBtn");
    if (!btn) return;
    if (active === false) {
      btn.disabled = false;
      btn.textContent = state.mode === "collab" ? "开始逐段协作 →" : "开始翻译 →";
      return;
    }
    btn.disabled = true;
    if (done != null && total) {
      btn.textContent = "翻译中 " + done + "/" + total + "…";
    } else {
      btn.textContent = "翻译中…";
    }
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
    if (!finalText) { alert(QJC.i18n.t("needTranslation")); return; }
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
    btn.textContent = QJC.i18n.t("saveDone");
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
    if (!rec) { alert(QJC.i18n.t("historyMissing")); return; }

    var segs = (rec.segments && rec.segments.length) ? rec.segments : [];
    // 用逐段中文拼回全文（segments 里保存了完整原稿）
    var srcText = segs.length ? segs.map(function (s) { return s.source; }).join("\n\n") : (rec.sourceExcerpt || "");

    state.source = srcText;
    state.segments = segs.length ? segs : QJC.segments.splitSegments(srcText);
    state.matches = QJC.render.findMatches(srcText);
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
    if (!confirm(QJC.i18n.t("confirmClearHistory"))) return;
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
    $("setProfile").checked = !!s.profileEnabled;
    $("setDeepseekKey").value = s.deepseekKey || "";
  }
  function saveSettingsFromForm() {
    var s = QJC.storage.loadSettings();
    s.audience = $("setAudience").value;
    s.tone = $("setTone").value;
    s.annotate = $("setAnnotate").checked;
    s.domestication = $("setDomestication").checked;
    s.profileEnabled = $("setProfile").checked;
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

    // 界面语言：按设置初始化，绑定语言切换按钮
    QJC.i18n.setOnLangChange(refreshDynamicI18n);
    QJC.i18n.setLang(QJC.storage.loadSettings().uiLang || "zh");
    var langBtn = $("langBtn");
    if (langBtn) langBtn.addEventListener("click", function () {
      QJC.i18n.setLang(QJC.i18n.getLang() === "zh" ? "en" : "zh");
    });

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

    // 板块切换（翻译 / 文化检索）
    document.querySelectorAll(".board-tab").forEach(function (btn) {
      btn.addEventListener("click", function () { setBoard(btn.getAttribute("data-board")); });
    });

    // 翻译方式切换（一键整篇 / 对话逐段协作）
    document.querySelectorAll("#modeToggle .mt-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { setMode(btn.getAttribute("data-mode")); });
    });

    // 翻译方向切换（中译英 / 英译中）
    document.querySelectorAll("#dirToggle .mt-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { setDir(btn.getAttribute("data-dir")); });
    });

    // 历史记录
    $("openHistory").addEventListener("click", openHistory);
    $("closeHistory").addEventListener("click", closeHistory);
    var ch2 = $("closeHistory2");
    if (ch2) ch2.addEventListener("click", closeHistory);
    $("historyModal").addEventListener("click", function (e) { if (e.target === this) closeHistory(); });
    $("clearHistory").addEventListener("click", clearHistory);

    // 探测 AI 代理并更新徽标
    QJC.api.probeAI().then(renderModeBadge);

    // 初始翻译方向（来自设置），同步 dir-toggle 与输入框提示
    setDir(QJC.storage.loadSettings().langDir || "zh2en");

    // 恢复上次工作台（原稿/译文/对话），跳页回来不丢
    restoreWorkspace();
    applyModeLayout(); // 首次访问也按默认「一键翻译」隐藏对话面板
  }

  document.addEventListener("DOMContentLoaded", init);
})();
