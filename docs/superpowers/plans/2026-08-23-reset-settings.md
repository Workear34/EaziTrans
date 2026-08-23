# 设置页重置功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在设置页添加"重置所有设置"按钮（带确认对话框），并重构 `settings.js` 的默认值逻辑。

**Architecture:** 提取 `DEFAULT_SETTINGS` 常量作为唯一默认值来源，`settings` 由它初始化；新增 `resetSettings()` 恢复默认并清空 localStorage；`loadSettings()`/`saveSettings()` 改为循环处理并修复边界问题。设置页新增危险区按钮 + Bootstrap Modal 确认框，确认后重置、回填表单、重应用主题并提示。

**Tech Stack:** Vite、原生 JS（ESM）、Bootstrap 5、localStorage。

## Global Constraints

- 界面与注释均为中文。
- 项目无测试框架：不引入测试，改为手动验证（`npm run build` + 浏览器手测）。
- `settings` 对象仍为 `export const`，保持与 `main.js`/`ui.js` 的现有导入兼容。
- localStorage 键名保持不变：`provider`、`apiUrl`、`apiKey`、`model`、`systemPrompt`、`promptTemplate`、`autoTranslate`、`theme`。
- 默认值：`provider: 'openai'`、`apiUrl: ''`、`apiKey: ''`、`model: ''`、`autoTranslate: true`、`theme: 'auto'`，systemPrompt/promptTemplate 使用现有默认文案。
- 重置仅影响设置，不影响翻译页已输入/已翻译的文本。

---

### Task 1: 重构 `src/settings.js` 默认值逻辑

**Files:**
- Modify: `src/settings.js`（整文件重写）

**Interfaces:**
- Consumes: 无（不依赖其他模块）
- Produces:
  - `export const DEFAULT_SETTINGS` — 默认设置常量对象
  - `export const settings` — 由 `{ ...DEFAULT_SETTINGS }` 初始化
  - `export function loadSettings()` — 从 localStorage 加载，白名单校验 provider/theme，键不存在时保留默认
  - `export function saveSettings()` — 循环写入全部键
  - `export function resetSettings()` — 恢复默认并清空 localStorage

- [ ] **Step 1: 重写 `src/settings.js`**

```js
export const langMap = {
  auto: '文字本身的语言',
  'zh-hans': '简体中文',
  'zh-hant': '繁体中文',
  en: '英语',
  ja: '日语',
  ko: '韩语',
  fr: '法语',
  de: '德语',
  pt: '葡萄牙语',
  es: '西班牙语',
  ru: '俄语',
  ar: '阿拉伯语',
  hi: '印地语',
  it: '意大利语',
  nl: '荷兰语',
  th: '泰语',
  tr: '土耳其语',
  vi: '越南语',
  id: '印尼语'
};

export const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiUrl: '',
  apiKey: '',
  model: '',
  systemPrompt: '把用户提供的文本从{source_lang}翻译成{target_lang}。保留原文意思和格式，只输出译文。',
  promptTemplate: '把下面的{source_lang}翻译成{target_lang}：\n\n{text}\n\n只输出译文。',
  autoTranslate: true,
  theme: 'auto'
};

export const settings = { ...DEFAULT_SETTINGS };

const VALID_PROVIDERS = ['openai', 'openai-responses', 'claude'];
const VALID_THEMES = ['auto', 'light', 'dark'];

export function loadSettings() {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = localStorage.getItem(key);
    if (value === null) continue;

    if (key === 'provider') {
      settings.provider = VALID_PROVIDERS.includes(value) ? value : DEFAULT_SETTINGS.provider;
    } else if (key === 'theme') {
      settings.theme = VALID_THEMES.includes(value) ? value : DEFAULT_SETTINGS.theme;
    } else if (key === 'autoTranslate') {
      settings.autoTranslate = value !== 'false';
    } else {
      settings[key] = value;
    }
  }
}

export function saveSettings() {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    localStorage.setItem(key, settings[key]);
  }
}

export function resetSettings() {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    settings[key] = DEFAULT_SETTINGS[key];
    localStorage.removeItem(key);
  }
}
```

- [ ] **Step 2: 验证构建通过**

Run: `npm run build`
Expected: 构建成功，无语法/模块错误。

- [ ] **Step 3: 手动验证加载与重置逻辑**

在浏览器打开 `index.html`（`npm run dev`），DevTools Console 手动验证：

```js
// 模拟脏数据：清空 systemPrompt（非空默认值字段）
localStorage.setItem('systemPrompt', '');
localStorage.setItem('provider', 'invalid-provider');
location.reload();
```
Expected:
- 刷新后设置页 `systemPrompt` 输入框为空（不再被默认值覆盖）。
- 提供商回退为 `openai`。

```js
resetSettings();
```
Expected: `settings.provider === 'openai'`、`settings.model === ''`、`settings.autoTranslate === true`，且 `localStorage.getItem('apiKey') === null`。

- [ ] **Step 4: Commit**

```bash
git add src/settings.js
git commit -m "refactor: 抽取 DEFAULT_SETTINGS 并新增 resetSettings"
```

---

### Task 2: 在 `settings.html` 添加重置按钮与确认 Modal

**Files:**
- Modify: `settings.html`（表单尾部的 `<div>` 内 + 文档末尾 Toast 之前）

