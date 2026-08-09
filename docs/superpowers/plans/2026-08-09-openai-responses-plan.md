# OpenAI Responses API 适配器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 OpenAI Responses API 提供商适配器，并重命名现有 OpenAI 提供商显示名

**Architecture:** 遵循现有 Provider 基类继承模式，新建 `responses.js` 注册为 `openai-responses`，与其他提供商完全隔离

**Tech Stack:** ES Modules、Fetch API、ReadableStream、Bootstrap 5

## Global Constraints

- 所有更改必须在新分支 `feat/openai-responses` 内进行
- 实现完成后不立即合并，先运行验证，通过后询问用户是否合并
- 无测试框架，验证方式为 `npm run build` + 手动测试
- System Prompt 必须放在顶层 `instructions` 字段，不放 messages 数组
- 不发送 `max_output_tokens`（可选参数，YAGNI）
- 流式终止信号为 `response.completed`，无 `[DONE]` 终止符

## File Structure

```
src/
  api/
    responses.js   — 新建：ResponsesProvider（注册名 openai-responses）
  settings.js      — 修改：VALID_PROVIDERS 加 'openai-responses'
  main.js          — 修改：加 import './api/responses.js'
index.html         — 修改：下拉框加新选项、改旧选项文案
```

---

### Task 1: 创建新分支

- [ ] **Step 1: 创建并切换到新分支**

```bash
git checkout -b feat/openai-responses
```

---

### Task 2: 实现 responses.js 适配器

**Files:**
- Create: `src/api/responses.js`

**Interfaces:**
- Consumes: `Provider`, `registerProvider` from `./index.js`; `langMap` from `../settings.js`
- Produces: 注册 `openai-responses` 提供商

- [ ] **Step 1: 创建 src/api/responses.js**

```js
// src/api/responses.js
import { Provider, registerProvider } from './index.js';
import { langMap } from '../settings.js';

export class ResponsesProvider extends Provider {
  buildRequest(text, srcLang, tgtLang, config) {
    const sourceLang = langMap[srcLang] || srcLang;
    const targetLang = langMap[tgtLang] || tgtLang;

    const systemPrompt = config.systemPrompt
      .replace(/{source_lang}/g, sourceLang)
      .replace(/{target_lang}/g, targetLang);

    const userPrompt = config.promptTemplate
      .replace(/{source_lang}/g, sourceLang)
      .replace(/{target_lang}/g, targetLang)
      .replace(/{text}/g, text);

    const body = {
      model: config.model,
      instructions: systemPrompt,
      input: [
        { role: 'user', content: userPrompt }
      ],
      stream: true
    };

    return {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };
  }

  async *stream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const json = JSON.parse(data);

            if (currentEvent === 'response.output_text.delta') {
              if (json.delta) yield json.delta;
            } else if (currentEvent === 'response.completed') {
              return;
            }
            // 忽略 response.created, response.in_progress, output_item.added 等其他事件
          } catch {
            // skip malformed JSON
          }

          currentEvent = '';
        }
      }
    }
  }
}

registerProvider('openai-responses', ResponsesProvider);
```

- [ ] **Step 2: 运行 npm run build 验证**

```bash
npm run build
```

预期：构建成功，无报错

- [ ] **Step 3: 提交**

```bash
git add src/api/responses.js
git commit -m "feat: add OpenAI Responses API provider adapter"
```

---

### Task 3: 更新 settings.js

**Files:**
- Modify: `src/settings.js:34`

**Interfaces:**
- Consumes: `openai-responses` 提供商 key
- Produces: 合法提供商列表包含新 key

- [ ] **Step 1: 更新 VALID_PROVIDERS**

将 `src/settings.js` 第 34 行：

```js
const VALID_PROVIDERS = ['openai', 'claude'];
```

改为：

```js
const VALID_PROVIDERS = ['openai', 'openai-responses', 'claude'];
```

- [ ] **Step 2: 提交**

```bash
git add src/settings.js
git commit -m "feat: register openai-responses in valid providers"
```

---

### Task 4: 更新 main.js 导入

**Files:**
- Modify: `src/main.js:15-16`

**Interfaces:**
- Consumes: `src/api/responses.js`（side-effect 注册）
- Produces: 应用启动时注册 `openai-responses`

- [ ] **Step 1: 添加 responses.js 的 side-effect import**

在 `src/main.js` 的提供商导入区（第 15-16 行）后追加：

```js
import './api/openai.js';
import './api/claude.js';
import './api/responses.js';
```

- [ ] **Step 2: 提交**

```bash
git add src/main.js
git commit -m "feat: import OpenAI Responses provider adapter"
```

---

### Task 5: 更新 index.html 提供商下拉框

**Files:**
- Modify: `index.html:174-181`（提供商下拉框）

**Interfaces:**
- Consumes: `openai`、`openai-responses`、`claude` 提供商 key
- Produces: 设置界面提供三个选项

- [ ] **Step 1: 更新下拉框选项**

将 `index.html` 提供商下拉框：

```html
<option value="openai">OpenAI</option>
<option value="claude">Anthropic Claude</option>
```

改为：

```html
<option value="openai">OpenAI (Chat Completions API)</option>
<option value="openai-responses">OpenAI (Responses API)</option>
<option value="claude">Anthropic Claude</option>
```

- [ ] **Step 2: 提交**

```bash
git add index.html
git commit -m "feat: add OpenAI Responses provider option to settings"
```

---

### Task 6: 验证与测试

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
- [ ] 设置下拉框出现三个选项：OpenAI (Chat Completions API)、OpenAI (Responses API)、Anthropic Claude
- [ ] 选择 OpenAI (Responses API) 并填写 API 地址/密钥/模型后，翻译正常（流式输出）
- [ ] 选择 OpenAI (Chat Completions API) 翻译正常（回归）
- [ ] 选择 Anthropic Claude 翻译正常（回归）
- [ ] 保存设置后刷新页面，提供商选择保持

- [ ] **Step 3: 向用户报告结果**

告知用户验证结果，询问是否合并到 main 分支
