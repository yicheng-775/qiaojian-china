// ============================================================================
// 桥见川渝 · DeepSeek 代理（Netlify Function，零依赖，Node 18+ 原生 fetch）
//
// 作用：浏览器直连 DeepSeek 会被 CORS 拦截，这里做云端中转。
//   - key 优先读 Netlify 环境变量 DEEPSEEK_API_KEY（更安全，推荐）；
//     没设置则用下面的默认值（内置 key，便于零配置部署）。
//   - 校验访问密码 AUTH_PASSWORD，防止他人盗刷内置 key。
// ============================================================================

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const AUTH_PASSWORD = "77522";

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

  // key 通过环境变量 DEEPSEEK_API_KEY 配置（不进代码仓库，避免泄露）
  if (!DEEPSEEK_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "未配置 DEEPSEEK_API_KEY 环境变量" }) };
  }

  // 转发 DeepSeek
  const body = {
    model: payload.model || "deepseek-v4-flash",
    messages: payload.messages || [],
    temperature: payload.temperature != null ? payload.temperature : 0.3,
    response_format: { type: "json_object" },
    stream: false,
  };

  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + DEEPSEEK_API_KEY,
      },
      body: JSON.stringify(body),
    });

    let data;
    try { data = await resp.json(); } catch (e) { data = { error: "non-json response" }; }

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify({ ok: false, error: "DeepSeek error: " + JSON.stringify(data).slice(0, 300) }),
      };
    }

    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "DeepSeek 返回为空" }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, content: content }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "call failed: " + String(e) }) };
  }
};
