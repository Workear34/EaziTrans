# EaziTrans JS 模块化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 src/main.js 拆分为 settings.js、ui.js、api/ 模块，并新增 Claude 提供商支持

**Architecture:** 基类继承模式 — Provider 抽象基类定义接口，OpenAI/Claude 各自实现适配器，工厂函数统一创建实例

**Tech Stack:** ES Modules、Fetch API、ReadableStream、Bootstrap 5

## Global Constraints

- 所有更改必须在新分支 `feat/js-modularization` 内进行
- 实现完成后不立即合并，先运行验证，通过后询问用户是否合并
- 编写 API 实现前，必须先通过 web_fetch 获取官方文档
- 保持现有 localStorage key 不变，兼容用户已保存设置
- 无测试框架，验证方式为 `npm run dev` + `npm run build` + 手动测试

## File Structure

```
src/
  main.js          — 重写：初始化 + 事件绑定 + 翻译调度
  settings.js      — 新建：设置管理 + 语言映射
  ui.js            — 新建：Toast、主题、loading、复制
  api/
    index.js       — 新建：Provider 基类 + 工厂函数
    openai.js      — 新建：OpenAI 适配器
    claude.js      — 新建：Claude 适配器
index.html         — 修改：设置模态框增加提供商下拉框
```

---

### Task 1: 创建新分支

- [ ] **Step 1: 创建并切换到新分支**

```bash
git checkout -b feat/js-modularization
```

---

### Task 2: 实现 settings.js

**Files:**
- Create: `src/settings.js`

**Interfaces:**
- Produces: `settings` 对象、`loadSettings()`、`saveSettings()`、`langMap`

- [ ] **Step 1: 创建 settings.js，导出 settings 对象和 langMap**

```js
// src/settings.js

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

export const settings = {
  provider: 'openai',
  apiUrl: '',
  apiKey: '',
  model: 'Qwen/Qwen3-8B',
  systemPrompt: '你是一个专业的翻译助手。请准确地将用户提供的文本从{source_lang}翻译成{target_lang}，保持原文的格式和含义。只返回翻译结果，不要添加任何解释。',
  promptTemplate: '请将以下文本从{source_lang}翻译成{target_lang}：\n\n{text}\n\n请确保翻译准确、自然，保持原文的语境和风格。',
  autoTranslate: true,
  theme: 'auto'
};
```

- [ ] **Step 2: 实现 loadSettings() 和 saveSettings()**

在 `src/settings.js` 末尾追加：

```js
export function loadSettings() {
  settings.provider = localStorage.getItem('provider') || settings.provider;
  settings.apiUrl = localStorage.getItem('apiUrl') || settings.apiUrl;
  settings.apiKey = localStorage.getItem('apiKey') || settings.apiKey;
  settings.model = localStorage.getItem('model') || settings.model;
  settings.systemPrompt = localStorage.getItem('systemPrompt') || settings.systemPrompt;
  settings.promptTemplate = localStorage.getItem('promptTemplate') || settings.promptTemplate;
  settings.autoTranslate = localStorage.getItem('autoTranslate') !== 'false';
  settings.theme = localStorage.getItem('theme') || settings.theme;
}

export function saveSettings() {
  localStorage.setItem('provider', settings.provider);
  localStorage.setItem('apiUrl', settings.apiUrl);
  localStorage.setItem('apiKey', settings.apiKey);
  localStorage.setItem('model', settings.model);
  localStorage.setItem('systemPrompt', settings.systemPrompt);
  localStorage.setItem('promptTemplate', settings.promptTemplate);
  localStorage.setItem('autoTranslate', settings.autoTranslate);
  localStorage.setItem('theme', settings.theme);
}
```

- [ ] **Step 3: 提交**

```bash
git add src/settings.js
git commit -m "feat: add settings module with localStorage persistence"
```

---

### Task 3: 实现 ui.js

**Files:**
- Create: `src/ui.js`

**Interfaces:**
- Produces: `showToast()`、`toggleLoading()`、`copyResult()`、`applyTheme()`、`initThemeListener()`

