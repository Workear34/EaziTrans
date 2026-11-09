// Import our custom CSS
import '../scss/styles.scss'

import { settings, loadSettings, saveSettings, resetSettings, DEFAULT_SETTINGS, clampFileChunkChars } from './settings.js';
import { showToast, applyTheme, initThemeListener, Modal } from './ui.js';

// 项目版本：v0.4.0-4（43e0cc1 · 2026-11-09）
// 版本号取自最近的 tag，-N 为距该 tag 的提交数；git 信息缺失时自动省略
const versionSuffix = __GIT_COUNT__ && __GIT_COUNT__ !== '0' ? `-${__GIT_COUNT__}` : '';
const gitInfo = [__GIT_COMMIT__, __GIT_DATE__].filter(Boolean).join(' · ');
document.getElementById('version').textContent =
    `${__APP_VERSION__}${versionSuffix}${gitInfo ? `（${gitInfo}）` : ''}`;

// 将已加载的设置填充到表单
function initSettingsForm() {
  document.getElementById('provider').value = settings.provider;
  document.getElementById('apiUrl').value = settings.apiUrl;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('systemPrompt').value = settings.systemPrompt;
  document.getElementById('promptTemplate').value = settings.promptTemplate;
  document.getElementById('theme').value = settings.theme;
  document.getElementById('autoTranslate').checked = settings.autoTranslate;
  document.getElementById('fileChunkMode').value = settings.fileChunkMode;
  document.getElementById('fileChunkChars').value = settings.fileChunkChars;
  document.getElementById('model').value = settings.model;

  syncChunkControls();
  applyTheme(settings.theme);
}

// 分块方式与字数互相影响：选「不分块」时字数输入框失效并给出警告
function syncChunkControls() {
  const whole = document.getElementById('fileChunkMode').value === 'whole';
  document.getElementById('fileChunkChars').disabled = whole;
  document.getElementById('fileChunkWarning').classList.toggle('d-none', !whole);
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
  settings.fileChunkMode = document.getElementById('fileChunkMode').value;
  settings.fileChunkChars = clampFileChunkChars(document.getElementById('fileChunkChars').value);

  saveSettings();
  showToast('设置已保存');
}

// 重置确认对话框
const resetModal = new Modal(document.getElementById('resetModal'));
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
    'autoTranslate',
    'fileChunkMode',
    'fileChunkChars'
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
      if (id === 'fileChunkMode') syncChunkControls();
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

  // 单独恢复 System Prompt / User Prompt 为默认值
  document.getElementById('resetSystemPromptBtn').addEventListener('click', () => {
    document.getElementById('systemPrompt').value = DEFAULT_SETTINGS.systemPrompt;
    collectAndSave();
  });
  document.getElementById('resetPromptTemplateBtn').addEventListener('click', () => {
    document.getElementById('promptTemplate').value = DEFAULT_SETTINGS.promptTemplate;
    collectAndSave();
  });
}

loadSettings();
initSettingsForm();
initThemeListener(settings);
bindEvents();
