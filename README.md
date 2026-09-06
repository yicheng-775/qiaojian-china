# 桥见中国 · CHINA-BRIDGE

AI 赋能的当代中国民间叙事跨文化传播实践 —— 项目网站与 AI 跨文化编辑辅助工具原型。

纯静态、零依赖、无需构建，可直接部署到任意静态托管平台。

## 目录结构

```
qiaojian-china/
├── index.html        # 项目落地页（概况 / 痛点 / 方案 / 团队 / 成果 / 文献）
├── demo.html         # AI 跨文化编辑工具原型（五步交互流程）
├── css/
│   └── style.css     # 共享设计系统
├── js/
│   ├── data.js       # 数据层：文化敏感点词典 + 内置对照案例（中英日德）
│   └── demo.js       # 工具交互逻辑（词典匹配 / 高亮 / 诊断 / 改写 / 对照输出）
└── README.md
```

## 本地预览

任选其一：

```bash
# 方式一：Python
cd qiaojian-china
python -m http.server 8080
# 浏览器打开 http://localhost:8080

# 方式二：Node（若已安装 npx）
npx serve .
```

也可以直接双击 `index.html` 用浏览器打开（无需服务器即可运行）。

## 免费部署

网站是纯静态文件，以下任意平台均可免费部署（拖拽文件夹即可上线）：

### 1. Vercel（推荐，最快）

1. 访问 <https://vercel.com>，用 GitHub / 邮箱注册登录。
2. 控制台点击 **Add New → Project**。
3. 若用 GitHub：把本文件夹推到仓库后导入；**更简单**：选择 **"Import from Folder"** 或直接把 `qiaojian-china` 文件夹拖到 Vercel 页面。
4. 框架选 **Other**（静态站点），无需任何构建命令，直接 **Deploy**。
5. 完成后获得 `https://你的项目名.vercel.app` 公网链接。

### 2. Netlify

1. 访问 <https://app.netlify.com>，注册登录。
2. 打开 **Sites → Add new site → Deploy manually**，把整个 `qiaojian-china` 文件夹拖入上传区。
3. 无需构建配置，几秒后生成 `https://xxx.netlify.app` 链接。

### 3. GitHub Pages

1. 新建 GitHub 仓库，把 `qiaojian-china` 里的**全部文件**上传到仓库根目录。
2. 仓库 **Settings → Pages**，Source 选 `main` 分支、根目录 `/`，保存。
3. 访问 `https://你的用户名.github.io/仓库名/`。

### 4. Cloudflare Pages

1. 访问 <https://pages.cloudflare.com>，登录。
2. **Create a project → Direct Upload**，拖入文件夹，构建命令留空。
3. 获得 `https://xxx.pages.dev` 链接。

> 说明：以上平台均有免费额度，静态站点零成本。自定义域名可在各平台设置中绑定。

## 关于「不接入 API」

当前版本为纯前端演示原型：文化敏感点识别基于内置词典规则匹配，多语种译文为预先编校的演示样本。
后续如需接入真实 AI，可在 `js/demo.js` 的 `parseAndRender()` 与 `renderLang()` 中替换为对后端 / 大模型 API 的调用。
