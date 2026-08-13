export const langMap = {
  auto: '文字本身的语言',
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

export const settings = {
  provider: 'openai',
  apiUrl: '',
  apiKey: '',
  model: 'Qwen/Qwen3-8B',
  systemPrompt: '把用户提供的文本从{source_lang}翻译成{target_lang}。保留原文意思和格式，只输出译文。',
  promptTemplate: '把下面的{source_lang}翻译成{target_lang}：\n\n{text}\n\n只输出译文。',
  autoTranslate: true,
  theme: 'auto'
};

const VALID_PROVIDERS = ['openai', 'openai-responses', 'claude'];

export function loadSettings() {
  const savedProvider = localStorage.getItem('provider');
  settings.provider = VALID_PROVIDERS.includes(savedProvider) ? savedProvider : 'openai';
  settings.apiUrl = localStorage.getItem('apiUrl') || settings.apiUrl;
  settings.apiKey = localStorage.getItem('apiKey') || settings.apiKey;
  settings.model = localStorage.getItem('model') || settings.model;
  settings.systemPrompt = localStorage.getItem('systemPrompt') || settings.systemPrompt;
  settings.promptTemplate = localStorage.getItem('promptTemplate') || settings.promptTemplate;
  settings.autoTranslate = localStorage.getItem('autoTranslate') !== 'false';
  settings.theme = localStorage.getItem('theme') || settings.theme;
}

export function saveSettings() {
  localStorage.setItem('provider', settings.provider);
  localStorage.setItem('apiUrl', settings.apiUrl);
  localStorage.setItem('apiKey', settings.apiKey);
  localStorage.setItem('model', settings.model);
  localStorage.setItem('systemPrompt', settings.systemPrompt);
  localStorage.setItem('promptTemplate', settings.promptTemplate);
  localStorage.setItem('autoTranslate', settings.autoTranslate);
  localStorage.setItem('theme', settings.theme);
}