- [ ] **Step 1: 创建 ui.js，实现 showToast 和 toggleLoading**

```js
// src/ui.js
import * as bootstrap from 'bootstrap';

const toastBody = document.getElementById('toastMessage');
const toast = new bootstrap.Toast(document.getElementById('toast'));

export function showToast(msg, type = 'info') {
  toastBody.textContent = msg;
  toast.show();
}

export function toggleLoading(show = true) {
  document.getElementById('loadingOverlay').classList.toggle('d-none', !show);
}
```

- [ ] **Step 2: 实现 applyTheme 和 initThemeListener**

在 `src/ui.js` 末尾追加：

```js
function getPreferredTheme() {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme) {
  const resolved = theme === 'auto' ? getPreferredTheme() : theme;
  document.documentElement.setAttribute('data-bs-theme', resolved);
}

export function initThemeListener(settings) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (settings.theme === 'auto') {
      applyTheme('auto');
    }
  });
}
```

- [ ] **Step 3: 实现 copyResult**

在 `src/ui.js` 末尾追加：

```js
export function copyResult() {
  const text = document.getElementById('targetText').value;
  navigator.clipboard.writeText(text)
    .then(() => showToast('已复制译文'))
    .catch(() => showToast('复制失败'));
}
```

- [ ] **Step 4: 提交**

```bash
git add src/ui.js
git commit -m "feat: add ui module with toast, theme, loading, copy"
```

---

### Task 4: 实现 API 基类与工厂函数

**Files:**
- Create: `src/api/index.js`

**Interfaces:**
- Produces: `Provider` 基类、`createProvider(name)` 工厂函数

- [ ] **Step 1: 创建 api/index.js，定义 Provider 基类和工厂函数**

```js
// src/api/index.js

export class Provider {
  buildRequest(text, srcLang, tgtLang, config) {
    throw new Error('Not implemented');
  }

  async *stream(response) {
    throw new Error('Not implemented');
  }
}

const providers = {};

export function registerProvider(name, ProviderClass) {
  providers[name] = ProviderClass;
}

export function createProvider(name) {
  const ProviderClass = providers[name];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return new ProviderClass();
}
```

- [ ] **Step 2: 提交**

```bash
git add src/api/index.js
git commit -m "feat: add Provider base class and factory function"
```

---

### Task 5: 获取 OpenAI 文档并实现 OpenAI 适配器

**Files:**
- Create: `src/api/openai.js`

**Interfaces:**
- Consumes: `Provider` 基类、`registerProvider()` 工厂注册
- Produces: OpenAI 兼容提供商实例

- [ ] **Step 1: 通过 web_fetch 获取 OpenAI 流式 API 文档**

```
web_fetch: https://platform.openai.com/docs/api-reference/chat/create-streaming
```

- [ ] **Step 2: 创建 api/openai.js，实现 OpenAIProvider 类**

根据文档实现以下逻辑：
- `buildRequest()`：构建 OpenAI Chat Completions 请求体
  - 包含 `model`、`messages`（system + user）、`stream: true`
  - 检测模型名包含 `qwen3` 或 `tencent/hunyuan-a13b-instruct` 时附加 `enable_thinking: false`
  - 请求头：`Authorization: Bearer ${apiKey}`、`Content-Type: application/json`
- `stream()`：解析 SSE 格式，yield `choices[0].delta.content` 文本片段
  - 按行分割，找到 `data: ` 前缀的行
  - 跳过 `[DONE]` 标记
  - 解析 JSON 提取 delta content

- [ ] **Step 3: 注册到工厂函数**

在 `api/openai.js` 末尾：

```js
import { registerProvider } from './index.js';
registerProvider('openai', OpenAIProvider);
```

- [ ] **Step 4: 提交**

```bash
git add src/api/openai.js
git commit -m "feat: add OpenAI compatible provider adapter"
```

---

### Task 6: 获取 Claude 文档并实现 Claude 适配器

**Files:**
- Create: `src/api/claude.js`

