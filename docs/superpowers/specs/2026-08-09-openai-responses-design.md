# EaziTrans OpenAI Responses API 适配器设计

## 背景

当前 EaziTrans 支持两个提供商：OpenAI Chat Completions（`openai`）和 Anthropic Claude（`claude`）。需要新增 OpenAI Responses API 支持。

## 提供商命名

| 提供商 key | 下拉框显示名 |
|-----------|-------------|
| `openai` | OpenAI (Chat Completions API) |
| `openai-responses` | OpenAI (Responses API) |
| `claude` | Anthropic Claude |

## 文件改动

```
src/
  api/
    responses.js   — 新建：ResponsesProvider（注册名 openai-responses）
  settings.js      — VALID_PROVIDERS 加 'openai-responses'
  main.js          — 加 import './api/responses.js'（触发注册）
index.html         — 下拉框加新选项、改旧选项文案
```

## ResponsesProvider 实现

### 官方 API 要点（来自 Responses API create 文档）

- 端点：`POST /v1/responses`
- 认证：`Authorization: Bearer <apiKey>`
- 请求体：`{ model, input, stream: true }`
  - System Prompt 通过顶层 `instructions` 字段提供（非 messages 数组）
  - 用户消息：`{ role: 'user', content: string }`
  - `max_output_tokens` 可选，本项目不发送（YAGNI）
- 流式格式：SSE `event:` + `data:` 配对
  - `response.output_text.delta` 事件 → 文本在 `data.delta`
  - `response.completed` 事件 → 流结束
  - 无 `[DONE]` 终止符

### buildRequest(text, srcLang, tgtLang, config)

- 用 `langMap[srcLang]`/`langMap[tgtLang]` 替换 systemPrompt/promptTemplate 中的 `{source_lang}`/`{target_lang}`，用 `text` 替换 `{text}`
- 构建请求体：
  ```js
  {
    model: config.model,
    instructions: systemPrompt,
    input: [{ role: 'user', content: userPrompt }],
    stream: true
  }
  ```
- 返回 `{ method: 'POST', headers: { Authorization: Bearer, Content-Type: application/json }, body: JSON.stringify(body) }`

### stream(response)

- 解析 SSE `event:` + `data:` 配对格式（与 Claude 适配器结构类似）
- `response.output_text.delta` → yield `json.delta`
- `response.completed` → return（结束）
- 忽略其他事件类型

## settings.js

`VALID_PROVIDERS = ['openai', 'openai-responses', 'claude']`

## main.js

在 provider 适配器 side-effect imports 区追加：
```js
import './api/responses.js';
```

## index.html

提供商下拉框：
```html
<option value="openai">OpenAI (Chat Completions API)</option>
<option value="openai-responses">OpenAI (Responses API)</option>
<option value="claude">Anthropic Claude</option>
```

## 验证

- `npm run build` 构建无报错
- 设置下拉框出现三个选项
- 选择 Responses API 后翻译正常（流式输出）
- Chat Completions 与 Claude 功能不受影响
