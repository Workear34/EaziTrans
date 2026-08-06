# EaziTrans JS 模块化设计

## 背景

当前 `src/main.js` 约 260 行，所有逻辑（设置管理、UI 交互、API 调用）混杂在单文件中。需要：
1. 拆分为职责清晰的模块
2. 引入提供商抽象层，支持 OpenAI 兼容 + Anthropic Claude 双提供商
3. 保持代码简洁，不过度拆分

## 目标文件结构

```
src/
  main.js          — 入口：初始化 + 事件绑定 + 翻译调度
  settings.js      — 设置管理（localStorage 读写、语言映射）
  ui.js            — DOM 交互（Toast、主题切换、loading 状态、复制）
  api/
    index.js       — Provider 基类 + 工厂函数 + 统一导出
    openai.js      — OpenAI 兼容提供商适配器
    claude.js      — Anthropic Claude 提供商适配器
```

## API 提供商架构

### Provider 基类（api/index.js）

```js
class Provider {
  /** 构建 fetch 请求体 */
  buildRequest(text, srcLang, tgtLang, config) {
    throw new Error('Not implemented');
  }
  /** 从 Response 流式读取并 yield 文本片段 */
  async *stream(response) {
    throw new Error('Not implemented');
  }
}

/**
 * 工厂函数，根据 provider 名称返回实例
 * @param {'openai'|'claude'} name
 * @returns {Provider}
 */
function createProvider(name) {
  // 注册表，新增提供商在此添加
}

export { createProvider, Provider };
```

### OpenAI 适配器（api/openai.js）

复用现有 `main.js:183-241` 的流式逻辑，封装为类方法：
- `buildRequest`：构建 OpenAI Chat Completions 请求体，包含 `model`、`messages`、`stream: true`
- 保留 `enable_thinking: false` 的模型特殊处理（检测 `qwen3`、`tencent/hunyuan-a13b-instruct`）
- `stream`：解析 SSE 格式，yield `choices[0].delta.content` 文本片段

### Claude 适配器（api/claude.js）

实现 Anthropic Messages API：
- `buildRequest`：构建 Claude 请求体，包含 `model`、`max_tokens`、`system`、`messages`、`stream: true`
- `max_tokens` 使用硬编码默认值 4096（翻译场景足够，无需暴露给用户配置）
- 请求头需包含 `anthropic-version` 和 `x-api-key`
- `stream`：解析 Anthropic SSE 格式，yield `content_block_delta` 文本片段

### 实现要求

**编写 API 实现前，必须先通过 web_fetch 获取官方文档：**
- OpenAI: https://platform.openai.com/docs/api-reference/chat/create-streaming
- Claude: https://docs.anthropic.com/en/api/messages-streaming

## settings.js 设计

### 导出接口

```js
export const settings = {
  provider: 'openai',  // 提供商选择
  apiUrl: '',
  apiKey: '',
  model: '',
  systemPrompt: '',
  promptTemplate: '',
  autoTranslate: true,
  theme: 'auto'
};

export function loadSettings()   // localStorage → settings 对象
export function saveSettings()   // settings 对象 → localStorage
```

### localStorage Key 映射

保持现有 key 不变（`apiUrl`、`apiKey`、`model`、`systemPrompt`、`promptTemplate`、`autoTranslate`、`theme`），新增 `provider` key。兼容用户已保存的设置。

### 语言映射

`langMap` 对象放在 `settings.js` 中导出，与翻译配置紧密相关。

## ui.js 设计

### 导出接口

```js
export function showToast(msg, type)
export function toggleLoading(show)
export function copyResult()
export function applyTheme(theme)
export function initThemeListener(settings)  // 监听系统主题变化
```

### 职责边界
- 不负责事件绑定（由 `main.js` 统一绑定）
- 不包含业务逻辑
- 只提供 UI 操作函数

## main.js 入口设计

### 初始化流程

```
import settings, loadSettings, saveSettings from './settings.js'
import { createProvider } from './api/index.js'
import { showToast, toggleLoading, applyTheme, initThemeListener, copyResult } from './ui.js'

loadSettings()          // 加载设置
applyTheme(settings.theme)
initThemeListener(settings)
// 绑定所有事件监听器
```

### 翻译数据流

```
用户点击翻译 / 自动翻译触发
  ↓
main.js 收集：sourceText、sourceLang、targetLang
  ↓
createProvider(settings.provider)
  ↓
provider.buildRequest(text, srcLang, tgtLang, settings)
  ↓
fetch(...)
  ↓
for await (const chunk of provider.stream(response)) {
  targetText.value += chunk
}
```

## 工作流要求

- 所有更改必须在新分支内进行，不在 main 分支直接修改
- 实现完成后不立即合并，先运行验证，通过后询问用户是否合并

## 验证

- `npm run dev` 启动正常
- `npm run build` 构建无报错
- OpenAI 兼容接口翻译正常
- Claude API 翻译正常
- 设置保存/加载正常
- 主题切换正常
