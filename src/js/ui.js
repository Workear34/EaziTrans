import * as bootstrap from 'bootstrap';

const toastBody = document.getElementById('toastMessage');
const toast = new bootstrap.Toast(document.getElementById('toast'), { delay: 2000 });

// 模态框函数
export function showToast(msg, type = 'info') {
  // 已显示时忽略新的提示指令，避免频繁弹出
  if (toast.isShown()) return;
  toastBody.textContent = msg;
  toast.show();
}

// 通用模态框封装
export class Modal {
  constructor(element) {
    this.modal = new bootstrap.Modal(element);
  }

  show() {
    this.modal.show();
  }

  hide() {
    this.modal.hide();
  }
}

// 按钮加载状态：显示时替换为 spinner 并禁用，隐藏时恢复原内容
const SPINNER_HTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span class="visually-hidden" role="status">Loading...</span>';

export function setButtonLoading(button, show = true) {
  if (show) {
    if (button.dataset.originalContent === undefined) {
      button.dataset.originalContent = button.innerHTML;
    }
    button.innerHTML = SPINNER_HTML;
    button.disabled = true;
  } else {
    if (button.dataset.originalContent !== undefined) {
      button.innerHTML = button.dataset.originalContent;
      delete button.dataset.originalContent;
    }
    button.disabled = false;
  }
}

// 主题设定与保存
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

// 复制任意文本到剪贴板
export function copyText(text, okMessage = '已复制') {
  navigator.clipboard.writeText(text)
    .then(() => showToast(okMessage))
    .catch(() => showToast('复制失败'));
}

// 译文复制：targetId 指定译文所在 textarea，默认文本翻译页的 targetText，
// 文件翻译页可传 'fileResult'。注意 textarea 会把 CRLF 规范化为 LF，
// 需要逐字节保真的场景请直接用 copyText() 传入原始字符串。
export function copyResult(targetId = 'targetText') {
  const target = document.getElementById(targetId);
  copyText(target ? target.value : '', '已复制译文');
}

// 字数统计：textareaId → 刷新函数，供 refreshCharCount 按 id 触发
const charCountUpdaters = new Map();

/**
 * 把文本框与它的「共 N 个字符」计数器绑定。
 * @param {string} textareaId 文本框 id
 * @param {string} counterId 计数器 span 的 id
 */
function bindCharCount(textareaId, counterId) {
  const textarea = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);
  if (!textarea || !counter) return;

  const update = () => { counter.textContent = textarea.value.length; };
  textarea.addEventListener('input', update);
  update();   // 页面加载时立即算一次初始值，这样刷新后也能看到计数
  charCountUpdaters.set(textareaId, update);
}

// 程序化赋值（如流式追加译文）不会触发 input 事件，需要在这些地方手动刷新
export function refreshCharCount(...textareaIds) {
  for (const id of textareaIds) charCountUpdaters.get(id)?.();
}

// 文本翻译页：原文与译文各一个计数器
export function initCharCount() {
  bindCharCount('sourceText', 'textCount');
  bindCharCount('targetText', 'targetCharCount');
}