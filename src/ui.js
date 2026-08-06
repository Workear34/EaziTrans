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

export function copyResult() {
  const text = document.getElementById('targetText').value;
  navigator.clipboard.writeText(text)
    .then(() => showToast('已复制译文'))
    .catch(() => showToast('复制失败'));
}
