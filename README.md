# 桥见中国 · AI 跨文化编辑助手

面向内容创作者的跨文化编辑工具：粘贴中文原稿，自动识别外国人容易误读的文化表达，
给出可落地的改写建议与中、英、日、德多语种版本。

纯静态、零依赖、无需构建，可直接部署到任意静态托管平台。

## 目录结构

```
qiaojian-china/
├── index.html        # 工具主页（打开即用：粘贴 → 分析 → 结果）
├── about.html        # 项目介绍（背景 / 方案 / 团队 / 文献）
├── css/
│   └── style.css     # 共享设计系统
├── js/
│   ├── data.js       # 数据层：文化敏感点词典 + 内置对照案例（中英日德）
│   └── app.js        # 工具交互逻辑（词典匹配 / 诊断 / 改写 / 多语种 / 高亮）
└── README.md
```

## 使用

打开首页 → 粘贴中文原稿（或点一个示例）→ 点「开始分析」→ 在四个结果页签中查看：
诊断报告 / 改写建议 / 多语种输出 / 原文高亮。

## 本地预览

```bash
cd qiaojian-china
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

或直接双击 `index.html`（无需服务器）。

## 部署

静态站点，可部署到 Vercel / Netlify / GitHub Pages / Cloudflare Pages / Gitee Pages 等。

> 提示：Vercel 的 `.vercel.app` 域名在国内大陆访问通常需要外网；若面向国内用户，
> 建议部署到 Gitee Pages 或腾讯云 COS 等国内可直连的平台。

## 关于「不接入 API」

当前为纯前端演示原型：文化敏感点识别基于内置词典规则匹配，多语种译文为预编样本。
后续接入真实 AI 时，替换 `js/app.js` 中的 `analyze()` 与 `renderLang()` 两个函数即可，界面无需改动。