**Interfaces:**
- Consumes: `Provider` 基类、`registerProvider()` 工厂注册
- Produces: Anthropic Claude 提供商实例

- [ ] **Step 1: 通过 web_fetch 获取 Claude 流式 API 文档**

```
web_fetch: https://docs.anthropic.com/en/api/messages-streaming
```

- [ ] **Step 2: 创建 api/claude.js，实现 ClaudeProvider 类**

根据文档实现以下逻辑：
- `buildRequest()`：构建 Anthropic Messages API 请求体
  - 包含 `model`、`max_tokens: 4096`、`system`（系统提示词）、`messages`（user 消息）、`stream: true`
  - 请求头：`x-api-key: ${apiKey}`、`anthropic-version: 2023-06-01`、`Content-Type: application/json`
- `stream()`：解析 Anthropic SSE 格式，yield 文本片段
  - 事件类型为 `content_block_delta`，提取 `delta.text`
  - 事件类型为 `message_stop` 时结束

- [ ] **Step 3: 注册到工厂函数**

在 `api/claude.js` 末尾：

```js
import { registerProvider } from './index.js';
registerProvider('claude', ClaudeProvider);
```

- [ ] **Step 4: 提交**

```bash
git add src/api/claude.js
git commit -m "feat: add Anthropic Claude provider adapter"
```

---

### Task 7: 更新 index.html 设置界面

**Files:**
- Modify: `index.html:173-177`（设置模态框内）

**Interfaces:**
- Consumes: settings.provider
- Produces: 设置界面中新增提供商下拉框

- [ ] **Step 1: 在设置模态框中添加提供商选择下拉框**

在 `index.html` 设置模态框的 `<form>` 内，API 地址字段之前插入：

```html
<div class="mb-3">
    <label class="form-label">API 提供商</label>
    <select class="form-select" id="provider">
        <option value="openai">OpenAI 兼容</option>
        <option value="claude">Anthropic Claude</option>
    </select>
    <div class="form-text">选择要使用的 API 提供商</div>
</div>
```

- [ ] **Step 2: 提交**

```bash
git add index.html
git commit -m "feat: add provider selection dropdown to settings"
```

---

### Task 8: 重写 main.js 入口

**Files:**
- Modify: `src/main.js`（完全重写）

**Interfaces:**
- Consumes: `settings.js`（settings、loadSettings、saveSettings、langMap）
- Consumes: `ui.js`（showToast、toggleLoading、applyTheme、initThemeListener、copyResult）
- Consumes: `api/index.js`（createProvider）

- [ ] **Step 1: 重写 main.js，导入所有模块**

```js
// src/main.js
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { settings, loadSettings, saveSettings, langMap } from './settings.js';
import { createProvider } from './api/index.js';
import {
  showToast,
  toggleLoading,
  applyTheme,
  initThemeListener,
  copyResult
} from './ui.js';

// 导入提供商适配器（触发注册）
import './api/openai.js';
import './api/claude.js';

// 项目版本
document.getElementById('version').textContent = `${__APP_VERSION__}`;
```

- [ ] **Step 2: 实现 initSettings() 和事件绑定**

在 `src/main.js` 末尾追加：

