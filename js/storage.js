/* ==========================================================================
   桥见川渝 · 存储层
   localStorage 读写（设置 / 画像 / 历史）+ 导入导出（不含 API key）。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.storage = (function () {
  "use strict";

  var KEYS = {
    settings: "qjc_settings",
    profile: "qjc_profile_v1",
    history: "qjc_history_v1"
  };

  var APP_NAME = "桥见川渝";
  var SCHEMA_VERSION = 1;

  /* ---------- 默认结构 ---------- */
  function defaultSettings() {
    return {
      audience: "general",       // general | news | academic | youth
      tone: "faithful",          // faithful 忠实 | fluent 流畅归化 | concise 精简
      annotate: true,            // 偏好「音译+括号注释」
      domestication: true        // 归化 true / 异化 false
    };
  }

  function defaultProfile() {
    return {
      version: SCHEMA_VERSION,
      domainStats: {},   // { "文旅": {count, last}, ... }
      genreStats: {},    // { "特写": {count, last}, ... }
      styleStats: {},    // { register: {"正式书面": 3, "半正式": 1}, ... }
      portrait: {        // 画像文字（AI 生成，缓存）
        topDomains: [],
        topGenres: [],
        styleSummary: "",
        updatedAt: 0
      },
      extractedPrefs: {  // 从对话提取的偏好（驱动 AI）
        preferredTerms: {},
        bannedPhrases: [],
        rules: []
      }
    };
  }

  /* ---------- 读写（带 JSON 容错） ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false; // 存储满/隐私模式等
    }
  }

  /* ---------- 公开接口 ---------- */
  function loadSettings() {
    var s = read(KEYS.settings, null);
    if (!s) s = defaultSettings();
    return Object.assign(defaultSettings(), s);
  }
  function saveSettings(s) { return write(KEYS.settings, s); }

  function loadProfile() {
    var p = read(KEYS.profile, null);
    if (!p || p.version !== SCHEMA_VERSION) p = defaultProfile();
    // 兜底补全缺失字段
    var d = defaultProfile();
    p.domainStats = p.domainStats || d.domainStats;
    p.genreStats = p.genreStats || d.genreStats;
    p.styleStats = p.styleStats || d.styleStats;
    p.portrait = p.portrait || d.portrait;
    p.extractedPrefs = p.extractedPrefs || d.extractedPrefs;
    return p;
  }
  function saveProfile(p) { return write(KEYS.profile, p); }

  function loadHistory() { return read(KEYS.history, []); }
  function saveHistory(h) { return write(KEYS.history, h); }

  /* 导出：默认只打包 profile + history（不含设置，避免泄露 key/隐私） */
  function exportJSON() {
    return JSON.stringify({
      app: APP_NAME,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      profile: loadProfile(),
      history: loadHistory()
    }, null, 2);
  }

  /* 导入：校验结构后合并（计数相加、偏好取新、画像文字保留较新者） */
  function importJSON(str) {
    var obj;
    try { obj = JSON.parse(str); } catch (e) { return { ok: false, error: "JSON 解析失败" }; }
    if (!obj || obj.app !== APP_NAME) return { ok: false, error: "不是「桥见川渝」的导出文件" };
    if (!obj.profile) return { ok: false, error: "缺少画像数据" };

    var cur = loadProfile();
    var incoming = obj.profile;

    // 计数相加
    ["domainStats", "genreStats", "styleStats"].forEach(function (k) {
      var src = incoming[k] || {};
      var dst = cur[k] || {};
      Object.keys(src).forEach(function (name) {
        if (typeof src[name] === "object" && src[name].count != null) {
          dst[name] = dst[name] || {};
          dst[name].count = (dst[name].count || 0) + src[name].count;
          dst[name].last = Math.max(dst[name].last || 0, src[name].last || 0);
        }
      });
      cur[k] = dst;
    });

    // 偏好：非空则覆盖
    var ep = incoming.extractedPrefs;
    if (ep) {
      cur.extractedPrefs.preferredTerms = Object.assign({}, cur.extractedPrefs.preferredTerms, ep.preferredTerms || {});
      cur.extractedPrefs.bannedPhrases = (ep.bannedPhrases || []).slice();
      cur.extractedPrefs.rules = (ep.rules || []).slice();
    }
    // 画像文字：取较新
    if (incoming.portrait && (incoming.portrait.updatedAt || 0) > (cur.portrait.updatedAt || 0)) {
      cur.portrait = incoming.portrait;
    }

    saveProfile(cur);

    // 历史：追加去重（按 id）
    if (Array.isArray(obj.history)) {
      var hist = loadHistory();
      var seen = {};
      hist.forEach(function (h) { seen[h.id] = true; });
      obj.history.forEach(function (h) { if (h && h.id && !seen[h.id]) hist.push(h); });
      saveHistory(hist.slice(-(QJC.config ? QJC.config.historyLimit : 50)));
    }

    return { ok: true };
  }

  function clear() {
    Object.keys(KEYS).forEach(function (k) { localStorage.removeItem(KEYS[k]); });
  }

  return {
    KEYS: KEYS,
    APP_NAME: APP_NAME,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    loadHistory: loadHistory,
    saveHistory: saveHistory,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clear: clear
  };
})();
