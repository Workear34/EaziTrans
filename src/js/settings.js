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

export const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiUrl: '',
  apiKey: '',
  model: '',
  systemPrompt: '把用户提供的文本从{source_lang}翻译成{target_lang}。保留原文意思和格式，只输出译文。',
  promptTemplate: '把下面的{source_lang}翻译成{target_lang}：\n\n{text}\n\n只输出译文。',
  autoTranslate: true,
  fileChunkMode: 'auto',
  fileChunkChars: 1500,
  theme: 'auto'
};

export const settings = { ...DEFAULT_SETTINGS };

const VALID_PROVIDERS = ['openai', 'openai-responses', 'claude'];
const VALID_THEMES = ['auto', 'light', 'dark'];
const VALID_CHUNK_MODES = ['auto', 'whole'];

// 每块字数下限要能容纳一条常规字幕，上限避免一次塞太多导致超出模型上下文
export const FILE_CHUNK_MIN = 200;
export const FILE_CHUNK_MAX = 20000;

export function clampFileChunkChars(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.fileChunkChars;
  return Math.min(FILE_CHUNK_MAX, Math.max(FILE_CHUNK_MIN, n));
}

export function loadSettings() {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const value = localStorage.getItem(key);
    if (value === null) continue;

    if (key === 'provider') {
      settings.provider = VALID_PROVIDERS.includes(value) ? value : DEFAULT_SETTINGS.provider;
    } else if (key === 'theme') {
      settings.theme = VALID_THEMES.includes(value) ? value : DEFAULT_SETTINGS.theme;
    } else if (key === 'fileChunkMode') {
      settings.fileChunkMode = VALID_CHUNK_MODES.includes(value) ? value : DEFAULT_SETTINGS.fileChunkMode;
    } else if (key === 'fileChunkChars') {
      settings.fileChunkChars = clampFileChunkChars(value);
    } else if (key === 'autoTranslate') {
      settings.autoTranslate = value !== 'false';
    } else {
      settings[key] = value;
    }
  }
}

export function saveSettings() {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    localStorage.setItem(key, settings[key]);
  }
}

export function resetSettings() {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    settings[key] = DEFAULT_SETTINGS[key];
    localStorage.removeItem(key);
  }
}
