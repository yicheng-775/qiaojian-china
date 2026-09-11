/* ==========================================================================
   桥见巴渝 · 渲染层
   中英对照视图、文化词高亮、选段与更新高亮。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.render = (function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 全文词典匹配：返回 [{start,end,term,category,level,reason,suggestions}]，
     重叠处保留先出现者（翻译高亮与文化检索词卡共用）。 */
  function findMatches(text) {
    var matches = [];
    (QJC.dictionary || []).forEach(function (entry) {
      var idx = 0;
      while (true) {
        var pos = text.indexOf(entry.term, idx);
        if (pos === -1) break;
        matches.push({
          start: pos, end: pos + entry.term.length, term: entry.term,
          category: entry.category, level: entry.level,
          reason: entry.reason,
          suggestions: entry.suggestions ? entry.suggestions.slice() : []
        });
        idx = pos + entry.term.length;
      }
    });
    matches.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var filtered = [], lastEnd = -1;
    matches.forEach(function (m) { if (m.start >= lastEnd) { filtered.push(m); lastEnd = m.end; } });
    return filtered;
  }

  /* 对单段 source 做词典匹配，返回该段内的高亮 HTML */
  function highlightSegment(source, globalMatches) {
    var hits = findMatches(source).map(function (m) {
      return { start: m.start, end: m.end, term: m.term, category: m.category, level: m.level };
    });
    if (!hits.length) return esc(source);

    var html = "", last = 0;
    hits.forEach(function (h) {
      html += esc(source.slice(last, h.start));
      html += '<mark class="hl ' + h.category + '" data-term="' + esc(h.term) + '" title="' + QJC.i18n.t("risk") + ' ' + h.level + '">' + esc(h.term) + '</mark>';
      last = h.end;
    });
    html += esc(source.slice(last));
    return html;
  }

  /* 渲染中英对照（左栏） */
  function renderCompare(state, container) {
    if (!container) return;
    if (!state.segments || !state.segments.length) { container.innerHTML = ""; return; }
    var html = "";
    state.segments.forEach(function (seg, i) {
      var selected = state.selectedIds && state.selectedIds.indexOf(seg.id) !== -1;
      var srcHtml = highlightSegment(seg.source, state.matches);
      var trHtml;
      if (seg.translation) {
        if (seg.prevTranslation && seg.prevTranslation !== seg.translation) {
          trHtml = '<span class="seg-old">' + esc(seg.prevTranslation) + '</span>' +
                   '<span class="seg-new">' + esc(seg.translation) + '</span>';
        } else {
          trHtml = esc(seg.translation);
        }
      } else {
        trHtml = '<span class="seg-translating">' + QJC.i18n.t(state.translateFailed ? "segFailed" : "segTranslating") + '</span>';
      }
      html += '<div class="seg' + (selected ? " selected" : "") + '" data-id="' + esc(seg.id) + '">' +
        '<div class="seg-head"><span class="seg-no">' + (i + 1) + '</span>' +
        (selected ? '<span class="seg-tag">' + QJC.i18n.t("segEditing") + '</span>' : '') + '</div>' +
        '<div class="seg-source">' + srcHtml + '</div>' +
        '<div class="seg-translation">' + trHtml + '</div>' +
      '</div>';
    });
    container.innerHTML = html;
  }

  /* 更新选中/高亮：重渲染 + 给被更新的段加短暂高亮 */
  function applyUpdate(state, container, updatedIds) {
    renderCompare(state, container);
    (updatedIds || []).forEach(function (id) {
      var el = container.querySelector('.seg[data-id="' + id + '"]');
      if (el) {
        el.classList.add("seg-updated");
        setTimeout(function () { el.classList.remove("seg-updated"); }, 2400);
      }
    });
  }

  return {
    esc: esc,
    findMatches: findMatches,
    highlightSegment: highlightSegment,
    renderCompare: renderCompare,
    applyUpdate: applyUpdate
  };
})();
