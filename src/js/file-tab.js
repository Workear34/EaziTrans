import { settings, loadSettings } from './settings.js';
import { createProvider, resolveEndpointUrl } from './api/index.js';
import { showToast, setButtonLoading, copyText } from './ui.js';
import { decodeBuffer, ENCODINGS, DEFAULT_ENCODING } from './file/decode.js';
import { parseByExtension, getExtension, SUPPORTED_EXTENSIONS } from './file/parsers.js';
import { translateSegments, DEFAULT_BATCH_CHARS } from './file/translate.js';

// 触发 provider 注册（ESM 去重后不会重复执行）
import './api/openai.js';
import './api/responses.js';
import './api/claude.js';

const CANCELLED = 'CANCELLED';

const el = {};
const state = {
  file: null,       // 原始 File 对象（即使解码失败也保留，便于换编码重试）
  buffer: null,     // 文件原始字节，换编码重试时复用，不必重复读取
  parsed: null,     // parsers 的解析结果，解码成功前为 null
  output: '',       // 译文原文（权威副本）
  controller: null  // 进行中的 AbortController
};

export function initFileTab() {
  for (const id of [
    'fileSourceLang', 'fileTargetLang', 'fileSwapBtn', 'fileInput', 'fileDropZone',
    'fileSelectedInfo', 'fileSourcePreview', 'fileName', 'fileSize', 'fileEncoding', 'fileCharCount',
    'fileClearBtn', 'fileTranslateBtn', 'fileCancelBtn', 'fileProgressWrap',
    'fileProgressBar', 'fileStatus', 'fileResult', 'fileResultCharCount',
    'fileCopyBtn', 'fileDownloadBtn'
  ]) {
    el[id] = document.getElementById(id);
  }

  fillEncodingOptions();
  bindEvents();
  updateIdleState();
}

function fillEncodingOptions() {
  el.fileEncoding.innerHTML = '';
  for (const { value, label } of ENCODINGS) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    el.fileEncoding.append(opt);
  }
  el.fileEncoding.value = DEFAULT_ENCODING;
}

function bindEvents() {
  // 点击或键盘激活拖拽区都打开文件选择框
  el.fileDropZone.addEventListener('click', () => el.fileInput.click());
  el.fileDropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.fileInput.click();
    }
  });

  el.fileInput.addEventListener('change', () => {
    const file = el.fileInput.files?.[0];
    if (file) loadFile(file);
  });

  // 拖拽：dragenter/dragleave 会反复触发，用计数避免高亮闪烁
  let dragDepth = 0;
  el.fileDropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragDepth++;
    el.fileDropZone.classList.add('is-dragging');
  });
  el.fileDropZone.addEventListener('dragover', (e) => e.preventDefault());
  el.fileDropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) el.fileDropZone.classList.remove('is-dragging');
  });
  el.fileDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    el.fileDropZone.classList.remove('is-dragging');
    const file = e.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  });

  el.fileEncoding.addEventListener('change', () => {
    if (state.file) loadFile(state.file);
  });

  el.fileClearBtn.addEventListener('click', resetFile);
  el.fileSwapBtn.addEventListener('click', swapFileLanguages);
  el.fileTranslateBtn.addEventListener('click', translateFile);
  el.fileCancelBtn.addEventListener('click', cancelTranslation);
  el.fileCopyBtn.addEventListener('click', () => {
    if (!state.output) return showToast('还没有可复制的译文');
    copyText(state.output, '已复制译文');
  });
  el.fileDownloadBtn.addEventListener('click', downloadResult);
}

const show = (element, visible) => element.classList.toggle('d-none', !visible);

// 写入译文预览并同步字数：直接赋值不会触发 input 事件，计数器得手动更新
function setFileResult(text) {
  el.fileResult.value = text;
  el.fileResultCharCount.textContent = text.length.toLocaleString('en-US');
}

