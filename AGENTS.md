# AGENTS.md — EaziTrans

## 项目概览
- **类型**：Vite 驱动的纯前端应用，无 UI 框架，采用模块化 JS 架构，含两个页面（翻译页 + 设置页）。
- **用途**：基于大模型 API（OpenAI 兼容 + Anthropic Claude）的 AI 翻译界面。
- **语言**：界面与注释均为中文。

## 开发命令
```bash
npm run dev      # 启动 Vite 开发服务器
npm run build    # 构建生产包（输出到 dist/）
npm run preview  # 预览生产构建
```

## 版本发布
当用户要求发布版本时，按以下顺序执行：
1. 更新 `package.json` 中的 `"version"` 字段。
2. 更新 `CHANGELOG.md`，在顶部按 `## <版本号> <日期>` 格式新增条目。
3. 打上对应版本号的 git tag（如 `v0.4.0`）。

## Commit 规范
- 提交信息使用 `<类型>: <中文说明>` 格式。
- 新功能使用 `feat:`，问题修复使用 `fix:`；冒号后的说明必须使用中文。
- 示例：`feat: 增加文件翻译功能`、`fix: 修复译文面板空白问题`。

## 文件结构
```
src/
  js/
    main.js          — 翻译页入口：初始化、事件绑定、翻译调度
    settings-page.js — 设置页入口：表单回填、改动即自动保存
    settings.js      — 设置管理（localStorage 读写、语言映射）
    ui.js            — DOM 交互（Toast、对话框、主题切换、loading、复制）+ Bootstrap 组件按需注册
    api/
      index.js       — Provider 基类 + 工厂函数 + 端点地址解析
      openai.js      — OpenAI 兼容提供商适配器
      responses.js   — OpenAI Responses API 提供商适配器
      claude.js      — Anthropic Claude 提供商适配器
  scss/styles.scss   — 全局样式（@use 引入 bootstrap/scss 并合并自定义样式）
index.html           — 翻译页 UI 布局
settings.html        — 设置页 UI 布局
```

## 架构要点
- **双入口**：`index.html` → `src/js/main.js`（翻译页），`settings.html` → `src/js/settings-page.js`（设置页）。两页共用 `settings.js`、`ui.js` 与 `api/` 模块。
- **模块化**：`main.js` 仅负责翻译页编排，具体逻辑委托给各模块。`api/index.js` 定义 `Provider` 基类（`buildRequest` + `async *stream` + `static endpointPath`），各适配器继承后注册到工厂。
- **构建配置**：`vite.config.js` 通过 `define` 注入全局常量 `__APP_VERSION__`（读取自 `package.json`），并通过 `rollupOptions.input` 配置多页构建（`index.html` + `settings.html`）。
- **依赖**：`bootstrap`（固定 `6.0.0-alpha.1`）、`bootstrap-icons`、`@floating-ui/dom`；Vite 处理 ESM 导入。Bootstrap 6 为纯 ESM，且不再需要 `@popperjs/core`（已由 `@floating-ui/dom` 取代）。

