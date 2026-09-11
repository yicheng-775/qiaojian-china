# 桥见巴渝 · AI 改稿助手

面向内容创作者的**巴渝中译英 AI 改稿工作台**：粘贴中文原稿，自动识别巴渝文化表达、生成英文译文，并可针对任意段落**对话协商改稿**，同时累积生成你的**写作画像**。

- 纯静态、零构建、零依赖，可直接部署到任意静态托管平台。
- **双模式**：不配 key 也能用（词典识别 + 免费机翻）；启动本地脚本解锁 DeepSeek AI 改稿。

## 目录结构

```
qiaojian-china/
├── index.html        # 工具主页（输入 → 中英对照 + 对话改稿）
├── profile.html      # 我的写作画像（占比图 + 导入/导出）
├── about.html        # 项目介绍（桥见巴渝）
├── css/style.css     # 设计系统 + 组件样式
├── js/
│   ├── config.js     # 模型 / 代理地址 / 常量
│   ├── data.js       # 巴渝词典、双语案例、领域/体裁/风格枚举
│   ├── storage.js    # localStorage 读写 + 导入导出
│   ├── prompts.js    # 四套 DeepSeek prompt
│   ├── segments.js   # 段落切分/对齐
│   ├── api.js        # 适配器（AI / 兜底双模式分发）
│   ├── profile.js    # 画像累积 / 占比 / 画像上下文
│   ├── render.js     # 中英对照渲染 / 文化词高亮
│   ├── chat.js       # 对话改稿侧栏
│   └── app.js        # 主链路
├── run.py            # 本地 AI 代理（Python 标准库，无第三方依赖）
├── run-ai.bat        # 双击启动本地 AI 代理（Windows）
├── key.txt.example   # DeepSeek key 配置示例
└── README.md
```

## 使用（两种模式）

### 兜底模式（零配置，打开即用）

直接用浏览器打开 `index.html`（或部署后访问），粘贴中文原稿 → 点「开始翻译」：

- 文化表达识别基于内置巴渝词典（火锅、洪崖洞、棒棒军、变脸……）
- 英文初稿由 MyMemory 免费接口生成
- 此时「对话改稿」侧栏会提示启动本地脚本解锁 AI

### AI 模式（DeepSeek，含对话改稿 + 用户画像）

1. 复制 `key.txt.example` → 重命名为 `key.txt`，填入你的 [DeepSeek API key](https://platform.deepseek.com/)。
2. 双击 `run-ai.bat`（或命令行执行 `python run.py`）。
3. 浏览器打开 <http://localhost:8000>，顶栏徽标变为「AI 模式 · DeepSeek」。

AI 模式解锁：①英文译文的文化适配改写 ②点击某段 → 对话改稿 ③自动累积领域/体裁/写作风格画像。

> 说明：DeepSeek 官方 API 不允许浏览器直连（CORS），所以用本地 `run.py` 做中转，key 只存在本机、绝不上传到公开网站。将来要公开部署 AI 能力时，把 `js/config.js` 里的 `AI_PROXY` 改成云端云函数地址即可，前端代码无需改动。

## 本地预览

```bash
cd qiaojian-china
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 部署

纯静态站点，可部署到 **Gitee Pages**（国内直连）、GitHub Pages、Netlify 等任意静态托管平台。

> 面向国内用户建议用 Gitee Pages（国内可直连）；Vercel 的 `.vercel.app` 域名在大陆通常需外网。

## 用户画像

每次翻译（AI 模式）会自动累积三层画像，在 `profile.html` 查看：

1. **领域×体裁**（写什么）：时政/财经/社会/文化/文旅/体育/法制/科技 × 消息/通讯/特写/专访/评论。
2. **写作风格**（怎么写，核心）：语体、情感基调、句式节奏、修辞手法、成语密度、口语化、叙事视角、结构组织 8 个维度。
3. **习惯偏好**（元习惯）：目标读者、语气、注释偏好、已确认术语、禁用译法等。

画像会反向注入 AI 改稿 prompt，让译文贴合你的写作风格；支持导出/导入 `.json` 备份。