/** 读取文件、按所选编码解码、解析出可翻译片段 */
async function loadFile(file) {
  const ext = getExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    showToast(`暂不支持 .${ext || '无扩展名'} 格式`);
    return;
  }

  // 先把文件和原始字节记下来。即使后面解码或解析失败，也要保留，
  // 否则用户换个编码也重试不了、文件也清不掉，等于被卡死
  if (state.file !== file) {
    try {
      state.buffer = await file.arrayBuffer();
      state.file = file;
      state.parsed = null;
    } catch (e) {
      return showToast(`读取文件失败：${e.message || e}`);
    }
  }

  let text;
  try {
    text = decodeBuffer(state.buffer, el.fileEncoding.value).text;
  } catch (e) {
    return showLoadFailure(file, e.message || e);
  }

  let parsed;
  try {
    parsed = parseByExtension(file.name, text);
  } catch (e) {
    return showLoadFailure(file, `解析文件失败：${e.message || e}`);
  }

  if (parsed.segments.length === 0) {
    return showLoadFailure(file, '没有找到可翻译的内容，可试试换一个编码');
  }

  state.parsed = parsed;

  el.fileName.textContent = file.name;
  el.fileSize.textContent = `${formatSize(file.size)} · ${parsed.segments.length} 段 · ${text.length} 字符`;
  el.fileCharCount.textContent = text.length.toLocaleString('en-US');
  el.fileSourcePreview.value = text;
  setFileResult('');
  state.output = '';

  show(el.fileDropZone, false);
  show(el.fileSourcePreview, true);
  show(el.fileSelectedInfo, true);
  el.fileCopyBtn.disabled = true;
  el.fileDownloadBtn.disabled = true;
  updateIdleState();
}

/**
 * 加载失败时的展示：仍然显示文件名与编码下拉框，
 * 让用户能就地改编码重试，或者点清除把文件换掉。
 */
function showLoadFailure(file, message) {
  el.fileName.textContent = file.name;
  el.fileSize.textContent = message;
  el.fileCharCount.textContent = '—';
  el.fileSourcePreview.value = '';
  setFileResult('');
  state.output = '';
  state.parsed = null;

  show(el.fileDropZone, false);
  show(el.fileSourcePreview, false);
  show(el.fileSelectedInfo, true);
  el.fileCopyBtn.disabled = true;
  el.fileDownloadBtn.disabled = true;
  showToast(message);
  updateIdleState();
}

/** 未选文件 / 空闲 / 翻译中 三种状态下的按钮可用性 */
function updateIdleState() {
  if (state.controller) return;                 // 翻译中不改按钮，避免状态打架
  el.fileTranslateBtn.disabled = !state.parsed;
  // 只要还挂着文件就允许清除，哪怕解码失败也要给用户一条退路
  el.fileClearBtn.disabled = !state.file;
}

function resetFile() {
  state.file = null;
  state.buffer = null;
  state.parsed = null;
  state.output = '';
  el.fileInput.value = '';
  setFileResult('');
  el.fileSourcePreview.value = '';
  el.fileName.textContent = '';
  el.fileSize.textContent = '';
  el.fileCharCount.textContent = '0';
  el.fileEncoding.value = DEFAULT_ENCODING;
  el.fileProgressBar.style.width = '0%';
  el.fileProgressBar.setAttribute('aria-valuenow', '0');
  el.fileStatus.textContent = '';

  show(el.fileSelectedInfo, false);
  show(el.fileSourcePreview, false);
  show(el.fileProgressWrap, false);
  show(el.fileDropZone, true);
  show(el.fileCancelBtn, false);
  el.fileCopyBtn.disabled = true;
  el.fileDownloadBtn.disabled = true;
  updateIdleState();
}

function swapFileLanguages() {
  if (el.fileSourceLang.value === 'auto') return showToast('自动检测时不支持交换语言');
  const tmp = el.fileSourceLang.value;
  el.fileSourceLang.value = el.fileTargetLang.value;
  el.fileTargetLang.value = tmp;
}

function currentBudget() {
  if (settings.fileChunkMode === 'whole') return 0;
  return settings.fileChunkChars || DEFAULT_BATCH_CHARS;
}

function isBusy() {
  return !!state.controller;
}