## 关键实现细节
- **设置持久化**：`settings.js` 管理所有配置（API 地址、密钥、模型、System Prompt、User Prompt、主题、提供商），通过 `localStorage` 读写，新增 `provider` key。
- **设置自动保存**：`settings-page.js` 监听表单各控件的 `input`/`change` 事件，改动即调用 `saveSettings()` 写入 localStorage，无保存按钮；`apiUrl` 失焦时校验 URL 格式。
- **提供商架构**：`createProvider(name)` 工厂函数返回对应实例，新增提供商只需新建 `api/xxx.js` 实现 `Provider` 接口并注册。当前支持 `openai`、`openai-responses` 和 `claude`。
- **端点地址解析**：`resolveEndpointUrl(baseUrl, path)` 将用户配置的 API 基础地址（如 `https://api.deepseek.com`）与提供商 `endpointPath`（`/chat/completions`、`/responses`、`/v1/messages`）拼接为实际请求地址；末尾斜杠归一化，若地址已含完整路径则原样使用。
- **流式翻译**：`translate()` 函数调用 `provider.buildRequest()` 构建请求 → `resolveEndpointUrl()` 解析端点 → `fetch` → `provider.stream()` 流式读取并实时填充译文文本框。
- **OpenAI 适配器**：构建 Chat Completions 请求体；附加 `thinking: { type: 'disabled' }` 显式关闭思考模式（DeepSeek v4 默认开启）；SSE 解析 `data:` 行 + `[DONE]` 结束。
- **OpenAI Responses 适配器**：构建 Responses API 请求体（顶层 `instructions`、`input` 数组、`stream: true`、`reasoning: { effort: 'none' }` 关闭思考模式）；SSE 解析 `event:` + `data:` 配对，提取 `response.output_text.delta` 的 `delta`，`response.completed` 结束。
- **Claude 适配器**：构建 Messages API 请求体（`max_tokens: 4096`，顶层 `system` 字段）；思考模式为 opt-in，不传 `thinking` 字段即关闭；认证使用 `x-api-key` + `anthropic-version`；SSE 解析 `event:` + `data:` 配对格式，提取 `content_block_delta` 中的 `delta.text`。
- **自动翻译**：`sourceText` 输入与语言选择变化时触发防抖（1 秒），自动执行翻译。
- **语言交换**：源语言为“自动检测”时阻止交换并弹出提示。
- **主题切换**：`ui.js` 提供浅色/深色/跟随系统三种选项，`auto` 模式下通过 `matchMedia` 实时响应系统主题变化。
- **对话框**：`ui.js` 提供通用 `Dialog` 类（v5 的 `Modal` 在 v6 更名）封装 Bootstrap 对话框的 `show()`/`hide()`；具体元素查找与事件绑定由页面（如 `settings-page.js` 的重置确认框）负责。

## Bootstrap 6 约定（迁移后需遵守）
- **CSS 令牌不带前缀**：项目自行编译 Bootstrap 源码，因此 `--bs-*` 前缀不存在。自定义样式中写 `var(--border-color)`、`var(--card-spacer-y)`、`var(--radius-5)`、`var(--primary-base)`；**不要**再写 `--bs-*`（那是 dist/CDN 版经 PostCSS 加前缀后的结果）。
- **断点/状态语法改为前缀 + 冒号**：`col-md-6` → `md:col-6`、`navbar-expand-lg` → `lg:navbar-expand`、`d-md-none` → `md:d-none`；`xxl` 更名为 `2xl`，`lg` 断点由 992px 变为 1024px。
- **间距刻度已变**：v5 的 `2/3/4/5` 对应 v6 的 `3/5/7/12`。新增代码改动间距时按 v6 刻度书写。
- **组件更名**：Modal → Dialog（原生 `<dialog>`）、Offcanvas → Drawer（原生 `<dialog class="drawer">`）、Dropdown → Menu；`data-bs-toggle` 同步改为 `dialog`/`drawer`/`menu`，v5 的 `data-bs-toggle="pill"` 已失效，必须写 `tab`。
- **按钮改为组合类**：`btn-primary` → `btn-solid theme-primary`，`btn-outline-secondary` → `btn-outline theme-secondary`（`.btn` 基类无需重复书写）。颜色工具类 `text-*` → `fg-*`，`bg-body-tertiary` → `bg-1`~`bg-4`。
- **CSS 级联层**：Bootstrap 组件样式包裹在 `@layer` 中，`styles.scss` 中的自定义样式不在任何层内，天然优先，覆盖时无需提高选择器权重。
- **按需导入组件**：`ui.js` 只导入用到的 `bootstrap/js/dist/*.js`（导入即完成该组件的数据 API 注册）。不要改回 `import * as bootstrap from 'bootstrap'`，那会把 Datepicker 等未用组件及其 `vanilla-calendar-pro` 依赖打进产物。

## 注意事项
- **实验性项目**：代码注释与 README 均表明处于开发阶段，可能存在问题。
- **密钥安全**：应用明确提示 `localStorage` 存储 API 密钥不安全；修改相关逻辑时需保留此提示或采用更安全的替代方案。
- **无测试框架**：项目未配置任何测试或 lint 工具，修改后只需手动验证构建和页面功能。