**Interfaces:**
- Consumes: Task 1 的 `resetSettings()`（由 settings-page.js 调用，本任务只提供 DOM 结构）
- Produces: `#resetSettingsBtn` 按钮、`#resetModal` Modal、`#confirmResetBtn` 确认按钮

- [ ] **Step 1: 在表单尾部添加"重置所有设置"按钮**

在 `settings.html` 中 `systemPrompt`/`promptTemplate` 相关字段与 `<h2>EaziTrans 翻译</h2>` 之间，即 `autoTranslate` 的 `<div>` 之后插入：

```html
<div class="mb-3">
    <button type="button" class="btn btn-outline-danger" id="resetSettingsBtn">
        <i class="bi bi-arrow-counterclockwise"></i> 重置所有设置
    </button>
    <div class="form-text">将所有设置恢复为默认值（包括 API 地址与 API 密钥），此操作无法撤销</div>
</div>
```

- [ ] **Step 2: 添加确认对话框 Modal**

在 `<div class="toast-container ...">` 之前插入：

```html
<!-- 重置确认对话框 -->
<div class="modal fade" id="resetModal" tabindex="-1" aria-labelledby="resetModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="resetModalLabel">确认重置所有设置？</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                此操作将清除全部设置（包括 API 地址与 API 密钥）并恢复为默认值，无法撤销。
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                <button type="button" class="btn btn-danger" id="confirmResetBtn">确认重置</button>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 3: 验证页面结构与构建**

Run: `npm run build`
Expected: 构建成功。`npm run dev` 打开设置页，可见危险区样式的重置按钮；点击按钮弹出自带"取消/确认重置"的 Modal（此时 JS 未绑定，仅验证视觉结构）。

- [ ] **Step 4: Commit**

```bash
git add settings.html
git commit -m "feat: 设置页添加重置按钮与确认对话框"
```

---

### Task 3: 在 `src/settings-page.js` 绑定重置逻辑

**Files:**
- Modify: `src/settings-page.js`

**Interfaces:**
- Consumes: Task 1 的 `resetSettings()`；Task 2 的 `#resetSettingsBtn`、`#resetModal`、`#confirmResetBtn`；现有 `initSettingsForm()`、`applyTheme()`、`showToast()`、`bootstrap`
- Produces: 无新导出（仅行为）

- [ ] **Step 1: 更新导入并新增重置逻辑**

将导入行改为：

```js
import { settings, loadSettings, saveSettings, resetSettings } from './settings.js';
```

在 `bindEvents()` 定义之前新增：

```js
// 重置确认对话框
const resetModal = new bootstrap.Modal(document.getElementById('resetModal'));
const resetBtn = document.getElementById('resetSettingsBtn');
const confirmResetBtn = document.getElementById('confirmResetBtn');

// 将所有设置恢复为默认并回填表单
function resetForm() {
  resetSettings();
  initSettingsForm();
  applyTheme(settings.theme);
  showToast('已重置所有设置');
}
```

- [ ] **Step 2: 在 `bindEvents()` 内绑定事件**

在 `bindEvents()` 函数末尾追加：

```js
resetBtn.addEventListener('click', () => resetModal.show());
confirmResetBtn.addEventListener('click', () => {
  resetModal.hide();
  resetForm();
});
```

- [ ] **Step 3: 验证功能**

Run: `npm run dev`，浏览器打开设置页。
Expected:
1. 修改若干设置（如 provider 改为 claude、主题改为深色、填 API 密钥）。
2. 点击"重置所有设置" → 弹出确认 Modal。
3. 点击"取消" → Modal 关闭，设置保持不变。
4. 再次点击并点"确认重置" → 表单恢复默认（provider=openai、model 为空、主题跟随系统、自动翻译开启、各输入框为默认文案/空值），页面弹出"已重置所有设置" Toast。
5. 刷新页面，设置仍为默认值（localStorage 已清空）。

- [ ] **Step 4: 构建验证**

Run: `npm run build`
Expected: 构建成功。

- [ ] **Step 5: Commit**

```bash
git add src/settings-page.js
git commit -m "feat: 绑定重置所有设置功能"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ `DEFAULT_SETTINGS` 常量 — Task 1
- ✅ `resetSettings()` 恢复默认 + 清 localStorage — Task 1
- ✅ `loadSettings()` 白名单校验 / 键存在判定 / 严格布尔 — Task 1
- ✅ `saveSettings()` 循环复用 — Task 1
- ✅ 危险区按钮 — Task 2
- ✅ Bootstrap Modal 确认框 — Task 2
- ✅ `resetForm()`（重置 + 回填 + 重应用主题 + Toast）— Task 3
- ✅ 事件绑定 — Task 3

**2. Placeholder scan:** 全部步骤含实际代码与验证命令，无 TBD/TODO。

**3. Type consistency:** `resetSettings()` 在 Task 1 定义（无参、无返回值），Task 3 调用 `resetSettings()` 后调 `initSettingsForm()`/`applyTheme(settings.theme)`/`showToast()`——均为现有或本计划定义的同名函数，签名一致。Modal 元素 id（`resetSettingsBtn`/`resetModal`/`confirmResetBtn`）在 Task 2 与 Task 3 一致。