async function translateFile() {
  if (isBusy()) return;
  if (!state.parsed) return showToast('请先选择文件');
  if (!settings.apiUrl) return showToast('请先设置 API 地址');
  if (!settings.apiKey) return showToast('请先设置 API 密钥');
  if (!settings.model) return showToast('请先设置模型');

  const srcLang = el.fileSourceLang.value;
  const tgtLang = el.fileTargetLang.value;
  if (srcLang === tgtLang) return showToast('源语言与目标语言相同，无需翻译');

  const budget = currentBudget();
  const whole = budget === 0;
  if (whole) showToast('未分块：整份文件一次翻译，耗时长且可能超出模型上下文');

  const { parsed } = state;
  const controller = new AbortController();
  state.controller = controller;

  el.fileCancelBtn.classList.remove('d-none');
  el.fileTranslateBtn.disabled = true;
  el.fileClearBtn.disabled = true;
  el.fileCopyBtn.disabled = true;
  el.fileDownloadBtn.disabled = true;
  show(el.fileProgressWrap, true);
  setProgress(0, parsed.segments.length, whole ? '正在翻译整份文件…' : '准备中…');
  setFileResult('');
  state.output = '';

  try {
    const translations = await translateSegments({
      segments: parsed.segments,
      budget,
      translateOnce: (text) => translateOnce(text, srcLang, tgtLang, controller.signal),
      onProgress: ({ done, total }) => setProgress(done, total, `正在翻译 ${done}/${total} 段`),
      shouldCancel: () => controller.signal.aborted
    });

    // 不分块时整份译文就是最终结果，不再走 render 填回原文
    const output = whole ? translations[0] : parsed.render(translations);

    // 权威副本存进 state：textarea 会把 CRLF 规范化为 LF，
    // 预览可以接受，但复制和下载必须用这份原始字符串才能保住原文件的换行风格
    state.output = output;
    setFileResult(output);
    el.fileStatus.textContent = `完成：${parsed.segments.length} 段已翻译`;
    el.fileCopyBtn.disabled = false;
    el.fileDownloadBtn.disabled = false;
  } catch (e) {
    if (e.message === CANCELLED || controller.signal.aborted) {
      el.fileStatus.textContent = '已取消';
      showToast('已取消翻译');
    } else {
      console.error(e);
      el.fileStatus.textContent = '翻译失败';
      showToast(`翻译失败：${e.message || e}`);
    }
  } finally {
    state.controller = null;
    setButtonLoading(el.fileTranslateBtn, false);
    el.fileTranslateBtn.disabled = !state.parsed;
    el.fileClearBtn.disabled = !state.parsed;
    el.fileCancelBtn.classList.add('d-none');
  }
}

function cancelTranslation() {
  state.controller?.abort();
}

/** 单次请求：构建请求 → 发 fetch → 读完流式响应 */
async function translateOnce(text, srcLang, tgtLang, signal) {
  const provider = createProvider(settings.provider);
  const endpointUrl = resolveEndpointUrl(settings.apiUrl, provider.constructor.endpointPath);
  const init = provider.buildRequest(text, srcLang, tgtLang, settings);

  const res = await fetch(endpointUrl, { ...init, signal });

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

  let out = '';
  for await (const chunk of provider.stream(res)) out += chunk;
  return stripCodeFence(out).trim();
}

// 模型有时会把结果包在 ``` 代码块里，去掉以免破坏批量切分
function stripCodeFence(text) {
  return text.replace(/^```[a-zA-Z]*\r?\n?/, '').replace(/\r?\n?```$/, '');
}

function setProgress(done, total, label) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  el.fileProgressBar.style.width = `${percent}%`;
  el.fileProgressBar.setAttribute('aria-valuenow', String(percent));
  el.fileStatus.textContent = label;
}

function downloadResult() {
  // 用 state.output 而不是 textarea.value，否则 CRLF 会被规范化为 LF
  const text = state.output;
  if (!text) return showToast('还没有可下载的译文');

  // 在扩展名前插入目标语言代号，如 movie.srt → movie.zh-hans.srt
  const name = state.file?.name ?? 'translated.txt';
  const dot = name.lastIndexOf('.');
  const suffix = el.fileTargetLang.value;
  const filename = dot > 0 ? `${name.slice(0, dot)}.${suffix}${name.slice(dot)}` : `${name}.${suffix}`;

  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
