import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { settings, loadSettings, saveSettings } from './settings.js';
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