import 'bootstrap-icons/font/bootstrap-icons.css';

// Import our custom CSS
import './scss/styles.scss'

// Import all of Bootstrap’s JS
import * as bootstrap from 'bootstrap'

import { settings, loadSettings, saveSettings } from './settings.js';
import { showToast, applyTheme, initThemeListener } from './ui.js';

// 项目版本
document.getElementById('version').textContent = `${__APP_VERSION__}`;

// 将已加载的设置填充到表单
function initSettingsForm() {
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

// 收集当前表单值并保存
function collectAndSave() {
  settings.provider = document.getElementById('provider').value;
  settings.apiUrl = document.getElementById('apiUrl').value.trim();
  settings.apiKey = document.getElementById('apiKey').value.trim();
  settings.model = document.getElementById('model').value.trim();
  settings.systemPrompt = document.getElementById('systemPrompt').value;
  settings.promptTemplate = document.getElementById('promptTemplate').value;
  settings.theme = document.getElementById('theme').value;
  settings.autoTranslate = document.getElementById('autoTranslate').checked;

  saveSettings();
}

function bindEvents() {
  // 防止表单内按 Enter 触发默认提交导致页面刷新
  document.querySelector('form').addEventListener('submit', (e) => e.preventDefault());

  // 所有输入/选择改动即自动保存
  const autoSaveFields = [
    'provider',
    'apiUrl',
    'apiKey',
    'model',
    'systemPrompt',
    'promptTemplate',
    'theme',
    'autoTranslate'
  ];

  for (const id of autoSaveFields) {
    const el = document.getElementById(id);
    const eventType = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' && el.type === 'text' ? 'input' : 'change';
    el.addEventListener(eventType, () => {
      collectAndSave();
      if (id === 'theme') applyTheme(document.getElementById('theme').value);
    });
  }

  // API 地址失焦时校验 URL 格式
  document.getElementById('apiUrl').addEventListener('blur', () => {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    if (!apiUrl) return;
    try {
      new URL(apiUrl);
    } catch {
      showToast('API 地址格式不正确');
    }
  });
}

loadSettings();
initSettingsForm();
initThemeListener(settings);
bindEvents();
