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
    // 15 秒超时保护，避免无限挂起
    req.setTimeout(15000, function () { req.destroy(new Error("DeepSeek 请求超时")); });
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

  try {
    const result = await callDeepSeek(apiKey, payload);

    let parsed;
    try { parsed = JSON.parse(result.data); } catch (e) { parsed = { error: "non-json response" }; }

    if (result.status !== 200) {
      return {
        statusCode: result.status,
        headers,
        body: JSON.stringify({ ok: false, error: "DeepSeek error: " + JSON.stringify(parsed).slice(0, 300) }),
      };
    }

    const content = parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
    if (!content) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "DeepSeek 返回为空" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, content: content }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "call failed: " + String(e) }) };
  }
};
