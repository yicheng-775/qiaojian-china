/* ==========================================================================
   桥见川渝 · 对话改稿层
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
  }

  function updateHint() {
    if (!hintEl) return;
    var sel = appState && appState.selectedIds && appState.selectedIds.length;
    if (!appState || !appState.segments || !appState.segments.length) {
      hintEl.textContent = "先翻译一篇文章，再点击左侧段落开始改稿。";
    } else if (sel) {
      var idx = appState.segments.findIndex(function (s) { return s.id === appState.selectedIds[0]; });
      hintEl.textContent = "当前编辑：第 " + (idx + 1) + " 段";
    } else {
      hintEl.textContent = "点击左侧任意段落，针对它对话改稿。";
    }
  }

  function appendMessage(role, content, extraClass) {
    if (!messagesEl) return;
    var bubble = document.createElement("div");
    bubble.className = "msg " + role + (extraClass ? " " + extraClass : "");
    var label = document.createElement("div");
    label.className = "msg-label";
    label.textContent = role === "user" ? "你" : "助手";
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
    if (!appState || !appState.segments || !appState.segments.length) { appendMessage("assistant", "请先翻译一篇文章。", "msg-error"); return; }
    if (!appState.selectedIds || !appState.selectedIds.length) { appendMessage("assistant", "请先点击左侧某个段落，告诉我想改哪一段。", "msg-error"); return; }
    if (!QJC.api.isAI()) { showGuide(); return; }

    inputEl.value = "";
    appendMessage("user", text);
    messages.push({ role: "user", content: text });

    sendEl.disabled = true;
    sendEl.textContent = "改稿中…";

    // 立即插入「加载中」占位，避免用户干等
    var loadingBubble = appendMessage("assistant", "正在想怎么改…", "msg-loading");

    var payload = {
      segments: appState.segments,
      selectedIds: appState.selectedIds.slice(),
      message: text,
      history: messages.slice(0, -1),
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
        appendMessage("assistant", result.reply || "已更新。");
        messages.push({ role: "assistant", content: result.reply || "已更新。" });
        roundCount++;
        maybeExtractPrefs();
      })
      .catch(function (err) {
        if (loadingBubble) loadingBubble.remove();
        appendMessage("assistant", "改稿失败：" + (err && err.message ? err.message : err), "msg-error");
      })
      .then(function () {
        sendEl.disabled = false;
        sendEl.textContent = "发送";
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
    appendMessage("assistant", "当前是「兜底模式」（免费机翻 + 词典识别），对话改稿需 AI。\n\n请在本机双击 run-ai.bat 启动 AI 脚本，再刷新页面。", "msg-error");
  }

  return {
    init: init,
    reset: reset,
    selectParagraph: selectParagraph,
    updateHint: updateHint,
    appendMessage: appendMessage
  };
})();