```js
function initSettings() {
  document.getElementById('provider').value = settings.provider;
  document.getElementById('apiUrl').value = settings.apiUrl;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('systemPrompt').value = settings.systemPrompt;
  document.getElementById('promptTemplate').value = settings.promptTemplate;
  document.getElementById('theme').value = settings.theme;
  document.getElementById('autoTranslate').checked = settings.autoTranslate;
  document.getElementById('model').value = settings.model;

  applyTheme(settings.theme);
}

function bindEvents() {
  document.getElementById('saveSettings').addEventListener('click', () => {
    const finalModel = document.getElementById('model').value.trim();
    if (!finalModel) return showToast('请填写或选择模型');

    settings.provider = document.getElementById('provider').value;
    settings.apiUrl = document.getElementById('apiUrl').value;
    settings.apiKey = document.getElementById('apiKey').value;
    settings.model = finalModel;
    settings.systemPrompt = document.getElementById('systemPrompt').value;
    settings.promptTemplate = document.getElementById('promptTemplate').value;
    settings.theme = document.getElementById('theme').value;
    settings.autoTranslate = document.getElementById('autoTranslate').checked;

    saveSettings();
    showToast('设置已保存');
  });

  document.getElementById('swapBtn').addEventListener('click', swapLanguages);
  document.getElementById('translateBtn').addEventListener('click', translate);
  document.getElementById('copyBtn').addEventListener('click', copyResult);
  document.getElementById('sourceText').addEventListener('input', autoTranslate);
  document.getElementById('targetLang').addEventListener('change', autoTranslate);
  document.getElementById('sourceLang').addEventListener('change', autoTranslate);

  document.getElementById('theme').addEventListener('change', () => {
    applyTheme(document.getElementById('theme').value);
  });
}
```

- [ ] **Step 3: 实现 swapLanguages、autoTranslate、translate**

在 `src/main.js` 末尾追加：

```js
function swapLanguages() {
  const sourceLang = document.getElementById('sourceLang');
  const targetLang = document.getElementById('targetLang');

  if (sourceLang.value === 'auto') {
    showToast("自动检测时不支持交换语言");
    return;
  }

  const temp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = temp;

  const sourceText = document.getElementById('sourceText');
  const targetText = document.getElementById('targetText');
  const tmpText = sourceText.value;
  sourceText.value = targetText.value;
  targetText.value = tmpText;
}

let translateTimeout;
function autoTranslate() {
  if (!settings.autoTranslate) return;

  clearTimeout(translateTimeout);
  translateTimeout = setTimeout(() => {
    if (document.getElementById('sourceText').value.trim()) {
      translate();
    }
  }, 1000);
}

async function translate() {
  const srcText = document.getElementById('sourceText').value.trim();
  if (!srcText) return showToast('请输入文本');
  if (!settings.apiUrl) return showToast('请先设置 API 地址');
  if (!settings.apiKey) return showToast('请先设置 API 密钥');

  const srcLang = document.getElementById('sourceLang').value;
  const tgtLang = document.getElementById('targetLang').value;
  if (srcLang === tgtLang) {
    document.getElementById('targetText').value = srcText;
    return;
  }

  document.getElementById('translateBtn').disabled = true;
  toggleLoading(true);
  document.getElementById('targetText').value = '';

  try {
    const provider = createProvider(settings.provider);
    const res = await fetch(settings.apiUrl, provider.buildRequest(srcText, srcLang, tgtLang, settings));

    for await (const chunk of provider.stream(res)) {
      document.getElementById('targetText').value += chunk;
    }
  } catch (e) {
    console.error(e);
    showToast("翻译失败，请检查控制台日志");
  } finally {
    document.getElementById('translateBtn').disabled = false;
    toggleLoading(false);
  }
}

// 初始化
loadSettings();
initSettings();
initThemeListener(settings);
bindEvents();
```

- [ ] **Step 4: 提交**

```bash
git add src/main.js
git commit -m "feat: rewrite main.js to use modular imports"
```

---

### Task 9: 验证与测试

- [ ] **Step 1: 运行构建验证**

```bash
npm run build
```

预期：构建成功，无报错

- [ ] **Step 2: 启动开发服务器手动测试**

```bash
npm run dev
```

验证项：
- [ ] 页面正常加载，版本号显示
- [ ] 设置模态框中出现提供商下拉框
- [ ] 保存设置后刷新页面，设置保持
- [ ] 选择 OpenAI 提供商，翻译正常（流式输出）
- [ ] 选择 Claude 提供商，翻译正常（流式输出）
- [ ] 主题切换正常（浅色/深色/跟随系统）
- [ ] 复制译文功能正常
- [ ] 自动翻译（1秒防抖）正常

- [ ] **Step 3: 向用户报告结果**

告知用户验证结果，询问是否合并到 main 分支
