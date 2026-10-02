// 把文件内容解析为「可翻译片段 + 片段在原文中的位置」。
//
// 关键设计：每个片段只记录它在原字符串里的 [start, end) 区间，重组时按区间切回原文，
// 因此序号、时间轴、空行数量、CRLF/LF 换行风格都是逐字节保留的，
// 完全不依赖「猜格式再重新拼接」。

export const SUPPORTED_EXTENSIONS = [
  'txt', 'text', 'md', 'markdown', 'srt', 'vtt', 'lrc', 'ass', 'ssa', 'log'
];

/** 按扩展名解析文件内容 */
export function parseByExtension(fileName, content) {
  switch (getExtension(fileName)) {
    case 'srt':
    case 'vtt':
      return parseCue(content);
    case 'lrc':
      return parseLrc(content);
    case 'ass':
    case 'ssa':
      return parseAss(content);
    default:
      return parsePlain(content);
  }
}

export function getExtension(fileName) {
  const m = /\.([^.]+)$/.exec(String(fileName));
  return m ? m[1].toLowerCase() : '';
}

/** 片段在原文中的区间与文本 */
function build(content, spans) {
  return {
    segments: spans.map(s => s.text),
    /** 把译文按位置填回原文，其余部分原样保留 */
    render(translations) {
      let out = '';
      let cursor = 0;
      for (let i = 0; i < spans.length; i++) {
        out += content.slice(cursor, spans[i].start);
        out += translations[i] ?? spans[i].text;
        cursor = spans[i].end;
      }
      return out + content.slice(cursor);
    }
  };
}

// SRT / VTT：时间轴行之后、下一个空行之前即为字幕正文
// 时间轴形如 00:00:01,000 --> 00:00:03,000（毫秒分隔符逗号或点号均可，
// VTT 的 align:start 等 cue 设置也允许出现在箭头之后）
const CUE_TIMING_RE = /^[ \t]*\d{1,3}:\d{2}:\d{2}[.,]\d{1,3}[ \t]*-->[^\r\n]*\r?$/gm;
const CUE_END_RE = /\r?\n[ \t]*\r?\n|\r?\n[ \t]*\d{1,3}:\d{2}:\d{2}[.,]\d{1,3}[ \t]*-->/;

function parseCue(content) {
  const spans = [];
  CUE_TIMING_RE.lastIndex = 0;

  let m;
  while ((m = CUE_TIMING_RE.exec(content)) !== null) {
    // m[0] 以 \r? 结尾，末尾正好停在 \n 之前，跳过一个换行符即为正文起点
    const bodyStart = m.index + m[0].length + 1;
    const stop = CUE_END_RE.exec(content.slice(bodyStart));
    const bodyEnd = stop ? bodyStart + stop.index : content.length;

    // 去掉正文尾部空白，让区间只包住真正的字幕文本；空行由 render 的切片原样带出
    const text = content.slice(bodyStart, bodyEnd).replace(/\s+$/, '');
    if (text) spans.push({ start: bodyStart, end: bodyStart + text.length, text });
  }

  return build(content, spans);
}

// LRC：[mm:ss.xx] 或 [mm:ss] 时间标签之后的文本；[ti:] 这类元数据标签不翻译
// 同一条目可能带多个时间标签（如 [00:12.00][01:30.00]重复句），只取标签之后的正文
const LRC_LINE_RE = /^([ \t]*(?:\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\])+[ \t]*)([\s\S]*?)[ \t]*\r?$/gm;

function parseLrc(content) {
  const spans = [];
  LRC_LINE_RE.lastIndex = 0;

  let m;
  while ((m = LRC_LINE_RE.exec(content)) !== null) {
    const start = m.index + m[1].length;
    if (m[2]) spans.push({ start, end: start + m[2].length, text: m[2] });
  }

  return build(content, spans);
}

// ASS / SSA：只有 Dialogue 行的最后一个字段（Text）是正文，
// 前 9 个字段是 Layer/Start/End/Style/Name/边距/Effect，全部原样保留。
// Text 字段内部允许出现逗号，所以按「跳过 9 个逗号分隔的字段」定位而不是 split(',')
const ASS_DIALOGUE_RE = /^(Dialogue:)([ \t]*(?:[^,\r\n]*,){9})([\s\S]*?)[ \t]*\r?$/gm;
const ASS_KEYWORD = 'Dialogue:';

function parseAss(content) {
  const spans = [];
  ASS_DIALOGUE_RE.lastIndex = 0;

  let m;
  while ((m = ASS_DIALOGUE_RE.exec(content)) !== null) {
    const start = m.index + ASS_KEYWORD.length + m[2].length;
    if (m[3]) spans.push({ start, end: start + m[3].length, text: m[3] });
  }

  return build(content, spans);
}

// 纯文本（TXT / MD / LOG）：按空行切段。段内的换行原样保留，
// 段与段之间的空行由 render 的切片带出，因此不需要关心原文是 LF 还是 CRLF。
const PARAGRAPH_RE = /[^\r\n]+(?:\r?\n(?![ \t]*\r?\n)[^\r\n]+)*/g;

function parsePlain(content) {
  const spans = [];
  PARAGRAPH_RE.lastIndex = 0;

  let m;
  while ((m = PARAGRAPH_RE.exec(content)) !== null) {
    spans.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }

  return build(content, spans);
}