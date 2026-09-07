// ============================================================================
// 桥见川渝 · DeepSeek 代理（Netlify Function，零依赖，Node 内置 https 模块）
//
// 作用：浏览器直连 DeepSeek 会被 CORS 拦截，这里做云端中转。
//   - key 由前端用户自填并经请求体传入（payload.key），可选回退环境变量。
//   - 校验访问密码 AUTH_PASSWORD，防止陌生人刷免费额度。
// 注意：用 Node 内置 https 而非 fetch，任何 Node 版本（含 <18）都能跑，避免 502。
// ============================================================================

const https = require("https");
const { URL } = require("url");

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const AUTH_PASSWORD = "77522";

// 用 https 模块调用 DeepSeek，返回 Promise<{ status, data }>
function callDeepSeek(apiKey, payload) {
  return new Promise(function (resolve, reject) {
    const body = JSON.stringify({
      model: payload.model || "deepseek-v4-flash",
      messages: payload.messages || [],
      temperature: payload.temperature != null ? payload.temperature : 0.3,
      // 显式放宽输出上限，避免长文翻译时 JSON 被截断导致前端解析失败
      max_tokens: payload.max_tokens || 16384,
      // deepseek-v4 默认开启思考链（reasoning），改稿会先生成超长思考导致超时，
      // 这里显式关闭，让模型直接输出，加速返回。
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      stream: false,
    });

    const url = new URL(DEEPSEEK_URL);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "Content-Length": Buffer.byteLength(body),
      },
    }, function (res) {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", function (chunk) { data += chunk; });
      res.on("end", function () { resolve({ status: res.statusCode, data: data }); });
    });

    req.on("error", function (e) { reject(e); });
    // 8 秒超时保护：Netlify 免费版函数硬上限 10 秒，必须在平台强杀前主动返回
    req.setTimeout(8000, function () { req.destroy(new Error("AI 响应超时（8 秒无返回）")); });
    req.write(body);
    req.end();
  });
}

exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };

  // CORS 预检
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // 健康探测（前端 probeAI 用 GET 判断 AI 是否可用）
  if (event.httpMethod === "GET") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, service: "qiaojian-ai" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: "method not allowed" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "请求体解析失败" }) };
  }

  // 访问密码校验（与前端登录门一致）
  if (payload.password !== AUTH_PASSWORD) {
    return { statusCode: 403, headers, body: JSON.stringify({ ok: false, error: "访问密码错误" }) };
  }

  // key：优先用户自填（payload.key），可回退环境变量（可选）
  const apiKey = payload.key || DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "未填写 DeepSeek API key" }) };
  }

  // 自动重试：DeepSeek 偶发「提前停止」→ 返回半截 JSON（finish_reason 仍是 stop）。
  // 检测到输出不完整就重试一次（共 2 次）。正常情况只调 1 次、不多花积分；
  // 只在明确失败信号（非 200 / 内容为空 / 截断 / JSON 未闭合）下才补调一次。
  const MAX_ATTEMPTS = 2;
  let lastError = "未知错误";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const result = await callDeepSeek(apiKey, payload);

      let parsed = null;
      try { parsed = JSON.parse(result.data); } catch (e) { /* non-json */ }

      if (result.status !== 200) {
        lastError = "DeepSeek error: " + JSON.stringify(parsed || {}).slice(0, 300);
        continue;
      }

      const choice = parsed && parsed.choices && parsed.choices[0];
      const content = choice && choice.message && choice.message.content;
      if (!content) { lastError = "DeepSeek 返回为空"; continue; }

      // finish_reason=length：被 max_tokens 截断。可能真太长，也可能偶发，重试一次
      if (choice.finish_reason === "length") {
        lastError = "翻译内容过长，输出被截断，请缩短文章后重试";
        continue;
      }

      // 核心修复：content 已完整返回但 JSON 未闭合 → 偶发提前停止，重试
      let complete = true;
      try { JSON.parse(content); } catch (e) { complete = false; }
      if (!complete) {
        lastError = "AI 输出不完整（片段：" + content.slice(0, 200) + "）";
        continue;
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, content: content }) };
    } catch (e) {
      lastError = "call failed: " + String(e);
      if (String(e).indexOf("超时") !== -1) break; // 超时不再重试（Netlify 10s 上限内重试也来不及）
    }
  }

  return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: lastError }) };
};
