/* ==========================================================================
  桥见巴渝 · 文化检索层
  输入文字 → 识别文化词 → 词卡基础讲解（离线词典 reason）→ 对话追问（AI）。
  与翻译板块共用 QJC.render.findMatches；此处只负责检索渲染与命中摘要。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.culture = (function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 命中摘要：注入「文化检索追问」prompt 的一句话概括 */
  function summarizeMatches(matches) {
    return (matches || []).map(function (m) {
      var region = (QJC.regionNames && QJC.regionNames[m.region]) || m.region || "";
      return "「" + m.term + "」" +
        (region ? "（" + region + "）" : "") +
        (m.level ? "[" + m.level + "风险]" : "");
    }).join("、");
  }

  /* 词卡渲染：每卡含 term/category/region/level + reason 正文 + 译法建议 + 追问按钮 */
  function renderExplanation(state, container) {
    if (!container) return;
    var matches = state.matches || [];
    if (!matches.length) {
      container.innerHTML = '<div class="culture-empty">' + QJC.i18n.t("cultureEmpty") + '</div>';
      return;
    }
    var html = "";
    matches.forEach(function (m) {
      var regionName = (QJC.regionNames && QJC.regionNames[m.region]) || m.region || "";
      var catName = (QJC.categoryNames && QJC.categoryNames[m.category]) || m.category || "";
      var sugs = (m.suggestions && m.suggestions.length)
        ? '<ul class="culture-sugs">' + m.suggestions.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ul>'
        : '';
      html +=
        '<div class="culture-card">' +
          '<div class="culture-card-head">' +
            '<span class="culture-term">' + esc(m.term) + '</span>' +
            '<span class="culture-chip">' + esc(catName) + '</span>' +
            (regionName ? '<span class="culture-chip culture-chip-region">' + esc(regionName) + '</span>' : '') +
            '<span class="culture-chip culture-chip-level">' + QJC.i18n.t("risk") + ' ' + esc(m.level || "") + '</span>' +
          '</div>' +
          '<p class="culture-reason">' + esc(m.reason || "") + '</p>' +
          sugs +
          '<button class="culture-ask" data-term="' + esc(m.term) + '" type="button">' + QJC.i18n.t("cultureAskBtn", { term: esc(m.term) }) + '</button>' +
        '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll(".culture-ask").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var term = btn.getAttribute("data-term");
        var input = document.getElementById("chatInput");
        if (input) {
          input.value = QJC.i18n.t("cultureAskPre", { term: term });
          input.focus();
        }
      });
    });
  }

  return {
    summarizeMatches: summarizeMatches,
    renderExplanation: renderExplanation
  };
})();
