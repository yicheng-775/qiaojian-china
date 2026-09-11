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
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    // 前端兜底超时 15s：比 Netlify 函数 10s 硬超时略宽，正常情况下后端先返回
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: QJC.config.model,
        messages: messages,
        temperature: temperature,
        password: QJC.config.authPassword,
        key: key
      }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        clearTimer();
        if (!r.ok) {
          // 先读文本再手动解析：既透传代理返回的具体 error，又兜底「非 JSON」场景
          return r.text().then(function (text) {
            var d = null;
            try { d = JSON.parse(text); } catch (e) { d = null; }
            if (d && d.error) throw new Error(d.error);
            throw new Error("AI 服务异常（HTTP " + r.status + "），请稍后重试");
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.ok !== true || !data.content) throw new Error("AI 返回为空");
        return parseJSON(data.content);
      })
      .catch(function (e) {
        if (ctrl && ctrl.signal && ctrl.signal.aborted) {
          throw new Error("AI 响应超时（超过 15 秒无返回），请稍后重试");
        }
        throw friendlyNetErr(e);
      });
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
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 8000) : null;
      function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
      return fetch(url, { signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { clearTimer(); return r.json(); })
        .then(function (data) {
          if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
          }
          throw new Error("机翻失败");
        })
        .catch(function (e) {
          if (ctrl && ctrl.signal && ctrl.signal.aborted) {
            throw new Error("免费机翻接口连接超时——请在「⚙ 设置」填写 DeepSeek API key 走 AI 翻译（更准更快）");
          }
          throw friendlyNetErr(e);
        });
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

  /* 翻译：AI 模式逐段文化适配（每段独立短调用，稳过 10s 函数超时）；兜底模式逐段机翻 */
  function translate(segments, profileContext, dictHints, onProgress) {
    if (!state.aiEnabled) return translateFallback(segments);
    var total = segments.length;
    var done = 0;
    var chain = Promise.resolve();
    segments.forEach(function (seg) {
      chain = chain.then(function () {
        var pr = QJC.prompts.translateSegment(seg, profileContext, dictHints);
        return aiChat([
          { role: "system", content: pr.system },
          { role: "user", content: pr.user }
        ], QJC.config.temperature.translate).then(function (obj) {
          var t = obj && (obj.translation || (obj.paragraphs && obj.paragraphs[0] && obj.paragraphs[0].translation));
          if (!t) throw new Error("AI 未返回该段译文");
          seg.translation = t;
          done++;
          if (onProgress) onProgress(done, total);
          return seg;
        });
      });
    });
    return chain.then(function () { return segments; });
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
