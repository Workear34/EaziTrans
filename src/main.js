import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import * as bootstrap from 'bootstrap';

// 项目版本
document.getElementById('version').textContent = `${__APP_VERSION__}`;

// Toast 代码
const toastBody = document.getElementById('toastMessage');
const toast = new bootstrap.Toast(document.getElementById('toast'));
function showToast(msg, type = 'info') {
  toastBody.textContent = msg;
  toast.show();
}

// 加载设置和默认设置
let settings = {
  apiUrl: localStorage.getItem('apiUrl') || '',
  apiKey: localStorage.getItem('apiKey') || '',
  modelMode: localStorage.getItem('modelMode') || 'preset', // 预设和自定义两种模式，这里默认预设
  model: localStorage.getItem('model') || 'Qwen/Qwen3-8B',
  systemPrompt: localStorage.getItem('systemPrompt') || '你是一个专业的翻译助手。请准确地将用户提供的文本从{source_lang}翻译成{target_lang}，保持原文的格式和含义。只返回翻译结果，不要添加任何解释。',
  promptTemplate: localStorage.getItem('promptTemplate') || '请将以下文本从{source_lang}翻译成{target_lang}：\n\n{text}\n\n请确保翻译准确、自然，保持原文的语境和风格。',
  autoTranslate: localStorage.getItem('autoTranslate') !== 'false',
  theme: localStorage.getItem('theme') || 'light-theme'
};

// 语言映射
const langMap = {
  auto: '文字本身的语言', // 让 AI 大模型自己识别语言
  'zh-hans': '简体中文',
  'zh-hant': '繁体中文',
  en: '英语',
  ja: '日语',
  ko: '韩语',
  fr: '法语',
  de: '德语',
  pt: '葡萄牙语',
  es: '西班牙语',
  ru: '俄语',
  ar: '阿拉伯语',
  hi: '印地语',
  it: '意大利语',
  nl: '荷兰语',
  th: '泰语',
  tr: '土耳其语',
  vi: '越南语',
  id: '印尼语'
};

// 初始化设置
function initSettings() {
  document.getElementById('apiUrl').value = settings.apiUrl;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('systemPrompt').value = settings.systemPrompt;   // 补上的 systemPrompt 读取
  document.getElementById('promptTemplate').value = settings.promptTemplate; // 补上的 promptTemplate 读取
  document.getElementById('theme').value = settings.theme;

  const modelSelect = document.getElementById('model');
  const customInput = document.getElementById('customModel');

  modelSelect.value = settings.modelMode === 'custom' ? 'custom' : settings.model;
  customInput.value = settings.modelMode === 'custom' ? settings.model : '';
  customInput.classList.toggle('d-none', settings.modelMode !== 'custom');

  // 加载保存的主题设置
  document.documentElement.setAttribute('data-bs-theme', settings.theme);
}

// 按钮和输入框事件
document.getElementById('saveSettings').addEventListener('click', saveSettings);
document.getElementById('swapBtn').addEventListener('click', swapLanguages);
document.getElementById('translateBtn').addEventListener('click', translate);
document.getElementById('copyBtn').addEventListener('click', copyResult);
document.getElementById('sourceText').addEventListener('input', autoTranslate);
document.getElementById('targetLang').addEventListener('change', autoTranslate);
document.getElementById('sourceLang').addEventListener('change', autoTranslate);

// 监听下拉框变化
document.getElementById('model').addEventListener('change', (e) => {
  const isCustom = e.target.value === 'custom';
  const customInput = document.getElementById('customModel');
  customInput.classList.toggle('d-none', !isCustom);

  // 切回 preset 时把下拉框当前值同步到 settings.model
  if (!isCustom) {
    settings.model = e.target.value;
  }
});

// 主题切换
function changeTheme() {
  if (theme.value === 'dark') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }
}
document.getElementById('theme').addEventListener('change', changeTheme);

