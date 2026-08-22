// Import our custom CSS
import './scss/styles.scss'

// Import all of Bootstrap’s JS
import * as bootstrap from 'bootstrap'

import { settings, loadSettings } from './settings.js';
import { createProvider, resolveEndpointUrl } from './api/index.js';
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
import './api/responses.js';

function bindEvents() {
  document.getElementById('swapBtn').addEventListener('click', swapLanguages);
  document.getElementById('translateBtn').addEventListener('click', translate);
  document.getElementById('copyBtn').addEventListener('click', copyResult);
  document.getElementById('sourceText').addEventListener('input', autoTranslate);
  document.getElementById('targetLang').addEventListener('change', autoTranslate);
  document.getElementById('sourceLang').addEventListener('change', autoTranslate);
}

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
  if (!srcText) return showToast('请输入要翻译的文本');
  if (!settings.apiUrl) return showToast('请先设置 API 地址');
  if (!settings.apiKey) return showToast('请先设置 API 密钥');
  if (!settings.model) return showToast('请先设置模型');

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
    const endpointUrl = resolveEndpointUrl(settings.apiUrl, provider.constructor.endpointPath);
    const res = await fetch(endpointUrl, provider.buildRequest(srcText, srcLang, tgtLang, settings));

    if (!res.ok) {
      let message = `请求失败（HTTP ${res.status}）`;
      try {
        const err = await res.json();
        message = err?.error?.message || err?.message || message;
      } catch {
        // 非 JSON 错误体，保留默认提示
      }
      throw new Error(message);
    }

    for await (const chunk of provider.stream(res)) {
      document.getElementById('targetText').value += chunk;
    }
  } catch (e) {
    // 控制台输出错误
    console.error(e);
    // Toast 显示错误信息
    showToast(`翻译失败：${e.message || e}`);
  } finally {
    document.getElementById('translateBtn').disabled = false;
    toggleLoading(false);
  }
}

// 初始化
loadSettings();
applyTheme(settings.theme);
initThemeListener(settings);
bindEvents();