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
版本号以 git tag 为准，关于页显示形如 `v0.4.0-4（43e0cc1 · 2026-11-09）`（tag + 距该 tag 的提交数 + 提交 ID + 提交日期），发布流程由 AI 自动执行：
1. 更新 `package.json` 中的 `"version"` 字段（需与 tag 一致，仅作构建兜底）。
2. 更新 `CHANGELOG.md`，在顶部按 `## <版本号> <日期>` 格式新增条目。
3. 打上对应版本号的 git tag（如 `v0.4.0`）。
4. 推送代码与 tag：`git push origin main --tags`。

注意：只推代码不打 tag 时，关于页会继续显示上一个 tag 的版本，提交数递增；`package.json` 与 tag 不一致时以 tag 为准。

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
    ui.js            — DOM 交互（Toast、模态框、主题切换、loading、复制）
    api/
      index.js       — Provider 基类 + 工厂函数 + 端点地址解析
      openai.js      — OpenAI 兼容提供商适配器
      responses.js   — OpenAI Responses API 提供商适配器
      claude.js      — Anthropic Claude 提供商适配器
  scss/styles.scss   — 全局样式（引入 bootstrap/scss 并合并自定义样式）
index.html           — 翻译页 UI 布局
settings.html        — 设置页 UI 布局
```

## 架构要点
- **双入口**：`index.html` → `src/js/main.js`（翻译页），`settings.html` → `src/js/settings-page.js`（设置页）。两页共用 `settings.js`、`ui.js` 与 `api/` 模块。
- **模块化**：`main.js` 仅负责翻译页编排，具体逻辑委托给各模块。`api/index.js` 定义 `Provider` 基类（`buildRequest` + `async *stream` + `static endpointPath`），各适配器继承后注册到工厂。
- **构建配置**：`vite.config.js` 通过 `define` 注入 `__APP_VERSION__`、`__GIT_COUNT__`、`__GIT_COMMIT__`、`__GIT_DATE__`（分别由 `git describe --tags --long`、`git rev-parse --short`、`git log -1 --format=%cs` 读取，git 不可用时自动降级），并通过 `rollupOptions.input` 配置多页构建（`index.html` + `settings.html`）；CI 的 checkout 需 `fetch-depth: 0` 才能取到 tag。
- **依赖**：`bootstrap`、`bootstrap-icons`、`@popperjs/core`；Vite 处理 ESM 导入。

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
- **模态框**：`ui.js` 提供通用 `Modal` 类封装 Bootstrap 模态框的 `show()`/`hide()`；具体元素查找与事件绑定由页面（如 `settings-page.js` 的重置确认框）负责。

## 注意事项
- **实验性项目**：代码注释与 README 均表明处于开发阶段，可能存在问题。
- **密钥安全**：应用明确提示 `localStorage` 存储 API 密钥不安全；修改相关逻辑时需保留此提示或采用更安全的替代方案。
- **无测试框架**：项目未配置任何测试或 lint 工具，修改后只需手动验证构建和页面功能。

## ⚠️ 临时：bootstrap-v6 分支处理规则
本节是临时规则，`bootstrap-v6` 合入 `main` 后即失效。**当用户要求把 `bootstrap-v6` 合并进 `main`，或声称已经合并时，必须先提醒用户：是否删除本节规则。**

- `bootstrap-v6` 是 Bootstrap 6 迁移试验分支，只在分支上继续推进；**禁止**把该分支合入 `main`，也**禁止** rebase 该分支。
- 保持同步：在 `bootstrap-v6` 上执行 `git merge main`（把 main 合进 v6），使 `main` 始终是它的祖先，将来合并可 fast-forward。
- 冲突处理：保留 v6 的类名与结构（如 `Dialog`、Bootstrap 6 组合类），采用 main 的文案与逻辑改动。
- 通用改动（如版本号显示、文档）同样要同步到该分支；推送前先在本地 `npm run build` 验证。
- v6 分支推送不会触发 GitHub Pages 部署（部署仅在 `main` 推送时触发）。
