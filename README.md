# EaziTrans

一个基于大模型的 AI 翻译界面实现。

## 在线体验

https://workear34.github.io/EaziTrans/

> 该在线版本由 `main` 分支自动部署，即 **Bootstrap 5.3.8** 版本。本文档的 Bootstrap 6 迁移内容位于 `bootstrap-v6` 分支，**尚未合并到 `main`**，因此线上暂时看不到迁移后的效果。

## **声明：**

**1. 本项目为实验性项目，可能会存在问题，且随时可能暂停/停止开发。**

**2. 请保管好您的 API 密钥，目前项目使用并不安全的 localStorage 存储密钥，后续会改进密钥存储方式。**

**3. 由于本人水平和时间有限，目前代码大量依赖 AI Agent 辅助创作，因此代码质量较低。计划未来会逐步减少 AI 生成的代码。**

## 特点

- 支持自动识别语言和多种语言互译
- 兼容 Open AI Chat Completions API/Responses API + Anthropic API协议
- Bootstrap 带来的简洁美观的响应式界面
- Prompt 自定义功能
- 界面交互简单易用
- 源代码开放

## 使用技术

- AI Agent 辅助创作
- Bootstrap 6（`6.0.0-alpha.1`，实验性）
- Bootstrap Icons
- Vite

## 运行 & 构建方法

1. `git clone` 项目到本地
2. 运行 `npm run dev` 查看
3. 运行 `npm run build` 构建
4. 构建后将 `dist` 目录下的所有文件拷贝到服务器根目录中

## Bootstrap 6 迁移说明

本分支（`bootstrap-v6`）已将界面框架从 Bootstrap 5.3 迁移到 **Bootstrap 6.0.0-alpha.1**。

由于该版本目前仍是 **alpha**，上游随时可能调整 API，因此这次迁移**尚未合并到 `main`** —— `main` 上依然是 Bootstrap 5.3.8，可正常使用。本分支的定位是试验与评估。

### 主要变化

| 方面 | Bootstrap 5（`main`） | 本分支（Bootstrap 6） |
| --- | --- | --- |
| 依赖 | `bootstrap@^5.3.8` + `@popperjs/core` | `bootstrap@6.0.0-alpha.1` + `@floating-ui/dom` |
| 模块格式 | ESM / UMD 并存，存在 `window.bootstrap` | 纯 ESM，无全局对象，组件按需导入 |
| Sass 引入 | `@import "bootstrap/scss/bootstrap"` | `@use "bootstrap/scss/bootstrap" as bs` |
| CSS 变量 | 带前缀，如 `--bs-border-color` | **去掉 `--bs-` 前缀**，写作 `--border-color` |
| 响应式语法 | `col-md-6`、`navbar-expand-lg` | `md:col-6`、`lg:navbar-expand`（前缀 + 冒号） |
| 断点取值 | lg = 992px、xxl = 1400px | lg = 1024px、`2xl` = 1536px |
| 间距刻度 | 键 `3` = 1rem | 键 `5` = 1rem（整体后移） |
| 模态框 | `.modal` + `.modal-dialog` + `.modal-content` | 原生 `<dialog class="dialog">`，外层包裹已删除 |
| 侧边栏 | `.offcanvas` | 原生 `<dialog class="drawer">` |
| 下拉菜单 | `.dropdown-menu` | `.menu` |
| 导航栏折叠 | `.collapse` + `.navbar-collapse` | `<dialog class="drawer">` + `lg:navbar-expand` |
| 标签页切换 | `data-bs-toggle="pill"` | `data-bs-toggle="tab"`（`pill` 已失效） |
| 按钮 | `btn-primary`、`btn-outline-secondary` | `btn-solid theme-primary`、`btn-outline theme-secondary` |
| 文字颜色 | `text-primary`、`text-muted` | `fg-primary`、`fg-secondary` |
| 页面背景 | `bg-body-tertiary` | `bg-1` ~ `bg-4` |
| 复选框 / 开关 | `.form-check` + `.form-check-input`、`.form-switch` | `.form-field` + `.check` / `.radio` / `.switch` |
| 下拉框 | `<select class="form-select">` | `<select class="form-control">` |
| 字号 | `.fs-1` ~ `.fs-6` | `.fs-xs` ~ `.fs-6xl` |
| 按钮加载图标 | `.spinner-border-sm` | `.spinner-sm` |

