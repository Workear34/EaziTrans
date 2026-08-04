# AGENTS.md — EaziTrans

## 项目概览
- **类型**：Vite 驱动的纯前端单页应用（SPA），无 UI 框架，所有 DOM 与逻辑集中在 `src/main.js`。
- **用途**：基于大模型 API（OpenAI 兼容协议）的 AI 翻译界面。
- **语言**：界面与注释均为中文。

## 开发命令
```bash
npm run dev      # 启动 Vite 开发服务器
npm run build    # 构建生产包（输出到 dist/）
npm run preview  # 预览生产构建
```

## 架构要点
- **入口**：`index.html` → `<script type="module" src="src/main.js"></script>`
- **无组件拆分**：全部 UI 写在 `index.html`，全部交互写在 `src/main.js`；`src/style.css` 仅作少量补充样式。
- **构建配置**：`vite.config.js` 通过 `define` 注入全局常量 `__APP_VERSION__`（读取自 `package.json`），代码中直接使用该常量展示版本号。
- **依赖**：`bootstrap`、`bootstrap-icons`、`@popperjs/core`；Vite 负责处理 CSS 与 JS 的 ESM 导入。

## 关键实现细节
- **设置持久化**：所有用户配置（API 地址、密钥、模型、System Prompt、User Prompt、主题）均保存在 `localStorage`。
- **流式翻译**：对 OpenAI 兼容接口发起 `stream: true` 的 POST 请求，使用 `ReadableStream` 逐段读取并实时填充译文文本框。
- **自动翻译**：`sourceText` 输入与语言选择变化时触发防抖（1 秒），自动执行翻译。
- **模型特殊逻辑**：若所选模型名包含 `qwen3` 或 `tencent/hunyuan-a13b-instruct`，请求体会额外附加 `enable_thinking: false`，否则这些模型会返回 400。
- **语言交换**：当源语言为“自动检测”时，交换语言按钮会被阻止并弹出提示。
- **主题切换**：提供浅色/深色/跟随系统三种选项。`auto` 模式下通过 `matchMedia('prefers-color-scheme: dark')` 实时响应系统主题变化；非 `auto` 模式下以用户手动选择为准。

## 注意事项
- **实验性项目**：代码注释与 README 均表明处于开发阶段，可能存在问题。
- **密钥安全**：应用明确提示 `localStorage` 存储 API 密钥不安全；修改相关逻辑时需保留此提示或采用更安全的替代方案。
- **无测试框架**：项目未配置任何测试或 lint 工具，修改后只需手动验证构建和页面功能。