// 保存设置
function saveSettings() {
  const modelSelect = document.getElementById('model');
  const customInput = document.getElementById('customModel');

  let modelMode = modelSelect.value === 'custom' ? 'custom' : 'preset';
  let finalModel = modelMode === 'custom'
    ? customInput.value.trim()
    : modelSelect.value;

  if (!finalModel) return showToast('请填写或选择模型');

  settings.apiUrl = document.getElementById('apiUrl').value;
  settings.apiKey = document.getElementById('apiKey').value;
  settings.modelMode = modelMode;
  settings.model = finalModel;
  settings.systemPrompt = document.getElementById('systemPrompt').value;
  settings.systemPrompt = document.getElementById('systemPrompt').value;
  settings.promptTemplate = document.getElementById('promptTemplate').value;
  settings.theme = document.getElementById('theme').value;

  localStorage.setItem('apiUrl', settings.apiUrl);
  localStorage.setItem('apiKey', settings.apiKey);
  localStorage.setItem('modelMode', settings.modelMode);
  localStorage.setItem('model', settings.model);
  localStorage.setItem('systemPrompt', settings.systemPrompt);
  localStorage.setItem('promptTemplate', settings.promptTemplate);
  localStorage.setItem('theme', settings.theme);

  showToast('设置已保存');
}

// 交换语言
function swapLanguages() {
  const sourceLang = document.getElementById('sourceLang');
  const targetLang = document.getElementById('targetLang');

  // 自动检测时不支持交换
  if (sourceLang.value === 'auto') {
    showToast("自动检测时不支持交换语言");
    return;
  };

  const temp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = temp;

  // 同时交换文本
  const sourceText = document.getElementById('sourceText');
  const targetText = document.getElementById('targetText');
  const tmpText = sourceText.value;
  sourceText.value = targetText.value;
  targetText.value = tmpText;
}

// 翻译时的加载动画
function toggleLoading(show = true) {
  document.getElementById('loadingOverlay').classList.toggle('d-none', !show);
}

// 自动翻译
let translateTimeout;
function autoTranslate() {
  if (!settings.autoTranslate) return;

  clearTimeout(translateTimeout);
  translateTimeout = setTimeout(() => {
    if (document.getElementById('sourceText').value.trim()) {
      translate();
    }
  }, 1000); // 单位毫秒，这里默认 1s
}

// 翻译功能（流式翻译）
async function translate() {
  const srcText = document.getElementById('sourceText').value.trim();
  if (!srcText) return showToast('请输入文本');
  if (!settings.apiUrl) return showToast('请先设置 API 地址');
  if (!settings.apiKey) return showToast('请先设置 API 密钥');

  const srcLang = document.getElementById('sourceLang').value;
  const tgtLang = document.getElementById('targetLang').value;
  if (srcLang === tgtLang) return (document.getElementById('targetText').value = srcText);

  document.getElementById('translateBtn').disabled = true;
  toggleLoading(true);
  document.getElementById('targetText').value = '';

  try {
    const res = await fetch(`${settings.apiUrl}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          {
            role: 'system',
            content: settings.systemPrompt
              .replace('{source_lang}', langMap[srcLang])
              .replace('{target_lang}', langMap[tgtLang])
          },
          {
            role: 'user',
            content: settings.promptTemplate
              .replace('{source_lang}', langMap[srcLang])
              .replace('{target_lang}', langMap[tgtLang])
              .replace('{text}', srcText)
          }
        ],
        stream: true,
        ...(settings.model.toLowerCase().includes('qwen3') ||
          settings.model.toLowerCase().includes('tencent/hunyuan-a13b-instruct')
          ? { enable_thinking: false }
          : {}) // 只针对 qwen3 和 tencent/hunyuan-a13b-instruct 打开 enable_thinking: false，否则会报错 400
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留不完整行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              document.getElementById('targetText').value += delta;
            }
          } catch (e) {
            /* ignore invalid json */
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
    showToast("翻译失败，请检查控制台日志");
  } finally {
    document.getElementById('translateBtn').disabled = false;
    toggleLoading(false);
  }
}

// 复制功能
function copyResult() {
  const text = document.getElementById('targetText').value;
  navigator.clipboard.writeText(text)
    .then(() => showToast('已复制译文'))
    .catch(() => showToast('复制失败'));
}
// 初始化
initSettings();