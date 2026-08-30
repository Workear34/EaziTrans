import * as bootstrap from 'bootstrap';

const toastBody = document.getElementById('toastMessage');
const toast = new bootstrap.Toast(document.getElementById('toast'));

// 模态框函数
export function showToast(msg, type = 'info') {
  toastBody.textContent = msg;
  toast.show();
}

// 翻译加载动画
export function toggleLoading(show = true) {
  document.getElementById('loadingOverlay').classList.toggle('d-none', !show);
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

// 译文复制
export function copyResult() {
  const text = document.getElementById('targetText').value;
  navigator.clipboard.writeText(text)
    .then(() => showToast('已复制译文'))
    .catch(() => showToast('复制失败'));
}

// 文本字数统计
export function initCharCount() {
  const sourceText = document.getElementById('sourceText');
  const counter = document.getElementById('textCount');

  const update = () => { counter.textContent = sourceText.value.length; };
  sourceText.addEventListener('input', update);
  update();   // 页面加载时立即算一次初始值，这样刷新后也能看到计数
}