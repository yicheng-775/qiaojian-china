/* ==========================================================================
   桥见川渝 · 段落切分层
   前端负责切分并生成稳定 id，保证中英对照与「选段改稿」的 1:1 对齐。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.segments = (function () {
  "use strict";

  /* 长文本按句切分（供免费接口单次长度限制用，从原 app.js 迁移复用） */
  function splitText(text, maxLen) {
    if (!text) return [];
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

  /* 按段落切分，生成稳定 id（p1, p2, ...）。
     优先按空行切，其次按换行，最后按句末标点。 */
  function splitSegments(text) {
    var raw = splitBlocks(text);
    return raw.map(function (block, i) {
      return { id: "p" + (i + 1), source: block.trim(), translation: "" };
    }).filter(function (seg) { return seg.source.length > 0; });
  }

  function splitBlocks(text) {
    if (!text) return [];
    var t = text.trim();
    if (!t) return [];
    // 1) 空行切分
    var byBlank = t.split(/\n\s*\n/).map(trimLine).filter(Boolean);
    if (byBlank.length > 1) return byBlank;
    // 2) 单换行切分
    var byLine = t.split(/\n/).map(trimLine).filter(Boolean);
    if (byLine.length > 1) return byLine;
    // 3) 句末标点切分（尽量每段 1–2 句）
    return splitText(t, 120);
  }

  function trimLine(s) { return s.replace(/\r/g, "").trim(); }

  return {
    splitText: splitText,
    splitSegments: splitSegments
  };
})();
