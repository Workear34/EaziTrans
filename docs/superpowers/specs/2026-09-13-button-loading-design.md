# 按钮加载状态改造设计

日期：2026-09-13

## 背景

当前翻译进行时通过 `#loadingOverlay` 全屏半透明遮罩 + 居中 `spinner-border` 提示加载状态，由 `ui.js` 的 `toggleLoading()` 控制显示/隐藏。

目标：移除遮罩式加载，改为符合 Bootstrap 5.3 规范的按钮内加载指示（spinners/buttons），在翻译按钮内部显示 `spinner-border-sm`。

## 方案

采用通用辅助函数方案：在 `ui.js` 中新增 `setButtonLoading(button, show)`，负责按钮内容的替换与恢复，以及 `disabled` 状态切换。`main.js` 只负责在翻译流程中调用。

### 参考标记（Bootstrap 5.3）

```html
<button class="btn btn-primary" type="button" disabled>
  <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
  <span class="visually-hidden" role="status">Loading...</span>
</button>
```

### 行为

- `setButtonLoading(button, true)`：
  - 首次调用时将按钮原始 `innerHTML` 暂存到 `button.dataset.originalContent`。
  - 将按钮内容替换为 spinner 标记。
  - 设置 `button.disabled = true`。
- `setButtonLoading(button, false)`：
  - 恢复原始 `innerHTML`。
  - 设置 `button.disabled = false`。
- 重复调用同一状态应幂等。

## 改动清单

1. `index.html`
   - 删除 `#loadingOverlay` 区块。
   - 翻译按钮保留 `<i class="bi bi-translate"></i>` 作为初始内容。
2. `src/js/ui.js`
   - 移除 `toggleLoading`。
   - 新增并导出 `setButtonLoading(button, show)`。
3. `src/js/main.js`
   - 移除 `toggleLoading` 的导入与调用。
   - fetch 前调用 `setButtonLoading(translateBtn, true)`。
   - `finally` 中调用 `setButtonLoading(translateBtn, false)`，并调用 `updateTranslateBtnState()` 保持禁用状态正确。
4. `src/scss/styles.scss`
   - 移除不再使用的 `.loading` 规则。

## 范围

- 仅翻译按钮触发加载；其他按钮（交换、复制）不涉及。
- 除加载提示形式外，翻译流程与交互行为保持不变。

## 验证

- `npm run build` 构建通过。
- 手动验证：点击翻译时按钮内显示 spinner 且按钮禁用；完成后恢复翻译图标并按输入内容恢复可用状态；失败时同样恢复。
