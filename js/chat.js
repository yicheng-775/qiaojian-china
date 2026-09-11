/* ==========================================================================
   桥见巴渝 · 对话改稿层
   选中段落 → 对话 → DeepSeek 返回修订 → 译文更新。
   兜底模式下显示「启动本地脚本解锁 AI 改稿」引导。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.chat = (function () {
  "use strict";

  var appState = null;     // 引用 app.js 的 state（segments/selectedIds/...）
  var compareContainer = null;
  var messagesEl, inputEl, sendEl, hintEl;
  var messages = [];       // 当前文章的对话历史
  var roundCount = 0;      // 对话轮次（触发偏好提取）
  var onStateChange = null; // 状态变化回调（供 app.js 持久化工作台）

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function init(opts) {
    appState = opts.state;
    compareContainer = opts.compareContainer;
    messagesEl = opts.messagesEl;
    inputEl = opts.inputEl;
    sendEl = opts.sendEl;
    hintEl = opts.hintEl;
    onStateChange = opts.onStateChange || null;

    sendEl.addEventListener("click", send);
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });
    // 段块点击选中（事件委托到对照容器）
    compareContainer.addEventListener("click", function (e) {
      var seg = e.target.closest(".seg");
      if (!seg) return;
      selectParagraph(seg.getAttribute("data-id"));
    });
    updateHint();
  }

  function reset() {
    messages = [];
    roundCount = 0;
    if (messagesEl) messagesEl.innerHTML = "";
    updateHint();
  }

  function selectParagraph(id) {
    if (!appState) return;
    appState.selectedIds = [id];
    QJC.render.renderCompare(appState, compareContainer);
    updateHint();
    notify();
  }

  function notify() { if (onStateChange) onStateChange(); }

  /* 供 app.js 持久化/恢复：当前对话历史 */
  function getMessages() { return messages; }
  function restoreMessages(arr) {
    messages = (arr || []).slice();
    if (messagesEl) {
      messagesEl.innerHTML = "";
      messages.forEach(function (m) { appendMessage(m.role, m.content); });
    }
    updateHint();
  }

  function updateHint() {
    if (!hintEl) return;
    var t = QJC.i18n.t;
    if (appState && appState.board === "culture") {
      if (!appState.source) hintEl.textContent = t("hintCultureEmpty");
      else if (appState.matches && appState.matches.length) hintEl.textContent = t("hintCultureFound", { n: appState.matches.length });
      else hintEl.textContent = t("hintCultureNone");
      return;
    }
    var sel = appState && appState.selectedIds && appState.selectedIds.length;
    var isCollab = appState && appState.mode === "collab";
    if (!appState || !appState.segments || !appState.segments.length) {
      hintEl.textContent = t("hintNoTranslate");
    } else if (sel) {
      var idx = appState.segments.findIndex(function (s) { return s.id === appState.selectedIds[0]; });
      hintEl.textContent = t("hintEditing", { n: idx + 1 });
    } else if (isCollab) {
      hintEl.textContent = t("hintCollab");
    } else {
      hintEl.textContent = t("hintSelect");
    }
  }

  function appendMessage(role, content, extraClass) {
    if (!messagesEl) return;
    var bubble = document.createElement("div");
    bubble.className = "msg " + role + (extraClass ? " " + extraClass : "");
    var label = document.createElement("div");
    label.className = "msg-label";
    label.textContent = QJC.i18n.t(role === "user" ? "msgYou" : "msgAssistant");
    var body = document.createElement("div");
    body.className = "msg-body";
    body.textContent = content;
    bubble.appendChild(label);
    bubble.appendChild(body);
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function send() {
    var text = inputEl.value.trim();
    if (!text) return;
    if (!QJC.api.isAI()) { showGuide(); return; }

    // 文化检索板块：无需选段，直接问答
    if (appState && appState.board === "culture") { sendCulture(text); return; }

    // 翻译板块：需已翻译 + 已选段
    if (!appState || !appState.segments || !appState.segments.length) { appendMessage("assistant", QJC.i18n.t("msgNeedTranslate"), "msg-error"); return; }
    if (!appState.selectedIds || !appState.selectedIds.length) { appendMessage("assistant", QJC.i18n.t("msgNeedSelect"), "msg-error"); return; }

    inputEl.value = "";
    appendMessage("user", text);
    messages.push({ role: "user", content: text });

    sendEl.disabled = true;
    sendEl.textContent = QJC.i18n.t("msgEditing");

    // 立即插入「加载中」占位，避免用户干等
    var loadingBubble = appendMessage("assistant", QJC.i18n.t("msgThinking"), "msg-loading");

    var payload = {
      segments: appState.segments,
      selectedIds: appState.selectedIds.slice(),
      message: text,
      history: messages.slice(0, -1),
      langDir: appState.langDir,
      profileContext: QJC.profile.buildProfileContext()
    };

    QJC.api.rewrite(payload)
      .then(function (result) {
        if (!result.updatedParagraphs || !result.updatedParagraphs.length) throw new Error("AI 未返回修订");
        if (loadingBubble) loadingBubble.remove();
        var updatedIds = [];
        result.updatedParagraphs.forEach(function (p) {
          var seg = appState.segments.find(function (s) { return s.id === p.id; });
          if (seg) {
            if (seg.translation && seg.translation !== p.translation) {
              seg.prevTranslation = seg.translation; // 保存旧译文，用于显示修改痕迹
            }
            seg.translation = p.translation;
            updatedIds.push(p.id);
          }
        });
        QJC.render.applyUpdate(appState, compareContainer, updatedIds);
        appendMessage("assistant", result.reply || QJC.i18n.t("msgUpdated"));
        messages.push({ role: "assistant", content: result.reply || QJC.i18n.t("msgUpdated") });
        roundCount++;
        notify();
        maybeExtractPrefs();
      })
      .catch(function (err) {
        if (loadingBubble) loadingBubble.remove();
        appendMessage("assistant", QJC.i18n.t("msgRewriteFail", { err: (err && err.message ? err.message : err) }), "msg-error");
      })
      .then(function () {
        sendEl.disabled = false;
        sendEl.textContent = QJC.i18n.t("chatSend");
        inputEl.focus();
      });
  }

  /* 文化检索追问：不要求选段/译文，返回纯文本讲解 */
  function sendCulture(text) {
    if (!appState || !appState.source) { appendMessage("assistant", QJC.i18n.t("msgNeedCultureInput"), "msg-error"); return; }

    inputEl.value = "";
    appendMessage("user", text);
    messages.push({ role: "user", content: text });

    sendEl.disabled = true;
    sendEl.textContent = QJC.i18n.t("msgAnswering");

    var loadingBubble = appendMessage("assistant", QJC.i18n.t("msgLooking"), "msg-loading");

    var payload = {
      source: appState.source,
      matchesSummary: QJC.culture.summarizeMatches(appState.matches),
      message: text,
      history: messages.slice(0, -1)
    };

    QJC.api.cultureAsk(payload)
      .then(function (result) {
        if (loadingBubble) loadingBubble.remove();
        var reply = result && result.reply ? result.reply : QJC.i18n.t("msgCultureNoReply");
        appendMessage("assistant", reply);
        messages.push({ role: "assistant", content: reply });
        roundCount++;
        notify();
        maybeExtractPrefs();
      })
      .catch(function (err) {
        if (loadingBubble) loadingBubble.remove();
        appendMessage("assistant", QJC.i18n.t("msgCultureFail", { err: (err && err.message ? err.message : err) }), "msg-error");
      })
      .then(function () {
        sendEl.disabled = false;
        sendEl.textContent = QJC.i18n.t("chatSend");
        inputEl.focus();
      });
  }

  function maybeExtractPrefs() {
    if (roundCount >= (QJC.config.prefExtractEvery || 5)) {
      roundCount = 0;
      QJC.profile.extractPrefsFromDialogue(messages).catch(function () { /* 静默 */ });
    }
  }

  function showGuide() {
    appendMessage("assistant", QJC.i18n.t("msgFallbackGuide"), "msg-error");
  }

  return {
    init: init,
    reset: reset,
    selectParagraph: selectParagraph,
    updateHint: updateHint,
    appendMessage: appendMessage,
    getMessages: getMessages,
    restoreMessages: restoreMessages
  };
})();
