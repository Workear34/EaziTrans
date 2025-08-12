import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import * as bootstrap from 'bootstrap'
import { auto } from '@popperjs/core';

// 默认设置
let settings = {
  apiUrl: localStorage.getItem('apiUrl') || '',
  apiKey: localStorage.getItem('apiKey') || '',
  model: localStorage.getItem('model') || 'Qwen/Qwen3-8B',
  systemPrompt: localStorage.getItem('systemPrompt') || '你是一个专业的翻译助手。请准确地将用户提供的文本从{source_lang}翻译成{target_lang}，保持原文的格式和含义。只返回翻译结果，不要添加任何解释。',
  promptTemplate: localStorage.getItem('promptTemplate') || '请将以下文本从{source_lang}翻译成{target_lang}：\n\n{text}\n\n请确保翻译准确、自然，保持原文的语境和风格。',
  autoTranslate: localStorage.getItem('autoTranslate') !== 'false'
};

// 语言映射
const langMap = {
  'auto': '文字本身的语言', // 让大模型自己识别
  'zh-hans': '简体中文',
  'zh-hant': '繁体中文',
  'en': '英语',
  'ja': '日语',
  'ko': '韩语',
  'fr': '法语',
  'de': '德语',
  'es': '西班牙语',
  'ru': '俄语'
};

// 初始化设置
function initSettings() {
  document.getElementById('apiUrl').value = settings.apiUrl;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('model').value = settings.model;
  document.getElementById('systemPrompt').value = settings.systemPrompt;
  document.getElementById('promptTemplate').value = settings.promptTemplate;
}

// 按钮和输入框事件
const savebtn = document.getElementById('saveSettings');
const swapbtn = document.getElementById('swapBtn');
const translatebtn = document.getElementById('translateBtn');
const copybtn = document.getElementById('copyBtn');
const translatetext = document.getElementById('sourceText');

savebtn.addEventListener('click', saveSettings); 
swapbtn.addEventListener('click', swapLanguages);
translatebtn.addEventListener('click', translate);
copybtn.addEventListener('click', copyResult);
translatetext.addEventListener('input', autoTranslate);

// 保存设置
function saveSettings() {
  settings.apiUrl = document.getElementById('apiUrl').value;
  settings.apiKey = document.getElementById('apiKey').value;
  settings.model = document.getElementById('model').value;
  settings.systemPrompt = document.getElementById('systemPrompt').value;
  settings.promptTemplate = document.getElementById('promptTemplate').value;

  localStorage.setItem('apiUrl', settings.apiUrl);
  localStorage.setItem('apiKey', settings.apiKey);
  localStorage.setItem('model', settings.model);
  localStorage.setItem('systemPrompt', settings.systemPrompt);
  localStorage.setItem('promptTemplate', settings.promptTemplate);
}

// 交换语言
function swapLanguages() {
  const sourceLang = document.getElementById('sourceLang');
  const targetLang = document.getElementById('targetLang');

  const temp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = temp;

  // 交换文本
  const sourceText = document.getElementById('sourceText').value;
  const targetText = document.getElementById('targetText').value;

  document.getElementById('sourceText').value = targetText;
  document.getElementById('targetText').value = sourceText;
}
// 翻译时的加载动画
function toggleLoading(show = true) {
  document.getElementById('overlay').classList.toggle('d-none', !show);
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
  }, 1000);
}

// 翻译功能（流式翻译）
async function translate() {
  const srcText = document.getElementById('sourceText').value.trim();
  if (!srcText) return alert('请输入文本');
  if (!settings.apiUrl) return alert('请先设置 API 地址');
  if (!settings.apiKey) return alert('请先设置 API 密钥');

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
        stream: true,   // 开启 SSE
        enable_thinking: false // 关闭推理模型的思考（Qwen3）
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
    alert('翻译失败，请查看控制台日志');
  } finally {
    document.getElementById('translateBtn').disabled = false;
    toggleLoading(false);
  }
}

// 复制功能
function copyResult() {
  const t = document.getElementById('targetText');
  t.select(); document.execCommand('copy');
  alert('已复制译文');
}

// 初始化
initSettings();