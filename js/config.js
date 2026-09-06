/* ==========================================================================
   桥见川渝 · 配置层
   模型、API 代理地址、全局常量。改动这里即可切换 AI 后端。
   ========================================================================== */

var QJC = window.QJC = window.QJC || {};

QJC.config = {
  /* DeepSeek 模型（deepseek-chat 别名已弃用，改用 deepseek-v4-flash） */
  model: "deepseek-v4-flash",

  /* AI 端点候选（probeAI 依次探测，第一个连通的作为活动端点）：
     1) 本地 run.py（开发时双击 run-ai.bat，走 localhost:8000）
     2) Netlify Function（部署到 Netlify 后，走 /.netlify/functions/ai） */
  AI_ENDPOINTS: [
    { probe: "http://localhost:8000/api/ai/health", endpoint: "http://localhost:8000/api/ai" },
    { probe: "/.netlify/functions/ai", endpoint: "/.netlify/functions/ai" }
  ],

  /* MyMemory 免费翻译接口（兜底模式，无需密钥） */
  MYMEMORY: "https://api.mymemory.translated.net/get",

  /* 访问密码：前端登录门 + 代理层校验（防止他人盗用内置 key）。
     前端明文仅为「防君子」，真正的拦截在 run.py 端。 */
  authPassword: "77522",

  /* 各任务温度 */
  temperature: {
    translate: 0.3,
    rewrite: 0.5,
    classify: 0.1,
    profile: 0.2
  },

  /* 单段 / 单次文本长度上限（防 token 滥用） */
  maxChunkLen: 400,
  maxSourceLen: 20000,

  /* 历史记录上限 */
  historyLimit: 50,

  /* 对话偏好提取阈值：每 N 轮对话触发一次 AI 提取 */
  prefExtractEvery: 5
};
