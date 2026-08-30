// Import our custom CSS
import './scss/styles.scss'

// Import all of Bootstrap’s JS
import * as bootstrap from 'bootstrap'

import { settings, loadSettings, saveSettings, resetSettings } from './settings.js';
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
  showToast('设置已保存');
}

// 重置确认对话框
const resetModal = new bootstrap.Modal(document.getElementById('resetModal'));
const resetBtn = document.getElementById('resetSettingsBtn');
const confirmResetBtn = document.getElementById('confirmResetBtn');

// 将所有设置恢复为默认并回填表单
function resetForm() {
  resetSettings();
  initSettingsForm();
  applyTheme(settings.theme);
  showToast('已重置所有设置');
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

  // 文本编辑防抖计时器
  const saveTimeout = {};

  for (const id of autoSaveFields) {
    const el = document.getElementById(id);
    const isText = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text');
    const eventType = isText ? 'input' : 'change';
    el.addEventListener(eventType, () => {
      // 文本输入防抖：停止编辑 1 秒后才保存
      if (isText) {
        clearTimeout(saveTimeout[id]);
        saveTimeout[id] = setTimeout(() => collectAndSave(), 1000);
      } else {
        collectAndSave();
      }
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

  // 重置所有设置
  resetBtn.addEventListener('click', () => resetModal.show());
  confirmResetBtn.addEventListener('click', () => {
    resetModal.hide();
    resetForm();
  });
}

loadSettings();
initSettingsForm();
initThemeListener(settings);
bindEvents();
