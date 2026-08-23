# 设置页重置所有设置按钮 + 完善默认设置逻辑 — 设计

日期：2026-08-23

## 背景

设置页（`settings.html` → `src/settings-page.js`）目前采用"改动即自动保存"模式，没有任何重置能力。`src/settings.js` 中默认值硬编码在 `settings` 对象字面量内，无法复用；`loadSettings()` 使用 `localStorage.getItem(key) || settings[key]` 兜底，存在边界问题：用户清空某字段（如 API 地址）写入空字符串后，再次加载会被默认值覆盖。

## 目标

1. 在设置页添加"重置所有设置"按钮，点击后经确认对话框确认，将全部设置恢复为默认值。
2. 完善默认设置相关逻辑：抽取 `DEFAULT_SETTINGS` 常量、新增 `resetSettings()`、重构 `loadSettings()`/`saveSettings()`，修复边界问题。

## 方案

### `src/settings.js`

- 新增导出常量 `DEFAULT_SETTINGS`，包含当前 `settings` 对象的全部默认值（provider、apiUrl、apiKey、model、systemPrompt、promptTemplate、autoTranslate、theme）。
- `settings` 改为 `export const settings = { ...DEFAULT_SETTINGS }` 初始化。
- 新增导出函数 `resetSettings()`：
  - 将 `settings` 各字段恢复为 `DEFAULT_SETTINGS` 的值。
  - 移除 localStorage 中的全部设置键（`provider`、`apiUrl`、`apiKey`、`model`、`systemPrompt`、`promptTemplate`、`autoTranslate`、`theme`）。
- 重构 `loadSettings()`：
  - 对 `provider`、`theme` 做白名单校验，非法值回退默认。
  - `autoTranslate` 严格布尔解析（`!== 'false'`，保留现有语义但显式处理）。
  - 以"localStorage 键是否存在"（`localStorage.getItem(key) !== null`）判断是否覆盖默认值，修复清空字段后被默认值覆盖的问题。
- 重构 `saveSettings()`：复用 `Object.keys(DEFAULT_SETTINGS)` 循环写入，消除重复代码。

### `src/settings-page.js`

- 新增 `resetForm()`：调用 `resetSettings()` → `initSettingsForm()` 重新填充表单 → `applyTheme(settings.theme)` 重新应用主题 → `showToast('已重置所有设置')`。
- 在 `bindEvents()` 中绑定重置按钮点击事件：弹出确认对话框，确认后执行 `resetForm()`。

### `settings.html`

- 在表单尾部（"EaziTrans 翻译"标题之前）添加"重置所有设置"按钮（`btn-outline-danger`，危险区样式）。
- 新增一个隐藏的 Bootstrap Modal 作为确认对话框，含确认/取消按钮。

## 交互细节

- 确认对话框使用 Bootstrap Modal（页面已引入 bootstrap，风格统一）。
- 重置后主题立即恢复为默认 `auto`（跟随系统）。
- 重置仅影响设置，不影响翻译页已输入/已翻译的文本。

## 数据流

`按钮点击 → Modal 确认 → resetSettings()（对象恢复默认 + 清 localStorage）→ initSettingsForm()（回填表单）→ applyTheme(theme) → showToast()`

## 错误处理

- 无外部依赖调用失败场景；`localStorage.removeItem()` 对不存在的键静默成功。
- 无需新增测试框架，手动验证构建与页面功能即可。