### 注意事项

**1. 对浏览器版本有较高要求**

Bootstrap 6 大量依赖较新的 CSS 能力，本项目编译产物中实际用到了：级联层 `@layer`（63 处）、容器查询 `@container`（36 处）、`oklch()` / `color-mix()`（262 / 312 处）、`:has()`（148 处）、原生 `<dialog>` 与 `@starting-style`。

这意味着较旧的浏览器会出现**功能性缺陷，而不只是外观差异**：

- 缺少 `@container` 支持 → 导航栏永远不会展开，抽屉会一直保持抽屉形态
- 缺少 `:has()` 支持 → 开关与表单校验的布局错乱
- 缺少 `color-mix()` / `oklch()` 支持 → 大量颜色失效或回退成默认值
- 缺少 `@layer` 支持 → 级联层失效，样式覆盖关系被打乱

因此请以「浏览器是否支持上述特性」为准来判断兼容性，而不要仅看版本号年份。由于这是框架层面的依赖，**无法通过 polyfill 完全补救**，使用前请确认目标用户的浏览器环境。

**2. 切换分支后必须重装依赖**

`node_modules` 不受 Git 管理，切换分支**不会**自动切换依赖版本：

```bash
# 切到本分支（Bootstrap 6）
npm install

# 切回 main（Bootstrap 5.3.8）
npm ci
```

若跳过这一步，会出现「源码是 v5、依赖是 v6」（或反之）的错配 —— 页面样式与交互会明显异常，且报错信息通常不会直接指向版本不匹配，容易误判为代码 bug。

**3. 组件改为按需导入**

`src/js/ui.js` 只导入实际用到的组件（`bootstrap/js/dist/*.js`），**导入模块本身即完成数据 API 注册**，无需额外初始化。

请勿改回 `import * as bootstrap from 'bootstrap'`：该入口会连带引入 Datepicker、Combobox 等未使用的组件，并把 `vanilla-calendar-pro`、`@floating-ui/dom` 一并打进产物。

**4. 新增代码需遵循 v6 约定**

不要再使用 `--bs-*` 形式的 CSS 变量、v5 的断点/响应式类名，以及已更名的组件类。完整约定见 [`AGENTS.md`](AGENTS.md) 的「Bootstrap 6 约定」一节。

另外，`src/scss/styles.scss` 中的自定义样式位于 Bootstrap 的 `@layer` 之外，按级联层规则天然优先于组件样式，覆盖时无需再提高选择器权重。

### 已知问题

- 迁移完成度目前为「构建通过 + 类名与结构逐项核对」，**尚未进行完整的浏览器视觉验证**。以下三处仍需实机确认：
  - 导航抽屉的位置与外观 —— v6 的 drawer 默认是带内缩与圆角的悬浮面板，与 v5 贴边的 offcanvas 观感不同（如需贴边可设 `--drawer-inset: 0`）
  - `.nav-pills` 在 v6 中改为分段控件样式，类名未变但外观有变化
  - Toast 布局 —— `.toast` 在 v6 中改为纵向 flex，已相应移除 `align-items-center`
- Bootstrap 6 处于 alpha 阶段，升级到后续 alpha 版本可能再次引入破坏性变更。本分支已将版本号**固定**为 `6.0.0-alpha.1`（而非 `^6.0.0-alpha.1`），以避免 `npm install` 时被动升级。

## Todos

- [x] 翻译按钮前增加字数显示

- [x] 设置页面选项分类与自动保存提示

- [ ] 改进密钥存储方式

- [ ] IndexDB 实现翻译历史记录

- [x] File API 文档翻译

## 许可协议

GPLv3
