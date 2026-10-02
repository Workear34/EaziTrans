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
  systemPrompt: `你是专业的翻译引擎。把用户提供的文本从{source_lang}翻译成{target_lang}，只输出译文本身，不要输出解释、注释、原文或任何多余内容。

翻译质量：
- 准确传达原意，保持原文的语气与语域：散文、说明文保持书面语气，字幕与歌词贴合口语
- 同一文件内保持术语、人名、称谓前后一致
- 专有名词、品牌名、产品名、代码标识符保留原文，不意译
- 保持原有的段落划分与行数

以下内容必须原样保留，既不翻译也不改写、不调整顺序：
- 序号：输入若含 1、2、3 这类编号，输出必须保留完全相同的编号与顺序，每条编号后紧跟该条的译文
- 时间轴与时码：00:00:01,000 --> 00:00:03,000、[00:12.00]、[mm:ss.xx]
- 字幕与脚本的结构标记：[Script Info]、[Events]、[V4+ Styles]、Format:、Dialogue:、Comment:、NOTE、STYLE、REGION、WEBVTT，以及 [ti:]、[ar:]、[al:]、[by:] 等元数据标签
- 字幕内的转义码：\\N、\\n、\\h
- Markdown 代码块（代码围栏内）与行内代码
- URL、邮箱、文件路径
- 占位符与变量：{name}、{count}、%s、%d、%1、$1
- HTML/XML 标签与实体：<tag>、</tag>、&nbsp;
- Markdown 强调标记：**粗体**、*斜体*、_斜体_

输入可能是字幕、歌词、Markdown 文档或普通文本的片段。若原文不完整或不成句，按上下文推断后翻译，不要输出「无法翻译」之类的占位说明。`,
  promptTemplate: `把下面的{source_lang}内容翻译成{target_lang}：

{text}

只输出译文本身，不要输出解释或原文。
若上面的内容带有编号，译文必须保留完全相同的编号与顺序。`,
  autoTranslate: true,
  fileChunkMode: 'auto',
  fileChunkChars: 1500,
  theme: 'auto'
};

export const settings = { ...DEFAULT_SETTINGS };

const VALID_PROVIDERS = ['openai', 'openai-responses', 'claude'];
const VALID_THEMES = ['auto', 'light', 'dark'];
const VALID_CHUNK_MODES = ['auto', 'whole'];

// 历史版本的提示词默认值。提示词已重写过一轮，若用户本地存的恰好是这些旧默认值，
// 就跟着一起升级成新默认值；用户自己改过的不动。
const LEGACY_DEFAULT_PROMPTS = new Set([
  '把用户提供的文本从{source_lang}翻译成{target_lang}。保留原文意思和格式，只输出译文。',
  '把下面的{source_lang}翻译成{target_lang}：\n\n{text}\n\n只输出译文。'
]);

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

    // 存的还是旧默认提示词时，等同于没存，继续用新的默认值
    if ((key === 'systemPrompt' || key === 'promptTemplate') && LEGACY_DEFAULT_PROMPTS.has(value)) continue;

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
