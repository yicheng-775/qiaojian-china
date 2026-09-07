/* ==========================================================================
   桥见川渝 · API 适配层
   统一对外接口：启动时探测本地 AI 代理，通了走 DeepSeek（AI 模式），
   不通自动降级到 MyMemory 免费机翻（兜底模式）。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.api = (function () {
  "use strict";

  var state = { aiEnabled: false, probed: false, endpoint: "" };

  /* ---------- 探测 AI 端点（本地 run.py 或 Netlify Function） ---------- */
  function probeOne(url) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 2500) : null;
    return fetch(url, { method: "GET", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (timer) clearTimeout(timer); return r.ok; })
      .catch(function () { if (timer) clearTimeout(timer); return false; });
  }

  function probeAI() {
    var endpoints = QJC.config.AI_ENDPOINTS || [];
    return Promise.all(endpoints.map(function (e) {
      return probeOne(e.probe).then(function (ok) { return ok ? e.endpoint : null; });
    })).then(function (results) {
      for (var i = 0; i < results.length; i++) {
        if (results[i]) {
          state.endpoint = results[i];
          state.aiEnabled = true;
          state.probed = true;
          return true;
        }
      }
      state.aiEnabled = false;
      state.probed = true;
      return false;
    });
  }

  function isAI() { return state.aiEnabled; }
  function isProbed() { return state.probed; }

  /* ---------- 通用：调用本地 AI 代理（转发 DeepSeek） ---------- */
  function friendlyNetErr(e) {
    if (e && e.message === "Failed to fetch") {
      return new Error("无法连接 AI 服务：请确认在「线上地址」打开本页（不是本地双击 index.html），并关闭 VPN/代理后重试");
    }
    return e;
  }

  function aiChat(messages, temperature) {
    var url = state.endpoint || "/.netlify/functions/ai";
    var key = QJC.storage.loadSettings().deepseekKey || "";
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: QJC.config.model,
        messages: messages,
        temperature: temperature,
        password: QJC.config.authPassword,
        key: key
      })
    })
      .then(function (r) {
        if (!r.ok) {
          return r.json()
            .then(function (d) { throw new Error(d.error || "AI 代理错误 " + r.status); })
            .catch(function () { throw new Error("AI 代理错误 " + r.status); });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true || !data.content) throw new Error("AI 返回为空");
        return parseJSON(data.content);
      })
      .catch(function (e) { throw friendlyNetErr(e); });
  }

  /* 从 AI 返回文本中稳健提取 JSON（容忍 markdown 代码块包裹） */
  function parseJSON(content) {
    var s = String(content).trim();
    try { return JSON.parse(s); } catch (e) { /* 继续 */ }
    var fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) { try { return JSON.parse(fence[1].trim()); } catch (e2) { /* 继续 */ } }
    var a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a !== -1 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e3) { /* 继续 */ } }
    throw new Error("无法解析 AI 返回的 JSON（片段：" + s.slice(0, 200) + "）");
  }

  /* ---------- MyMemory 免费机翻（兜底模式） ---------- */
  function mymemory(text) {
    var chunks = QJC.segments.splitText(text, QJC.config.maxChunkLen);
    return Promise.all(chunks.map(function (chunk) {
      var url = QJC.config.MYMEMORY + "?q=" + encodeURIComponent(chunk) + "&langpair=zh-CN|en";
      return fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
          }
          throw new Error("机翻失败");
        })
        .catch(function (e) { throw friendlyNetErr(e); });
    })).then(function (parts) { return parts.join(""); });
  }

  function translateFallback(segments) {
    return Promise.all(segments.map(function (seg) {
      return mymemory(seg.source).then(function (text) { seg.translation = text; return seg; });
    }));
  }

  /* ======================================================================
     对外接口（均返回 Promise）
     ====================================================================== */

  /* 翻译：AI 模式做文化适配改写；兜底模式逐段机翻 */
  function translate(segments, profileContext, dictHints) {
    if (!state.aiEnabled) return translateFallback(segments);
    var pr = QJC.prompts.translate(segments, profileContext, dictHints);
    return aiChat([
      { role: "system", content: pr.system },
      { role: "user", content: pr.user }
    ], QJC.config.temperature.translate).then(function (obj) {
      if (!obj.paragraphs || !obj.paragraphs.length) throw new Error("AI 未返回译文");
      var map = {};
      obj.paragraphs.forEach(function (p) { map[p.id] = p.translation; });
      segments.forEach(function (seg) { if (map[seg.id]) seg.translation = map[seg.id]; });
      return segments;
    });
  }

  /* 对话改稿：仅 AI 模式 */
  function rewrite(payload) {
    if (!state.aiEnabled) return Promise.reject(new Error("对话改稿需 AI 模式"));
    var pr = QJC.prompts.rewrite(payload);
    return aiChat([
      { role: "system", content: pr.system },
      { role: "user", content: pr.user }
    ], QJC.config.temperature.rewrite);
  }

  /* 领域/体裁/风格分类：仅 AI 模式 */
  function classify(source) {
    if (!state.aiEnabled) return Promise.reject(new Error("画像需 AI 模式"));
    var pr = QJC.prompts.classify(source);
    return aiChat([
      { role: "system", content: pr.system },
      { role: "user", content: pr.user }
    ], QJC.config.temperature.classify);
  }

  /* 画像分析：仅 AI 模式 */
  function analyzeProfile(profileContext) {
    if (!state.aiEnabled) return Promise.reject(new Error("画像需 AI 模式"));
    var pr = QJC.prompts.profile(profileContext);
    return aiChat([
      { role: "system", content: pr.system },
      { role: "user", content: pr.user }
    ], QJC.config.temperature.profile);
  }

  return {
    probeAI: probeAI,
    isAI: isAI,
    isProbed: isProbed,
    translate: translate,
    rewrite: rewrite,
    classify: classify,
    analyzeProfile: analyzeProfile
  };
})();
