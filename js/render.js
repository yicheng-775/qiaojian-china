/* ==========================================================================
   桥见川渝 · 渲染层
   中英对照视图、文化词高亮、选段与更新高亮。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.render = (function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 对单段 source 做词典匹配，返回该段内的高亮 HTML */
  function highlightSegment(source, globalMatches) {
    // 找出落在该段内的词条（按 term 在段内查找）
    var hits = [];
    (QJC.dictionary || []).forEach(function (entry) {
      var idx = 0;
      while (true) {
        var pos = source.indexOf(entry.term, idx);
        if (pos === -1) break;
        hits.push({ start: pos, end: pos + entry.term.length, term: entry.term, category: entry.category, level: entry.level });
        idx = pos + entry.term.length;
      }
    });
    if (!hits.length) return esc(source);
    hits.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var filtered = [], lastEnd = -1;
    hits.forEach(function (h) { if (h.start >= lastEnd) { filtered.push(h); lastEnd = h.end; } });

    var html = "", last = 0;
    filtered.forEach(function (h) {
      html += esc(source.slice(last, h.start));
      html += '<mark class="hl ' + h.category + '" data-term="' + esc(h.term) + '" title="风险 ' + h.level + '">' + esc(h.term) + '</mark>';
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
        trHtml = '<span class="seg-translating">' + (state.translateFailed ? '翻译失败，请重试' : '翻译中…') + '</span>';
      }
      html += '<div class="seg' + (selected ? " selected" : "") + '" data-id="' + esc(seg.id) + '">' +
        '<div class="seg-head"><span class="seg-no">' + (i + 1) + '</span>' +
        (selected ? '<span class="seg-tag">编辑中</span>' : '') + '</div>' +
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
    highlightSegment: highlightSegment,
    renderCompare: renderCompare,
    applyUpdate: applyUpdate
  };
})();
